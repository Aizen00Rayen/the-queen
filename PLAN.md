# The Queen — Rebuild Plan (v2)

> Haute Dermatologie · Algeria · Cash-on-delivery e-commerce
> Stack: **React 18 + Vite** (front) · **Node.js / Express** (back) · **SQLite (better-sqlite3)** · single Node app for **Hostinger shared hosting**

---

## 1. What we recovered from the old site (the-queen.shop)

| Asset | Status |
|---|---|
| Products (3) — same names, prices, compare prices, SKUs, stock, tags, descriptions | ✅ imported into seed |
| 58 wilayas + delivery prices (home 600 DA / stop-desk 400 DA) | ✅ imported |
| Logo (black + white variants), product shots, transparent bottles, before/after faces | ✅ downloaded → upscaled 2×, sharpened, WebP |
| Copy (FR/EN): brand story, ingredients, ritual steps, testimonials, stats (+94% éclat, +89% hydratation, −48% ridules) | ✅ reused & rewritten |

Products: **Sérum Vitamine C Pure 30mL** — 4 200 DA (5 % off 4 800) · **Sérum Acide Hyaluronique 30mL** — 3 900 DA (4 500) · **Le Duo Royal (2×30mL)** — 7 400 DA (8 100).

⚠️ Security note: the old bundle contained an "auto-fill admin credentials" button — change those credentials / take the old app down.

## 2. Inspiration benchmark

| Brand | What we take |
|---|---|
| **Aesop** | Editorial pacing, generous whitespace, calm typography |
| **La Mer / Augustinus Bader** | Dark luxury hero, science storytelling, ingredient "molecules" |
| **Charlotte Tilbury** | Gold accents, "royal" glamour, bundles/gifting merchandising |
| **Rare Beauty / Fenty** | Bold motion, big type, social proof, sticky add-to-cart |
| **The Ordinary** | Clear actives / % / regimen builder |
| **Retrouvé, Dr. LEVY** | Minimal, editorial, science-backed luxury |

## 3. Visual identity — "Royal Noir & Liquid Gold"

- **Palette**: Noir `#0B0A09` · Ivory `#F5EFE6` · Champagne gold `#C9A66B` / `#E7CF9F` · Vitamin-C amber `#E8781E` · Hyaluronic azure `#2A8FD8` · Rose blush `#E9C9C1`
- **Type**: *Bodoni Moda* (display, fashion-house contrast, italic for emphasis) · *Manrope* (UI/body) · *Noto Kufi Arabic* (AR)
- **Marks**: original "theQueen" wordmark (upscaled, light/dark) + new **crown-Q monogram** (SVG) for favicon, loader, seals
- **Motion language**: slow luxurious ease `cubic-bezier(.16,1,.3,1)`, letter-by-letter reveals, golden liquid shader, magnetic buttons, smooth scroll (Lenis), parallax bottles, grain overlay
- **Product colour-coding**: each product page re-themes itself (amber for Vit C, azure for HA, gold for the Duo)

## 4. Storefront (FR + AR with RTL)

1. **Preloader** — monogram draws itself, gold fill
2. **Home** — WebGL liquid-gold hero + floating bottle with mouse tilt · marquee · "Les icônes" product showcase · horizontal-scroll actives (Vit C 15 %, Vit E, HA tri-moléculaire, eau de rose) · clinical results counters · before/after slider · Ritual Jour/Nuit switch (sun ↔ moon re-theme) · Duo Royal bundle spotlight · testimonials · delivery/COD promise · newsletter
3. **Shop** — filters by category, sort, animated grid, quick-add
4. **Product page** — themed colour world, sticky gallery w/ zoom, benefits, how-to, INCI, accordion FAQs, related, sticky mobile add-to-cart
5. **Cart drawer** — free-shipping progress bar, upsell to the Duo
6. **Checkout (one page, COD)** — name, phone (validated DZ format), wilaya (58), commune, address, home vs stop-desk with live price, coupon, order summary → confirmation page with order number
7. **Track my order** — order # + phone → status timeline
8. **About / Story**, **Contact**, **FAQ**, legal pages, 404

## 5. Admin dashboard (`/admin`)

- **Auth**: JWT + bcrypt, rate-limited login
- **Dashboard**: revenue (delivered / expected), orders today, conversion of statuses, 30-day chart, top products, low-stock alerts, recent orders
- **Products**: CRUD, multi-image upload (auto WebP via sharp), price / compare price, SKU, tags, category, featured, active, low-stock threshold
- **Stock**: current stock, adjust (+/−) with reason, full movement history (order, cancel, return, manual)
- **Orders**: list w/ status tabs + search + date filter, detail drawer, status timeline with notes, edit customer info, print bordereau, CSV export
  - Statuses: `pending` Nouvelle → `confirmed` Confirmée → `preparing` En préparation → `shipped` Expédiée → `delivered` Livrée · plus `no_answer` Injoignable · `cancelled` Annulée · `returned` Retour
  - Stock logic: reserved at order creation; restored automatically on cancel/return; re-deducted if reopened
- **Shipping**: 58 wilayas, home/stop-desk prices, enable/disable
- **Coupons**: % or fixed, min order, usage limit, expiry
- **Settings**: phone, WhatsApp, Instagram/TikTok, announcement bar, free-shipping threshold

## 6. Backend API (Express)

`/api/products`, `/api/products/:slug`, `/api/categories`, `/api/wilayas`, `/api/coupons/validate`, `/api/orders` (POST), `/api/orders/track`, `/api/settings`, `/api/newsletter` · `/api/admin/*` (auth, stats, products, upload, stock, orders, wilayas, coupons, settings, export)
Security: helmet, rate limits on orders/login, server-side price recompute (never trust client totals), input validation, honeypot anti-spam.

## 7. Hostinger deployment

- One Node app: `server/index.js` serves `/api` + the built React app + `/uploads`
- `npm run build` → builds client into `server/public`
- On Hostinger hPanel → Node.js app → entry `server/index.js`, `npm install`, set env `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- SQLite file in `server/data/` (persisted, back it up)

See `README.md` for exact steps.
