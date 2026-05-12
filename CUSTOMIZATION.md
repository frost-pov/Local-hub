# Customising Local Hub (start here)

Short map of **where to change copy, images, and behaviour**. For deploy + database steps, use [`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md). For product vision and rules, see [`CONTEXT.md`](./CONTEXT.md).

---

## 1. Platform keys & demo vs live data

| What | Where |
|------|--------|
| Supabase **Project URL** + **anon** key | Every page’s `<script>window.__LOCALHUB = { supabaseUrl, supabaseAnonKey }` (e.g. [`index.html`](./index.html) head). Same object is aliased as `window.__SOKO`. |
| Force **demo catalog** even with real keys | Add `forceDemo: true` inside `window.__LOCALHUB`. Logic: [`js/core/config.js`](./js/core/config.js) (`shouldUsePlaceholders`, `isSupabaseConfigured`). |

When keys look valid, the app loads **live** vendors/products from Supabase instead of placeholders.

---

## 2. Demo mode only — fake shops & products (`placeholders.js`)

File: [`js/data/placeholders.js`](./js/data/placeholders.js) (large comment block at the top summarises this).

| Customise | Look for |
|-----------|----------|
| **Shop names, blurbs, areas** | `V(n, slug, name, tagline, description, story, category, area, …)` rows inside `placeholderVendors`. |
| **Product titles, descriptions, prices** | `demoProduct(seq, 'vendor-slug', { title, description, price, … })` in `placeholderProducts`. |
| **Product images (default)** | `RETAIL_CATALOG_SLUGS` + `catalogImg(seq)` — Unsplash IDs rotated by product index. Override any row with `images: [{ url: 'https://…', alt: '…' }]`. |
| **Wide hero banners on cards** | `BANNER_*` constants, or inline `retailWide('photo-…', 1600, 900)`. |
| **Small round logos** | `L(n)` — Lorem Picsum thumbnails (stable IDs). |
| **Map pins (preview map)** | `AREA_GEO` + jitter in `.map()` on `placeholderVendors` (`map_lat` / `map_lng`). |
| **“Their website” link in ghost strip** | `.map()` sets `website_url` to a fake `https://{slug}.shops.demo` URL. In production you set real URLs in the database (below). |

**Money:** `price` is in **cents** (e.g. `250000` = Ksh 2,500).

---

## 3. Marketing / landing page imagery (not the catalog)

| Area | Where |
|------|--------|
| Hero + editorial `<img>` tags | [`index.html`](./index.html) — search for `images.unsplash.com`. |
| CSS background variables (`--hub-*`) | [`css/design-system.css`](./css/design-system.css) — same style of Unsplash URLs for strips, rails, mosaics. |

These are **static** in HTML/CSS; they do not read from Supabase.

---

## 4. Branding (name & tagline in demo)

Optional on `window.__LOCALHUB`:

- `platformName` — replaces nav/footer “Local Hub” lockup in demo.
- `platformTagline` — footer + `<title>` suffix.

Handled in [`js/pages/home.js`](./js/pages/home.js) (`loadBranding`). With Supabase configured, the app can read `platform_settings` instead (same file).

---

## 4b. Customer vendor directory page

| What | Where |
|------|--------|
| **`vendors.html`** | Full-page grid of vendors (search + category pills). Clean URL on Vercel: **`/vendors`**. |
| **Boot logic** | `bootVendorsPage`, `loadVendorsDirectory`, `wireVendorsDirectoryPills`, `wireVendorsDirectorySearch` in [`js/pages/home.js`](./js/pages/home.js). |
| **Nav / footer** | [`partials/nav.html`](./partials/nav.html) → “Vendors”; [`partials/footer.html`](./partials/footer.html) → “All vendors”. |

Copy the same `window.__LOCALHUB` script into `vendors.html` as other pages (already included in the template).

---

## 5. Connecting vendors to **their own** websites

**You are not “integrating” their checkout.** Their external site is an **optional outbound link** (marketing, lookbook, booking). **Orders still go through Local Hub** when you use this marketplace checkout.

### Production (Supabase)

1. Ensure the column exists: **`vendors.website_url`** — included in [`supabase/schema.sql`](./supabase/schema.sql). Existing projects: run [`supabase/migrations/002_vendor_website_url.sql`](./supabase/migrations/002_vendor_website_url.sql) once.
2. Set **Table Editor → vendors → `website_url`** to a full URL, e.g. `https://theirbrand.com` (or paste without `https://`; the UI normalises to https where possible).

The **Their website** button appears on:

- The vendor storefront header ([`js/pages/vendor-loader.js`](./js/pages/vendor-loader.js)).
- The home “ghost” discovery strip when placeholders are active and `website_url` is set (`website_url` is synthetic in demo data).

Normalisation helper: [`js/core/utils.js`](./js/core/utils.js) — `safeHttpUrl`.

---

## 6. After GitHub + Vercel only — what’s usually still left

If the site is **live on Vercel** and the repo is on **GitHub**, you often still need to:

1. **Supabase** — Create a project, run [`supabase/schema.sql`](./supabase/schema.sql), paste **Project URL + anon key** into **every** HTML page’s `window.__LOCALHUB` (see list in [`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md)), or you stay in **demo mode** forever.
2. **Real catalog** — Insert `vendors` rows (`is_approved = true`, `is_suspended = false`) and `products` (`images` as JSON array with `url`), or the live home/directory grids stay empty.
3. **Optional migration** — If the DB predates `website_url`, run [`supabase/migrations/002_vendor_website_url.sql`](./supabase/migrations/002_vendor_website_url.sql).
4. **M‑Pesa / server callbacks** — Checkout may still be demo or partial until Daraja + Edge Functions (or your backend) are wired.
5. **Auth & admin** — Vendor onboarding, super-admin, and RLS tightening for production.

---

## 7. Deeper backlog (reference)

Beyond the GitHub+Vercel checklist above: richer **vendor-admin** screens, production **RLS**, **featured** product strategy, optional **build-time env** injection for Supabase keys (instead of repeating the script on each HTML file). Details: [`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md), [`CONTEXT.md`](./CONTEXT.md).

---

## 8. File finder (quick reference)

| Topic | Primary files |
|--------|----------------|
| Demo catalog | `js/data/placeholders.js` |
| Home grid, ghost strip, search | `js/pages/home.js` |
| Single vendor shop page | `js/pages/vendor-loader.js`, `vendor.html` |
| Cart / checkout behaviour | `js/ui/cart.js`, `js/pages/checkout.js`, `checkout.html` |
| Supabase client | `js/core/supabase.js`, `js/core/config.js` |
| Paths / `/shop/:slug`, **`/vendors`** | `js/core/paths.js`, [`vercel.json`](./vercel.json) |
| **All vendors (customer)** | [`vendors.html`](./vendors.html), `bootVendorsPage` in `js/pages/home.js` |

When in doubt, open `placeholders.js` or `home.js` first — comments at the top of `placeholders.js` mirror this doc.
