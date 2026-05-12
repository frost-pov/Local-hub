# Deploy Local Hub — Supabase + Vercel

This project is plain static HTML/JS served from [`vercel.json`](./vercel.json). You paste public Supabase keys into each page’s **`window.__LOCALHUB`** block (**[`SETUP_WALKTHROUGH.md`](./SETUP_WALKTHROUGH.md)** explains Local Hub vs the legacy **`__SOKO`** alias). No bundler secrets step required.

## 1. Create Supabase

1. Open [supabase.com](https://supabase.com) → **New project** (pick a password, region close to Nairobi if available).
2. When the dashboard loads, note **Project URL** and **`anon` public key** (Settings → API). Never commit the **service_role** key to git or frontend.

## 2. Apply the schema

1. In Supabase, open **SQL Editor** → **New query**.
2. Paste everything from [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
3. If Supabase reports errors about objects already existing, you may be re-running — either use a fresh project or extend the migration manually.

### Redirect URLs for login / OAuth / magic links

In Supabase → **Authentication** → **URL configuration**, add **Redirect URLs** matching your deployed host:

- `https://YOUR_DOMAIN/auth/callback` (clean path — `vercel.json` maps this to `auth/callback.html`)
- `https://YOUR_DOMAIN/auth/callback.html`
- Optional: `https://YOUR_DOMAIN/login`

Set **Site URL** to the same canonical origin (for example `https://local-hub-tan.vercel.app`). Email magic links that don’t pass a saved `next` target land on **Site URL** (often `/`), not `/admin`; use **`https://YOUR_DOMAIN/login?next=/admin`** for password login while testing the dashboard.

### “Signed in but no profile row yet” (`/admin`)

That means `auth.users` has your login but **`public.profiles` has no matching row**. Common if the signup trigger wasn’t deployed yet or **`profiles.phone`** unique rejected an empty duplicate. In Supabase → **SQL Editor**, run **`supabase/migrations/005_backfill_profiles_fix_trigger.sql`** once (it backfills missing rows and replaces `handle_new_user` with a safer version). Then set `role = 'super_admin'` for your UUID if needed.

The file defines tables (`profiles`, `vendors`, `products`, `orders`, etc.) plus RLS expectations; read comments in SQL for triggers and policies already included.

## 3. Smoke-test REST

Still in Supabase → **Settings → API** → copy **Project URL** and **`anon`** key into one local file (e.g. `index.html`):

```html
<script>
  window.__LOCALHUB = window.__LOCALHUB || {
    supabaseUrl: 'https://YOUR_REF.supabase.co',
    supabaseAnonKey: 'eyJ...your-anon-key...',
  };
  window.__SOKO = window.__LOCALHUB; /* optional legacy alias */
</script>
```

Repeat the **same block** wherever it already exists (`checkout.html`, `vendor.html`, `vendors.html`, `admin/*.html`, etc.). Optional: temporarily set `forceDemo: true` in `window.__LOCALHUB` to keep the bundled preview catalog even though keys look valid — useful while you’re iterating on RLS without real rows.

When `supabaseUrl` ends in `.supabase.co` **and** the anon key parses as a JWT (`eyJ` + three dot-separated chunks), **demo mode switches off automatically** (`js/core/config.js`).

### Vendor links to their own website

The `vendors` table includes optional **`website_url`** (full `https://…` to their Wix, Shopify, Instagram link tree, etc.). The home “ghost” strip and the vendor shop header show **Their website** when this is set. **Checkout still happens on Local Hub** — you are not embedding their store.

- New projects: column is in [`supabase/schema.sql`](./supabase/schema.sql).
- Existing DB: run [`supabase/migrations/002_vendor_website_url.sql`](./supabase/migrations/002_vendor_website_url.sql) once in the SQL Editor.

Set values in Supabase **Table Editor → vendors → website_url**, or via your admin flow when you build it.

## 4. Deploy to Vercel

1. Push this repo to GitHub/GitLab or use **Vercel CLI**: `npm i -g vercel`, then inside the repo run `vercel` and confirm the project root folder.
2. Vercel project settings → **Framework preset**: Other (static). Build command/output can stay blank — there is no build.
3. **Environment variables**: not required if you bake keys into HTML like above; for future automation you’d need a tiny build script to inject vars into HTML — out of scope for the default workflow.
4. After deploy, open your `*.vercel.app` URL → you should hit `index.html` with clean routes from `vercel.json` (`/shop/:slug` → `vendor.html`).

### Bookmark: production URLs (replace with your domain)

Your current production hostname is **`local-hub-tan.vercel.app`**. Swap it if you attach a custom domain or Vercel renames the project.

Set **`BASE`** = `https://local-hub-tan.vercel.app` (always `https`).

| What | Clean URL |
|------|-----------|
| **Home** | `{BASE}/` |
| **Vendors directory** | `{BASE}/vendors` |
| **Shop by slug** | `{BASE}/shop/your-vendor-slug` |
| **Checkout** | `{BASE}/checkout` |
| **Sign in / sign up** | `{BASE}/login` |
| **Auth OAuth / magic link callback** | `{BASE}/auth/callback` or `{BASE}/auth/callback.html` |
| **Become a seller (new account)** | `{BASE}/join` |
| **Apply to sell (logged in)** | `{BASE}/apply-as-vendor` |
| **Vendor dashboard** | `{BASE}/vendor` |
| **Admin home** (**super_admin** — see checklist §5) | `{BASE}/admin` |
| **Admin · Monitoring** | `{BASE}/admin/monitoring` |
| **Admin · Tools** (demo users / seed products) | `{BASE}/admin/tools` |
| **Admin · Applications** | `{BASE}/admin/applications` |
| **Admin · Vendors** | `{BASE}/admin/vendors` |
| **Admin · Orders** | `{BASE}/admin/orders` |
| **Admin · Payouts** | `{BASE}/admin/payouts` |
| **Admin · Settings** | `{BASE}/admin/settings` |

**Copy-paste (your deploy today):**

- `https://local-hub-tan.vercel.app/`
- `https://local-hub-tan.vercel.app/admin`
- `https://local-hub-tan.vercel.app/login`
- `https://local-hub-tan.vercel.app/join`
- `https://local-hub-tan.vercel.app/apply-as-vendor`
- `https://local-hub-tan.vercel.app/vendor`

Alternate Vercel hostnames (`local-hub-git-main-…`, preview URLs) behave the same path-wise; prefer the Production domain you promoted.

Local testing: serve with any static server (not `file://`) so ES modules resolve, for example:

`npx serve "c:/path/to/local hub"`

## 5. After go-live checklist

1. Seed at least one **approved vendor** (`is_approved = true`) and featured products (`is_featured`) if you want the home grids populated (see bundled rows in [`js/data/placeholders.js`](./js/data/placeholders.js) for field shapes).
2. Create admin users via Supabase **`profiles`** with `super_admin`, then swap off `requireAdminAccess` preview bypass (already wired once real auth exists).
3. Wire M-Pesa / Edge Functions when ready — checkout currently falls back to demo flow when placeholders are active.

Questions or stuck spots: say which step and error message (REST, RLS, or build) and iterate from there.
