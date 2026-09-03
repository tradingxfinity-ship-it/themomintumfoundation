/* ============================================================
   Live donation total — The Momintum Foundation
   ------------------------------------------------------------
   Vercel serverless function (zero-config: any file in /api).

   GET  /api/donations
        → { raisedCents, donorCount, goalCents, currency, live, updatedAt }
        Called by the hero counter (polled every few seconds).

   POST /api/donations           (secured with a shared secret)
        Header: x-momintum-secret: <DONATION_WEBHOOK_SECRET>
        Body:   { "amountCents": 5000 }   // or { "amount": 50 }
        → increments the running total + donor count atomically.
        Call this from your payment platform's webhook (Stripe,
        Donorbox, Givebutter, …). See DONATIONS.md for wiring.

   Storage: a Redis-compatible KV store via its REST API.
   Works with Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) or
   Upstash (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
   If no store is configured, GET returns the baseline so the
   site still renders, and POST responds 501 (not configured).
   ============================================================ */

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const RAISED_KEY = "momintum:raised_cents";
const DONORS_KEY = "momintum:donor_count";

// Tunable via Vercel env vars (all optional).
const GOAL_CENTS = int(process.env.DONATION_GOAL_CENTS, 5000000); // default goal: $50,000
const CURRENCY = process.env.DONATION_CURRENCY || "USD";
const BASELINE_RAISED = int(process.env.DONATION_BASELINE_CENTS, 0); // real amount raised before this counter went live
const BASELINE_DONORS = int(process.env.DONATION_BASELINE_DONORS, 0);
const SECRET = process.env.DONATION_WEBHOOK_SECRET || "";

function int(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
const configured = () => Boolean(REDIS_URL && REDIS_TOKEN);

async function redis(path) {
  const r = await fetch(`${REDIS_URL}/${path}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const j = await r.json();
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-momintum-secret");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      let raised = BASELINE_RAISED;
      let donors = BASELINE_DONORS;
      if (configured()) {
        const [rr, dd] = await Promise.all([redis(`get/${RAISED_KEY}`), redis(`get/${DONORS_KEY}`)]);
        raised = BASELINE_RAISED + (parseInt(rr, 10) || 0);
        donors = BASELINE_DONORS + (parseInt(dd, 10) || 0);
      }
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        raisedCents: raised,
        donorCount: donors,
        goalCents: GOAL_CENTS,
        currency: CURRENCY,
        live: configured(),
        updatedAt: Date.now(),
      });
    }

    if (req.method === "POST") {
      if (!SECRET || req.headers["x-momintum-secret"] !== SECRET) {
        return res.status(401).json({ error: "unauthorized" });
      }
      if (!configured()) return res.status(501).json({ error: "storage not configured" });

      const body = typeof req.body === "object" && req.body ? req.body : safeJson(req.body);
      const amountCents = Math.round(
        Number(body.amountCents != null ? body.amountCents : body.amount != null ? body.amount * 100 : NaN)
      );
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        return res.status(400).json({ error: "invalid amount" });
      }
      const countDonor = body.countDonor === false ? 0 : 1;

      const [raisedTotal, donorTotal] = await Promise.all([
        redis(`incrby/${RAISED_KEY}/${amountCents}`),
        countDonor ? redis(`incrby/${DONORS_KEY}/${countDonor}`) : redis(`get/${DONORS_KEY}`),
      ]);
      return res.status(200).json({
        raisedCents: BASELINE_RAISED + (parseInt(raisedTotal, 10) || 0),
        donorCount: BASELINE_DONORS + (parseInt(donorTotal, 10) || 0),
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
};

function safeJson(s) { try { return JSON.parse(s || "{}"); } catch { return {}; } }
