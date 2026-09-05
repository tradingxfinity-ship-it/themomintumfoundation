/* ============================================================
   THE MOMINTUM FOUNDATION — Site JS
   ------------------------------------------------------------
   SITE CONFIG — edit these values to update the site globally.
   (Statistics, donation links, and contact info live here so
   the foundation can change them in one place.)
   ============================================================ */
window.MOMINTUM = {
  // Financial donation destinations. Paste your live links here.
  // Stripe: a Payment Link, e.g. https://buy.stripe.com/xxxxxxxx
  // PayPal: a donate link, e.g. https://www.paypal.com/donate/?hosted_button_id=XXXXXXXX
  donation: {
    stripeUrl: "#stripe-payment-link", // ← replace with your Stripe Payment Link
    paypalUrl: "#paypal-donate-link",  // ← replace with your PayPal donate link
  },

  parentUrl: "https://www.momintumtx.com/",

  contact: {
    email: "hello@momintumtx.com",      // placeholder — update
    phone: "(210) 000-0000",             // placeholder — update
    address: "San Antonio, Texas",       // mailing address placeholder — update
  },

  socials: {
    facebook: "#", instagram: "#", linkedin: "#", youtube: "#",
  },

  // Live donation counter (powered by /api/donations + a KV store).
  // See DONATIONS.md to connect the store and your payment webhook.
  donationCounter: {
    apiUrl: "/api/donations",   // serverless endpoint
    pollMs: 15000,              // how often to check for new donations
    // Shown if the API isn't reachable yet (e.g. local preview / before
    // the KV store is connected). Honest zero baseline — never fabricated.
    fallback: { raisedCents: 0, donorCount: 0, goalCents: 5000000, currency: "USD", live: false },
  },

  // Homepage impact statistics (placeholders — foundation can update)
  stats: [
    { value: 1000, suffix: "+", label: "People Supported" },
    { value: 500,  suffix: "+", label: "Meals Provided" },
    { value: 100,  suffix: "+", label: "Veterans Supported" },
    { value: 50,   suffix: "+", label: "Entrepreneurs Educated" },
  ],
};

(function () {
  "use strict";
  const CFG = window.MOMINTUM;

  /* ---------- Hydrate config-driven content ---------- */
  const DON = CFG.donation || {};
  document.querySelectorAll("[data-stripe-link]").forEach((el) => el.setAttribute("href", DON.stripeUrl || "#"));
  document.querySelectorAll("[data-paypal-link]").forEach((el) => el.setAttribute("href", DON.paypalUrl || "#"));
  // Backward-compat: any generic donate link defaults to the Stripe checkout.
  document.querySelectorAll("[data-donate-link]").forEach((el) => el.setAttribute("href", DON.stripeUrl || "#"));
  document.querySelectorAll("[data-parent-link]").forEach((el) => {
    el.setAttribute("href", CFG.parentUrl);
  });
  const setText = (sel, val) => document.querySelectorAll(sel).forEach((el) => (el.textContent = val));
  setText("[data-contact-email]", CFG.contact.email);
  document.querySelectorAll("[data-contact-email-link]").forEach((el) => el.setAttribute("href", "mailto:" + CFG.contact.email));
  setText("[data-contact-phone]", CFG.contact.phone);
  document.querySelectorAll("[data-contact-phone-link]").forEach((el) => el.setAttribute("href", "tel:" + CFG.contact.phone.replace(/[^0-9+]/g, "")));
  setText("[data-contact-address]", CFG.contact.address);
  Object.entries(CFG.socials).forEach(([k, v]) => {
    document.querySelectorAll(`[data-social="${k}"]`).forEach((el) => el.setAttribute("href", v));
  });

  /* ---------- Sticky nav shadow ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-menu");
  if (burger && menu) {
    const toggle = (open) => {
      const isOpen = open ?? !menu.classList.contains("open");
      menu.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle());
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 860) toggle(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up statistics ---------- */
  const fmt = (n) => n.toLocaleString("en-US");
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          if (reduce) e.target.textContent = fmt(parseInt(e.target.dataset.count, 10)) + (e.target.dataset.suffix || "");
          else animateCount(e.target);
          cio.unobserve(e.target);
        }
      }),
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Active nav link (by page + hash) ---------- */
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if ((href === "index.html" || href === "./" ) && (path === "index.html" || path === "")) return;
    if (href.startsWith(path) && path !== "index.html" && path !== "") a.classList.add("active");
  });

  /* ---------- Accessible forms (demo submit) ---------- */
  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const success = form.querySelector(".form-success");
      if (success) {
        success.classList.add("show");
        success.setAttribute("role", "status");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
      const fileLabel = form.querySelector("[data-file-label]");
      if (fileLabel) fileLabel.textContent = fileLabel.dataset.default || "";
    });
  });

  /* ---------- File input label ---------- */
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    const label = input.closest(".field")?.querySelector("[data-file-label]");
    if (label) {
      label.dataset.default = label.textContent;
      input.addEventListener("change", () => {
        const files = input.files;
        label.textContent = files && files.length
          ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
          : label.dataset.default;
      });
    }
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Live donation counter ---------- */
  (function donationCounter() {
    const root = document.getElementById("donationCounter");
    if (!root) return;
    const cfg = CFG.donationCounter || {};
    const elAmount = root.querySelector("[data-raised]");
    const elGoal = root.querySelector("[data-goal]");
    const elDonors = root.querySelector("[data-donors]");
    const elFill = root.querySelector("[data-fill]");
    const elLive = root.querySelector("[data-live]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const money = (cents, currency) =>
      (Math.max(0, cents) / 100).toLocaleString("en-US", {
        style: "currency", currency: currency || "USD", maximumFractionDigits: 0,
      });

    let shownRaised = null; // last displayed cents (for animating up)

    const animateMoney = (from, to, currency) => {
      if (reduce || from === null) { elAmount.textContent = money(to, currency); return; }
      const start = performance.now(), dur = 1000;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        elAmount.textContent = money(Math.round(from + (to - from) * eased), currency);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const render = (d) => {
      const raised = Math.max(0, d.raisedCents | 0);
      const goal = Math.max(1, d.goalCents | 0);
      animateMoney(shownRaised, raised, d.currency);
      shownRaised = raised;
      if (elGoal) elGoal.textContent = money(goal, d.currency);
      if (elDonors) elDonors.textContent = (d.donorCount | 0).toLocaleString("en-US");
      if (elFill) elFill.style.width = Math.min(100, Math.round((raised / goal) * 100)) + "%";
      if (elLive) elLive.textContent = d.live ? "Live donation tracker" : "Donation tracker";
      root.classList.toggle("is-live", !!d.live);
    };

    let firstLoad = true;
    const load = async () => {
      try {
        const r = await fetch(cfg.apiUrl, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!r.ok) throw new Error(r.status);
        render(await r.json());
      } catch {
        if (firstLoad) render(cfg.fallback || { raisedCents: 0, donorCount: 0, goalCents: 5000000, currency: "USD", live: false });
        // On later failures keep the last good value on screen.
      } finally {
        firstLoad = false;
      }
    };

    load();
    if (cfg.pollMs > 0) setInterval(load, cfg.pollMs);
  })();

  /* ---------- Branded image fallback ----------
     If a photo fails to load (offline / placeholder swap), show an
     on-brand navy→yellow gradient tile instead of a broken image. */
  const brandFallback = (alt) => {
    const label = (alt || "Photo").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='%230A1E32'/><stop offset='1' stop-color='%23274863'/>
        </linearGradient>
      </defs>
      <rect width='800' height='600' fill='url(%23g)'/>
      <circle cx='650' cy='120' r='150' fill='%23FAE14C' opacity='0.14'/>
      <circle cx='140' cy='520' r='110' fill='%23FAE14C' opacity='0.10'/>
      <g transform='translate(400 262)'>
        <rect x='-34' y='-34' width='68' height='68' rx='18' fill='%23FAE14C'/>
        <path d='M-14 6 l10 10 l20 -24' stroke='%230A1E32' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
      </g>
      <text x='400' y='372' fill='%23C6D2DE' font-family='Plus Jakarta Sans, Arial, sans-serif' font-size='26' font-weight='700' text-anchor='middle'>${label}</text>
      <text x='400' y='406' fill='%237C8EA0' font-family='Plus Jakarta Sans, Arial, sans-serif' font-size='16' text-anchor='middle'>The Momintum Foundation</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + svg.replace(/\n\s*/g, " ");
  };
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.src = brandFallback(img.getAttribute("alt"));
    });
  });
})();
