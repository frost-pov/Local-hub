# Walkthrough — GitHub · Supabase · Vercel (Local Hub)

Use this after you have the code on disk. Repo: **`https://github.com/frost-pov/Local-hub`** (`frost-pov` account).

---

## Part A — Get the code onto GitHub

### If this folder does **not** have git yet

1. Create a **new empty repository** on GitHub (no README):  
   `https://github.com/new` → name e.g. **`local-hub`** → Create.

2. In PowerShell (this project folder):

```powershell
cd "c:\Users\forst-pov\Desktop\local hub"
git init
git add .
git commit -m "Local Hub — marketplace UI, vendors page, demo catalog, docs"
git branch -M main
git remote add origin https://github.com/frost-pov/Local-hub.git
git push -u origin main
```

Use **your** repo URL from GitHub (green “push an existing repository”).

3. If `git push` asks for credentials, use either:
   - **Git Credential Manager** (browser login), or  
   - A **Personal Access Token** (GitHub → Settings → Developer settings → PAT) as the password.

### If you already have a repo elsewhere

Clone that repo into a folder, copy any **new/changed files** from this Desktop folder into the clone, then:

```powershell
git add .
git commit -m "Describe your changes"
git push
```

---

## Part B — Supabase (backend + database)

### 1. Create project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Set a DB password you will **save** somewhere safe → choose a region → Create.
3. Wait until the dashboard is green.

### 2. Apply schema

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Open **`supabase/schema.sql`** from this repo in a text editor, copy **all** of it, paste into SQL Editor → **Run**.
3. If you see errors about objects already existing, you may have run it twice; use a fresh project or fix conflicting objects.

### 3. Optional: `website_url` on old databases only

If you created the DB **before** `website_url` existed in `schema.sql`:

- Run **`supabase/migrations/002_vendor_website_url.sql`** once in SQL Editor.

### 4. Copy API keys

1. **Settings** (gear) → **API**.
2. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **`anon` `public`** key (long JWT starting with `eyJ...`)

**Never** put the **`service_role`** key in frontend HTML.

### 5. Paste keys into every frontend page

In each file that contains `window.__LOCALHUB` / `__SOKO`, replace placeholders:

```html
<script>
  window.__LOCALHUB = window.__LOCALHUB || {
    supabaseUrl: 'https://YOUR_REF.supabase.co',
    supabaseAnonKey: 'eyJ...your-anon-key...',
  };
  window.__SOKO = window.__LOCALHUB;
</script>
```

Search the repo for `YOUR_PROJECT` / `YOUR_SUPABASE` to find every file (at minimum: `index.html`, `vendors.html`, `vendor.html`, `checkout.html`, `onboarding.html`, `auth/login.html`, `auth/callback.html`, `admin/*.html`, `vendor-admin/*.html`, etc.).

When both values are real JWT + `.supabase.co` URL, **`js/core/config.js`** turns **demo mode off** unless you add `forceDemo: true`.

### 6. Row Level Security & first data

1. Policies are intended to be tightened for production — see comments in **`supabase/schema.sql`** and **`CONTEXT.md`**.
2. Until you seed data, grids can look **empty**:
   - **Table Editor → `vendors`**: insert a row with `slug`, `name`, `category`, `is_approved = true`, `is_suspended = false`, `banner_url`, `logo_url`, etc.
   - **Table Editor → `products`**: `vendor_id` must match; `price` is in **cents**; `images` is JSON like `[{"url":"https://...","alt":"..."}]`.

---

## Part C — Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → Import **`frost-pov/Local-hub`**.
2. Framework: **Other** (static site). Root directory = repo root. No build command needed (see **`vercel.json`**).
3. Deploy. Your site URL will serve **`index.html`**, **`/vendors`**, **`/shop/:slug`**, etc.

---

## Part D — What to do next (typical order)

| Order | Task |
|------|------|
| 1 | Repo on GitHub + Vercel connected (above). |
| 2 | Supabase project + `schema.sql` run. |
| 3 | Keys pasted into **all** HTML `__LOCALHUB` blocks. |
| 4 | Deploy again on Vercel (or redeploy pushes automatically). |
| 5 | Insert at least one **approved vendor** + **products** (`is_available`, `images`). |
| 6 | (**Later**) M‑Pesa Daraja + server/Edge webhook for live payments — see **`CONTEXT.md`**. |

More detail on deploy: **[`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md)**.  
Customization map: **[`CUSTOMIZATION.md`](./CUSTOMIZATION.md)**.
