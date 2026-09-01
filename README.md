# The Momintum Foundation — Website

A polished, responsive, accessible nonprofit website.
**Message:** _"Helping People Move Forward."_

## Files
```
index.html      Homepage (all sections)
donate.html     Dedicated donate page (money / items / collectibles + forms)
css/styles.css  Design system (brand tokens: yellow #FAE14C, navy #0A1E32, white)
js/main.js      Config + interactions (nav, mobile menu, count-up, reveal, forms)
assets/         Drop your own photos here
```

## Run locally
No build step needed. Serve the folder over HTTP so the CSS/JS load:
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 . (Any static host works: Netlify, Vercel, GitHub Pages, etc.)

## Update content (no code changes needed for the common items)
Edit the **SITE CONFIG** block at the top of `js/main.js`:

- **`donationUrl`** — replace `#donation-platform` with your live payment link
  (Donorbox, Givebutter, PayPal Giving, Stripe Payment Link, …). It automatically
  fills every "Donate Money" button and suggested-amount link.
- **`contact`** — email, phone, mailing address (auto-populated across the site + footer).
- **`socials`** — Facebook / Instagram / LinkedIn / YouTube links.
- **`stats`** — the homepage impact numbers (also editable directly in `index.html`).

## Photos
Photography currently uses stock placeholders. Replace the `src` URLs in the HTML
with your own authentic images (families, children learning, food programs, veterans,
volunteers, community events). If an image ever fails to load, an on-brand navy/yellow
placeholder is shown automatically.

## Forms
The Item and Collectible donation forms are demo forms (client-side confirmation only).
To go live, connect them to your email/CRM (e.g. Formspree, Basin, Netlify Forms,
or a backend endpoint) by adding an `action`/handler to each `<form data-demo-form>`.

## Content notes
- Impact statistics, stories, and founder bios are clearly marked **placeholders**.
- No statistics, testimonials, partnerships, or bios have been fabricated.
- Collectible/item submissions state they are reviewed and not guaranteed to be accepted.

© 2026 The Momintum Foundation · Operated by Momintum TX (https://www.momintumtx.com/)
