# CONTEXT.md — Local Marketplace Platform
> Read this file before touching any code. Every architectural decision is documented here.
> Stack: Vanilla HTML/CSS/JS · Supabase · Vercel · M-Pesa Daraja API

---

## 1. WHAT THIS IS

A local Nairobi marketplace platform where vendors get their own dynamic storefront page hosted under the main domain. The platform owner (super admin) controls everything. Vendors get a limited self-service panel. All money flows through the platform — the platform takes a 10% commission on every order automatically, vendors receive the remainder on weekly payouts.

**Core rule: The platform owns the checkout. Always. Vendors cannot receive direct payment from customers for platform orders.**

---

## 2. AESTHETIC & DESIGN SYSTEM

### Direction
Modern, editorial, dark-first. Think high-end streetwear brand meets African market energy. Clean grids, sharp typography, intentional whitespace. Not corporate, not generic SaaS. Feels like a product someone built with taste.

### Fonts (load via Google Fonts)
```
Display / Headings : "Clash Display" or "Syne" (bold, geometric)
Body               : "DM Sans" (clean, modern, readable)
Monospace / Prices : "DM Mono" (for prices, codes, tags)
```

### Color Tokens (CSS variables — defined in style.css, imported everywhere)
```css
:root {
  /* Base */
  --bg-primary:    #0a0a0a;   /* near-black canvas */
  --bg-secondary:  #111111;   /* card backgrounds */
  --bg-tertiary:   #1a1a1a;   /* elevated surfaces */
  --bg-hover:      #222222;

  /* Text */
  --text-primary:  #f5f5f0;   /* off-white, not harsh */
  --text-secondary:#a0a09a;
  --text-muted:    #555550;

  /* Accent — single sharp color, used sparingly */
  --accent:        #c8f55a;   /* electric lime */
  --accent-dim:    #8fb33a;
  --accent-bg:     rgba(200, 245, 90, 0.08);

  /* Semantic */
  --success:       #4ade80;
  --warning:       #facc15;
  --danger:        #f87171;
  --info:          #60a5fa;

  /* Borders */
  --border:        rgba(255,255,255,0.08);
  --border-hover:  rgba(255,255,255,0.15);

  /* Radius */
  --radius-sm:     6px;
  --radius-md:     12px;
  --radius-lg:     18px;
  --radius-xl:     24px;
  --radius-pill:   999px;

  /* Transitions */
  --transition:    all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Design Rules for Cursor
- Dark backgrounds only. No white pages anywhere.
- All cards: `background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg)`
- Hover states always lift with border brightening: `border-color: var(--border-hover)`
- Accent color (lime) used ONLY for: CTAs, active states, online indicators, key numbers. Never as background fills.
- Buttons: filled accent for primary, outlined for secondary, ghost for tertiary
- All inputs: dark bg, subtle border, no harsh outlines
- Smooth page transitions: elements fade + slide up on load with staggered animation-delay
- Price tags always in DM Mono
- Vendor "online" badge: pulsing green dot
- Images: always cover-fit in fixed aspect-ratio containers with a dark overlay on hover

### Animation Patterns
```css
/* Page load — apply to cards, sections */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal { animation: fadeUp 0.5s ease forwards; }
.reveal-delay-1 { animation-delay: 0.1s; }
.reveal-delay-2 { animation-delay: 0.2s; }
/* etc. up to delay-5 */

/* Pulse for online indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.4); }
}
```

---

## 3. PROJECT STRUCTURE

```
/
├── index.html              # Main marketplace homepage
├── vendor.html             # Dynamic vendor storefront (single template)
├── onboarding.html         # Vendor sign-up + contract agreement
├── checkout.html           # Cart review + M-Pesa STK push
├── order-confirm.html      # Post-payment confirmation page
├── admin/
│   ├── index.html          # Super admin dashboard (YOU only)
│   ├── vendors.html        # Manage all vendors
│   ├── orders.html         # All platform orders
│   ├── payouts.html        # Vendor payout management
│   └── settings.html       # Platform settings, commission rate
├── vendor-admin/
│   ├── index.html          # Vendor dashboard (their orders, earnings)
│   ├── products.html       # Vendor product management
│   └── settings.html       # Vendor edits: description, hours, story, logo
├── auth/
│   ├── login.html          # Shared login page
│   └── callback.html       # Supabase auth callback handler
├── assets/
│   ├── style.css           # Global styles + CSS variables
│   ├── components.css      # Reusable component styles
│   └── animations.css      # All keyframe animations
├── js/
│   ├── supabase.js         # Supabase client init (import everywhere)
│   ├── auth.js             # Auth helpers + role-based redirects
│   ├── cart.js             # Cart logic (localStorage)
│   ├── mpesa.js            # M-Pesa STK push + polling helpers
│   ├── utils.js            # Formatters, slug parser, price calc, toast
│   └── vendor-loader.js    # Dynamic vendor page data fetching
├── supabase/
│   ├── schema.sql          # Full DB schema (source of truth)
│   ├── rls.sql             # Row-level security policies
│   └── functions/
│       ├── mpesa-stk.ts    # Edge Function: initiate STK push
│       ├── mpesa-callback.ts # Edge Function: handle Daraja callback
│       └── payout.ts       # Edge Function: vendor payout via B2C
├── .env                    # Never commit this
├── vercel.json             # Vercel routing config
└── CONTEXT.md              # This file
```

---

## 4. SUPABASE SCHEMA (source of truth)

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for search

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  phone           text unique,
  role            text not null default 'customer' check (role in ('super_admin', 'vendor', 'customer')),
  created_at      timestamptz default now()
);

-- ============================================================
-- VENDORS
-- ============================================================
create table public.vendors (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references public.profiles(id) on delete cascade,
  slug            text unique not null,             -- URL-safe, e.g. "jk-fashion"
  name            text not null,
  tagline         text,                             -- Short one-liner under the name
  description     text,                             -- Editable by vendor
  story           text,                             -- "About us" — editable by vendor
  category        text not null,                    -- 'fashion', 'groceries', 'services', etc.
  area            text,                             -- e.g. "Westlands", "CBD"
  address         text,                             -- Physical address or landmark
  whatsapp        text,                             -- WhatsApp number for order notifications
  hours           jsonb default '{}',               -- { "mon": "8am-6pm", "tue": "8am-6pm", ... }
  logo_url        text,
  banner_url      text,
  lat             float,
  lng             float,
  is_online       boolean default false,            -- Vendor toggles this
  is_approved     boolean default false,            -- You approve before they go live
  is_suspended    boolean default false,
  commission_rate numeric(5,2) default 10.00,       -- Default 10%, you can override per vendor
  contract_signed boolean default false,
  contract_signed_at timestamptz,
  contract_name   text,                             -- Full name they typed to "sign"
  payout_phone    text,                             -- M-Pesa number for payouts
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Full-text search index on vendor name + area + category
create index vendors_search_idx on public.vendors
  using gin((name || ' ' || coalesce(area,'') || ' ' || category) gin_trgm_ops);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references public.vendors(id) on delete cascade,
  title           text not null,
  slug            text not null,
  description     text,
  price           integer not null,                 -- Stored in KES cents (multiply by 100). e.g. 250000 = Ksh 2,500
  compare_price   integer,                          -- Original price for "was Ksh X" display
  category        text,
  tags            text[],                           -- e.g. ['summer', 'dress', 'casual']
  images          jsonb default '[]',               -- Array of { url, alt } objects
  inventory       integer default 0,               -- -1 = unlimited
  is_available    boolean default true,
  is_featured     boolean default false,            -- You can feature products platform-wide
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(vendor_id, slug)
);

create index products_vendor_idx on public.products(vendor_id);
create index products_search_idx on public.products
  using gin((title || ' ' || coalesce(description,'')) gin_trgm_ops);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_ref       text unique not null,             -- Human-readable: MKT-20240115-4821
  buyer_id        uuid references public.profiles(id),
  buyer_name      text not null,
  buyer_phone     text not null,
  buyer_email     text,
  delivery_address text not null,
  delivery_notes  text,
  subtotal        integer not null,                 -- Sum of items in cents
  delivery_fee    integer default 0,
  total_amount    integer not null,                 -- subtotal + delivery_fee
  status          text not null default 'pending'
                  check (status in ('pending','payment_initiated','paid','confirmed','preparing','dispatched','delivered','cancelled','refunded')),
  payment_method  text default 'mpesa',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS (per product per order)
-- ============================================================
create table public.order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid references public.orders(id) on delete cascade,
  vendor_id       uuid references public.vendors(id),
  product_id      uuid references public.products(id),
  product_title   text not null,                    -- Snapshot at time of purchase
  product_image   text,
  quantity        integer not null default 1,
  unit_price      integer not null,                 -- Price at time of purchase (cents)
  subtotal        integer not null,                 -- quantity * unit_price
  commission_rate numeric(5,2) not null,            -- Snapshot of vendor's rate at purchase
  commission_amount integer not null,               -- Computed: subtotal * commission_rate / 100
  vendor_payout   integer not null,                 -- subtotal - commission_amount
  payout_status   text default 'pending'
                  check (payout_status in ('pending','processing','paid'))
);

-- ============================================================
-- MPESA TRANSACTIONS
-- ============================================================
create table public.mpesa_transactions (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid references public.orders(id),
  checkout_request_id text unique,                  -- From Daraja STK push response
  merchant_request_id text,
  phone           text not null,
  amount          integer not null,
  result_code     integer,                          -- 0 = success
  result_desc     text,
  mpesa_receipt   text,                             -- Transaction ID from M-Pesa
  status          text default 'initiated'
                  check (status in ('initiated','success','failed','cancelled','timeout')),
  raw_callback    jsonb,                            -- Full Daraja callback payload
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- VENDOR PAYOUTS
-- ============================================================
create table public.vendor_payouts (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid references public.vendors(id),
  period_start    date not null,
  period_end      date not null,
  gross_sales     integer not null,
  commission_total integer not null,
  net_payout      integer not null,
  order_count     integer not null,
  status          text default 'pending'
                  check (status in ('pending','processing','paid','failed')),
  mpesa_transaction_id text,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- ANALYTICS EVENTS (lightweight)
-- ============================================================
create table public.analytics_events (
  id              uuid primary key default uuid_generate_v4(),
  type            text not null check (type in ('page_view','vendor_view','product_view','cart_add','cart_remove','checkout_start','order_placed')),
  vendor_id       uuid references public.vendors(id),
  product_id      uuid references public.products(id),
  session_id      text,
  payload         jsonb default '{}',
  ts              timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS (in-app)
-- ============================================================
create table public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  title           text not null,
  message         text not null,
  type            text default 'info' check (type in ('info','success','warning','error')),
  is_read         boolean default false,
  link            text,
  created_at      timestamptz default now()
);

-- ============================================================
-- PLATFORM SETTINGS (key-value store for you)
-- ============================================================
create table public.platform_settings (
  key             text primary key,
  value           text,
  updated_at      timestamptz default now()
);

-- Seed default settings
insert into public.platform_settings (key, value) values
  ('default_commission_rate', '10'),
  ('delivery_fee_base', '100'),         -- Ksh 1.00 in cents
  ('platform_name', 'Soko'),
  ('platform_tagline', 'Your city, delivered.'),
  ('payout_day', 'friday'),
  ('mpesa_shortcode', ''),
  ('mpesa_passkey', '');
```

---

## 5. ROW-LEVEL SECURITY (RLS)

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.mpesa_transactions enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;

-- Helper function: get current user role
create or replace function public.current_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Helper function: get vendor_id for current user
create or replace function public.my_vendor_id()
returns uuid language sql security definer as $$
  select id from public.vendors where owner_id = auth.uid() limit 1
$$;

-- PROFILES
create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "Super admin reads all profiles" on public.profiles
  for select using (public.current_role() = 'super_admin');

-- VENDORS (public read for approved, non-suspended)
create policy "Public can view approved vendors" on public.vendors
  for select using (is_approved = true and is_suspended = false);
create policy "Vendor reads own record" on public.vendors
  for select using (owner_id = auth.uid());
create policy "Vendor updates own record (limited fields)" on public.vendors
  for update using (owner_id = auth.uid());
create policy "Super admin full access to vendors" on public.vendors
  for all using (public.current_role() = 'super_admin');

-- PRODUCTS (public read for available products of approved vendors)
create policy "Public reads available products" on public.products
  for select using (
    is_available = true and
    exists (select 1 from public.vendors v where v.id = vendor_id and v.is_approved = true and v.is_suspended = false)
  );
create policy "Vendor manages own products" on public.products
  for all using (vendor_id = public.my_vendor_id());
create policy "Super admin full access to products" on public.products
  for all using (public.current_role() = 'super_admin');

-- ORDERS
create policy "Buyer reads own orders" on public.orders
  for select using (buyer_id = auth.uid());
create policy "Vendor reads orders containing their items" on public.orders
  for select using (
    exists (select 1 from public.order_items oi where oi.order_id = id and oi.vendor_id = public.my_vendor_id())
  );
create policy "Super admin full access to orders" on public.orders
  for all using (public.current_role() = 'super_admin');

-- NOTIFICATIONS
create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid());
```

---

## 6. AUTH & ROLE SYSTEM

### How auth works
- Supabase Auth handles sign-in (email+password or phone OTP)
- On sign-up, a trigger creates a `profiles` row with `role = 'customer'`
- Vendor role is assigned manually by super admin after contract signing
- Super admin role: set directly in DB, never via UI

### Auth trigger (add to Supabase SQL editor)
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.phone,
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### js/auth.js — role-based redirect logic
```javascript
import { supabase } from './supabase.js'

export async function requireRole(allowedRoles) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return window.location.href = '/auth/login.html'

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!allowedRoles.includes(profile?.role)) {
    window.location.href = '/'
  }
  return { user, role: profile.role }
}

// Usage: await requireRole(['super_admin']) at top of admin pages
// Usage: await requireRole(['vendor', 'super_admin']) at top of vendor-admin pages
```

---

## 7. DYNAMIC VENDOR STOREFRONT

### How it works
`vendor.html` is one file. It reads the vendor slug from the URL and fetches everything from Supabase.

URL format: `/vendor.html?slug=jk-fashion` or with Vercel rewrite: `/shop/jk-fashion`

### vercel.json (URL rewrites)
```json
{
  "rewrites": [
    { "source": "/shop/:slug", "destination": "/vendor.html?slug=:slug" },
    { "source": "/join",       "destination": "/onboarding.html" },
    { "source": "/admin/:path*", "destination": "/admin/:path*" },
    { "source": "/vendor/:path*", "destination": "/vendor-admin/:path*" }
  ]
}
```

### js/vendor-loader.js
```javascript
import { supabase } from './supabase.js'
import { trackEvent } from './utils.js'

export async function loadVendorPage() {
  const slug = new URLSearchParams(window.location.search).get('slug')
  if (!slug) return renderNotFound()

  // Fetch vendor + products in parallel
  const [{ data: vendor }, { data: products }] = await Promise.all([
    supabase.from('vendors').select('*').eq('slug', slug).eq('is_approved', true).single(),
    supabase.from('products').select('*').eq('vendor_id', /* set after vendor fetch */'').eq('is_available', true).order('is_featured', { ascending: false })
  ])

  if (!vendor) return renderNotFound()

  // Track visit
  trackEvent('vendor_view', { vendor_id: vendor.id })

  // Render — inject into page DOM
  renderVendorHero(vendor)
  renderProductsGrid(products)
  renderVendorInfo(vendor)
}
```

---

## 8. CART SYSTEM

Cart lives in `localStorage`. No DB until checkout.

### js/cart.js
```javascript
const CART_KEY = 'soko_cart'

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
}

export function addToCart(product, vendorId, vendorName) {
  const cart = getCart()
  const existing = cart.find(i => i.productId === product.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      productId: product.id,
      vendorId,
      vendorName,
      title: product.title,
      image: product.images?.[0]?.url || null,
      price: product.price,          // cents
      commissionRate: /* fetched from vendor */ 10,
      quantity: 1
    })
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  updateCartBadge()
  showToast(`${product.title} added to cart`)
}

export function removeFromCart(productId) { /* ... */ }
export function clearCart() { localStorage.removeItem(CART_KEY) }
export function getCartTotal() { return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0) }
export function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.quantity, 0)
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count || '')
}
```

**Important:** Cart can contain items from multiple vendors. At checkout, order_items are split by vendor_id in the DB. Payout is calculated per vendor.

---

## 9. M-PESA INTEGRATION

### Flow
```
Customer clicks Pay
  → checkout.html calls /functions/v1/mpesa-stk
    → Edge Function calls Daraja STK Push API
      → Customer gets prompt on phone
        → Customer enters PIN
          → Daraja calls /functions/v1/mpesa-callback
            → Edge Function updates mpesa_transactions + orders tables
              → checkout.html polls order status every 3s
                → Redirects to /order-confirm.html on success
```

### supabase/functions/mpesa-stk.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DARAJA_BASE = 'https://api.safaricom.co.ke' // prod; use sandbox for dev

serve(async (req) => {
  const { phone, amount, orderId } = await req.json()

  // 1. Get OAuth token from Daraja
  const token = await getDarajaToken()

  // 2. Generate password & timestamp
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const shortcode = Deno.env.get('MPESA_SHORTCODE')!
  const passkey   = Deno.env.get('MPESA_PASSKEY')!
  const password  = btoa(`${shortcode}${passkey}${timestamp}`)

  // 3. STK Push request
  const res = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount / 100),   // Convert cents to KES
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: `SOKO-${orderId.slice(0, 8).toUpperCase()}`,
      TransactionDesc: 'Soko Marketplace Order'
    })
  })

  const data = await res.json()

  // 4. Save to mpesa_transactions
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  await supabase.from('mpesa_transactions').insert({
    order_id: orderId,
    checkout_request_id: data.CheckoutRequestID,
    merchant_request_id: data.MerchantRequestID,
    phone,
    amount,
    status: 'initiated'
  })

  // 5. Update order status
  await supabase.from('orders').update({ status: 'payment_initiated' }).eq('id', orderId)

  return new Response(JSON.stringify({ checkoutRequestId: data.CheckoutRequestID }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### supabase/functions/mpesa-callback.ts
```typescript
serve(async (req) => {
  const body = await req.json()
  const stk = body.Body.stkCallback
  const supabase = createClient(...)

  const isSuccess = stk.ResultCode === 0
  const receipt = isSuccess
    ? stk.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
    : null

  // Update mpesa_transactions
  const { data: txn } = await supabase
    .from('mpesa_transactions')
    .update({
      result_code: stk.ResultCode,
      result_desc: stk.ResultDesc,
      mpesa_receipt: receipt,
      status: isSuccess ? 'success' : 'failed',
      raw_callback: body
    })
    .eq('checkout_request_id', stk.CheckoutRequestID)
    .select('order_id')
    .single()

  if (isSuccess && txn?.order_id) {
    // Update order to paid
    await supabase.from('orders').update({ status: 'paid' }).eq('id', txn.order_id)

    // Notify vendor via WhatsApp (implement separately)
    // Notify buyer
    await notifyBuyer(txn.order_id, receipt)
  }

  return new Response('OK')
})
```

### Frontend polling (in checkout.html)
```javascript
async function pollOrderStatus(orderId) {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (data?.status === 'paid') {
      clearInterval(interval)
      window.location.href = `/order-confirm.html?order=${orderId}`
    }
    if (data?.status === 'cancelled' || paymentTimeout()) {
      clearInterval(interval)
      showError('Payment failed or timed out. Please try again.')
    }
  }, 3000) // Poll every 3 seconds

  // Timeout after 2 minutes
  setTimeout(() => clearInterval(interval), 120000)
}
```

---

## 10. PRICE & COMMISSION CALCULATION

**All prices stored in KES cents (×100). Always divide by 100 for display.**

### js/utils.js — formatters + commission calculator
```javascript
// Format cents to display price
export function formatPrice(cents) {
  return `Ksh ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
}

// Calculate commission split
export function calcCommission(priceCents, commissionRate = 10) {
  const commission = Math.round(priceCents * (commissionRate / 100))
  return {
    gross:      priceCents,
    commission,
    vendorEarns: priceCents - commission,
    rate:        commissionRate
  }
}

// Generate order reference
export function generateOrderRef() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `MKT-${date}-${rand}`
}

// Slug generator (for products)
export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Toast notification
export function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// Analytics event tracker
export function trackEvent(type, payload = {}) {
  supabase.from('analytics_events').insert({ type, ...payload }).then() // fire and forget
}
```

---

## 11. PAGE-BY-PAGE SPEC

### index.html — Main Homepage
**Sections:**
1. Hero — Platform name, tagline, search bar (searches vendors + products)
2. Category pills — Fashion / Groceries / Services / Household / All
3. Featured vendors grid — 3-col on desktop, 1-col mobile. Shows: banner, logo, name, area, category badge, online dot
4. Product highlights — "Trending now" — featured products across all vendors
5. How it works — 3 steps: Browse → Order → Delivered
6. Footer — Links, WhatsApp contact

**Search:** Debounced input (300ms) → queries vendors + products using pg_trgm similarity → renders dropdown results inline

**Vendor card:** Clicking goes to `/shop/vendor-slug`

---

### vendor.html — Vendor Storefront
**Sections:**
1. Banner image (full-width, dark overlay)
2. Vendor header: logo, name, tagline, area, hours, online/offline badge, WhatsApp CTA
3. Category filter tabs (from this vendor's product categories)
4. Products grid — title, image, price, "Add to cart" button
5. About section — vendor story
6. Floating cart button (bottom-right, shows item count)

**Data fetching:** `vendor-loader.js` — reads `?slug=` from URL, fetches vendor + products in parallel

**Empty state:** If vendor not found or not approved → friendly 404

---

### onboarding.html — Vendor Sign-Up
**Steps (multi-step form, no page reload):**
1. Account: Full name, phone, email, password
2. Store Info: Store name (auto-generates slug), category, area, WhatsApp, address
3. Upload: Logo (required), banner (optional)
4. Contract: Scrollable agreement text with live commission calculator. Type full name to sign. Checkbox to confirm.
5. Done: "Your application is under review. We'll contact you via WhatsApp."

**On submit:**
- Creates Supabase auth user
- Creates profile with role='customer' (becomes 'vendor' after you approve)
- Creates vendor row with `is_approved: false`, `contract_signed: true`
- Sends you (super admin) a notification

---

### checkout.html — Cart + Payment
**Sections:**
1. Order summary — items list with vendor names, quantities, prices
2. Commission display — "You save nothing here" (customer doesn't see commission — it's internal)
3. Delivery details — name, phone, address, notes
4. Total breakdown — Subtotal + Delivery fee + Total
5. Pay with M-Pesa button → triggers STK push
6. Loading state — "Check your phone for the M-Pesa prompt"
7. Polling — every 3s checks order status

**On successful payment:**
- Order + order_items written to DB with commission snapshot
- Redirect to order-confirm.html

---

### admin/index.html — Super Admin Dashboard (YOU)
**Requires role: super_admin**

**Sections:**
1. Stats row: Total revenue, platform commission earned, active vendors, orders today
2. Pending approvals — new vendor applications (approve/reject)
3. Recent orders — last 20 orders, status badges, quick view
4. Payout queue — vendors with unpaid balances
5. Quick actions: Add featured vendor, adjust commission, suspend vendor

---

### admin/vendors.html
- Full vendor list with search + filter (approved/pending/suspended)
- Per vendor: approve, suspend, edit commission rate, view their orders, force payout
- Click vendor → slide-out panel with all their details + stats

---

### admin/orders.html
- All orders, filterable by status, vendor, date range
- Per order: items breakdown, buyer info, payment status, M-Pesa receipt
- Manual status override (e.g. mark as delivered)

---

### admin/payouts.html
- Per-vendor payout summary for the current week
- Select vendors to pay → triggers B2C M-Pesa payout
- Payout history

---

### vendor-admin/index.html — Vendor Dashboard
**Requires role: vendor**

**Sections:**
1. Stats: Orders this week, earnings this week, pending payouts
2. Recent orders (their orders only)
3. Quick toggle: Online / Offline (updates `is_online` in real-time via Supabase)
4. Notification bell — new order alerts

---

### vendor-admin/products.html
- Product list with edit/delete
- Add product form: title, description, price (with live commission split preview), category, images, inventory
- Price input shows: "You type Ksh 2,500 → You earn Ksh 2,250 (after 10% platform fee)"

---

### vendor-admin/settings.html
- Edit: store description, story, hours (per day), WhatsApp
- Upload new logo / banner
- View contract (read-only)
- Payout phone number

---

## 12. COMPONENTS TO BUILD (reusable)

```
components/
├── nav.html          — Top nav with cart badge, auth state, logo
├── footer.html       — Site-wide footer
├── vendor-card.html  — Reusable vendor card (used in index + search)
├── product-card.html — Product tile with add-to-cart
├── toast.js          — Notification toast (already in utils.js)
├── modal.js          — Generic modal overlay
├── cart-drawer.html  — Slide-in cart panel
└── commission-calc.html — Reusable price split display
```

Include shared components via JS innerHTML injection or HTML imports pattern:
```javascript
// In each page's <script>
async function loadComponent(id, path) {
  const res = await fetch(path)
  document.getElementById(id).innerHTML = await res.text()
}
loadComponent('nav-placeholder', '/components/nav.html')
```

---

## 13. ENV VARIABLES

```env
# .env (never commit — add to Vercel environment variables)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# These go in Supabase Edge Function secrets (not frontend)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_URL=https://xxxx.supabase.co
```

---

## 14. EFFICIENCY & QUALITY OF LIFE FEATURES

These are small additions that take little time but make the product feel polished:

| Feature | Where | Notes |
|---|---|---|
| Online/offline toggle | Vendor admin + storefront | Real-time via Supabase subscription |
| Cart item count badge | Nav (all pages) | Updates from localStorage |
| Search debounce | index.html | 300ms delay, pg_trgm |
| Price formatter | All prices | Always DM Mono font, always formatted |
| Skeleton loaders | All data-fetched sections | CSS-only shimmer while loading |
| Empty states | Products grid, orders list | Friendly message + CTA |
| Copy order ref | Order confirm page | One-click copy for support |
| WhatsApp vendor CTA | Vendor storefront | `wa.me/` link, opens WhatsApp |
| Back to top button | Long pages | Smooth scroll |
| 404 page | Not found | On-brand, link back home |
| Favicon + meta tags | All pages | OG image for WhatsApp link previews |
| Image lazy loading | Product/vendor images | `loading="lazy"` on all img tags |
| Mobile-first nav | All pages | Hamburger menu on mobile |
| Toast on cart add | Vendor storefront | Confirms item added |
| Payout history | Vendor admin | See past payouts + dates |
| Order status timeline | Order confirm page | Visual step tracker |
| Vendor analytics | Vendor admin | Views, cart adds, orders (from analytics_events) |
| Real-time order ping | Vendor admin | Supabase realtime subscription on new orders |

---

## 15. SUPABASE REAL-TIME (vendor order notifications)

```javascript
// In vendor-admin/index.html — listen for new orders
const channel = supabase
  .channel('vendor-orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'order_items',
      filter: `vendor_id=eq.${vendorId}`
    },
    (payload) => {
      showToast('🛍️ New order received!', 'success')
      playNotificationSound()
      refreshOrdersList()
    }
  )
  .subscribe()
```

---

## 16. WHAT TO BUILD IN ORDER (tell Cursor this)

```
Phase 1 — Core (build first, in this order):
1. supabase/schema.sql + rls.sql — run in Supabase SQL editor
2. assets/style.css — full design system + CSS variables
3. js/supabase.js — client init
4. js/auth.js — role check helpers
5. js/utils.js — formatters, toast, trackEvent
6. js/cart.js — cart logic
7. components/ — nav, footer
8. auth/login.html — shared login
9. onboarding.html — vendor sign-up flow
10. index.html — homepage
11. vendor.html + js/vendor-loader.js — dynamic storefront
12. checkout.html — cart + payment UI (no M-Pesa yet, just UI)

Phase 2 — Payments + Admin:
13. supabase/functions/mpesa-stk.ts
14. supabase/functions/mpesa-callback.ts
15. js/mpesa.js — frontend polling
16. admin/index.html — super admin dashboard
17. admin/vendors.html — vendor management
18. admin/orders.html

Phase 3 — Vendor self-service + payouts:
19. vendor-admin/index.html
20. vendor-admin/products.html
21. vendor-admin/settings.html
22. admin/payouts.html
23. supabase/functions/payout.ts
```

---

## 17. CURSOR PROMPTING TIPS

When prompting Cursor Composer with this file loaded in context:

- Always start prompts with the file you're building: "Working on `vendor.html`..."
- Reference this file: "Follow the design system in CONTEXT.md"
- Be specific about what NOT to do: "Don't use React, no npm, vanilla JS only"
- For Supabase queries: "Use the schema in CONTEXT.md section 4"
- For styles: "Use the CSS variables from CONTEXT.md section 2"
- Keep prompts to one feature at a time

---

*Last updated: $(date +%Y-%m-%d)*
*Stack: Vanilla HTML/CSS/JS · Supabase · Vercel · M-Pesa Daraja*
