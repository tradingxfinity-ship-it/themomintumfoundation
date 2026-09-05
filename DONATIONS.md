# Live Donation Counter — Setup

The homepage hero shows a **live "total raised" counter** that animates up as
donations arrive. It's powered by:

- **`api/donations.js`** — a Vercel serverless function (the API).
- A **Redis‑compatible KV store** that holds the running total.
- Your **payment platform's webhook**, which calls the API on each donation.

Until you complete the steps below, the counter shows an honest **$0 baseline**
(nothing is fabricated) and a grey "Donation tracker" label. Once connected, it
turns into a green **"Live donation tracker"** and updates automatically.

---

---

## Donate buttons (PayPal + Stripe)

The Monetary Donation section shows two buttons — **Donate with Card** (Stripe)
and **Donate with PayPal**. Point them at your live links in **`js/main.js`**:

```js
window.MOMINTUM = {
  donation: {
    stripeUrl: "https://buy.stripe.com/XXXXXXXX",                     // Stripe Payment Link
    paypalUrl: "https://www.paypal.com/donate/?hosted_button_id=XXXX", // PayPal donate link
  },
  ...
```

- **Stripe** — Dashboard → Payment Links → create a link (enable "Let customers
  choose amount" so donors set their own gift). Paste the `https://buy.stripe.com/…` URL.
- **PayPal** — paypal.com → create a **Donate** button / donation link, or use a
  `https://www.paypal.com/donate/?hosted_button_id=…` (or `paypal.me/…`) URL.

Donors pick their amount on the secure Stripe/PayPal page. To also feed the live
counter, connect each platform's webhook below.

---

## 1. Create a KV store (once)

Easiest: **Vercel → your project → Storage → Create → KV** (Upstash Redis).
Vercel automatically adds these env vars to the project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

(You can instead use Upstash directly and set `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN` — the function accepts either pair.)

## 2. Set the counter's env vars (Vercel → Settings → Environment Variables)

| Variable | Example | Meaning |
|---|---|---|
| `DONATION_GOAL_CENTS` | `5000000` | Fundraising goal in **cents** ($50,000). |
| `DONATION_CURRENCY` | `USD` | ISO currency code. |
| `DONATION_WEBHOOK_SECRET` | `a-long-random-string` | Shared secret that protects the increment endpoint. |
| `DONATION_BASELINE_CENTS` | `0` | Real amount already raised before the counter went live (optional). |
| `DONATION_BASELINE_DONORS` | `0` | Real donor count before go‑live (optional). |

Redeploy after adding them.

## 3. Point your payment platform at the webhook

On every successful donation, have your platform **POST** to:

```
https://<your-domain>/api/donations
```

with header `x-momintum-secret: <DONATION_WEBHOOK_SECRET>` and JSON body:

```json
{ "amountCents": 5000 }
```

(`{ "amount": 50 }` in dollars also works. Add `"countDonor": false` to add money
without incrementing the supporter count.)

The endpoint increments the total **atomically** and returns the new totals.
The hero counter polls `GET /api/donations` every 15s (configurable in
`js/main.js` → `MOMINTUM.donationCounter`) and animates to the new number.

### Platform notes

- **Stripe** — Dashboard → Developers → Webhooks → add endpoint for
  `checkout.session.completed`. Have a small relay (or a Zapier/Make step) read
  `amount_total` and POST `{ "amountCents": amount_total }` to `/api/donations`
  with the `x-momintum-secret` header. (For production, verify the Stripe signature
  in the relay before forwarding.)
- **PayPal** — enable a **webhook** (or IPN) for completed donations. Map the paid
  amount to dollars and POST `{ "amount": <dollars> }` (the API converts to cents)
  with the secret header.
- No‑code option — **Zapier/Make**: trigger = "new Stripe payment" or "new PayPal
  sale", action = POST to the URL above with the header and body.

## 4. Test it

```bash
# Read current totals
curl https://<your-domain>/api/donations

# Simulate a $50 donation (use your real secret)
curl -X POST https://<your-domain>/api/donations \
  -H "x-momintum-secret: <DONATION_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"amountCents":5000}'
```

Reload the homepage — the counter reflects the new total within ~15 seconds.

---

## Adjusting the design

- **Goal / currency** — env vars above (no code change).
- **Poll interval / API path / offline fallback** — `MOMINTUM.donationCounter` in `js/main.js`.
- **Look** — `.hero-counter` styles in `css/styles.css`.

## Resetting totals

Delete the keys `momintum:raised_cents` and `momintum:donor_count` in your KV store
(or set them to `0`). Baselines stay in the env vars.
