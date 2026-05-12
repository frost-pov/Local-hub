-- ============================================================
-- Soko marketplace — database schema (run in Supabase SQL Editor)
-- CONTEXT.md §4 is the spec; this file is the runnable source of truth.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text unique,
  role        text not null default 'customer'
              check (role in ('super_admin', 'vendor', 'customer')),
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- VENDORS
-- ------------------------------------------------------------
create table public.vendors (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid references public.profiles(id) on delete cascade,
  slug                text unique not null,
  name                text not null,
  tagline             text,
  description         text,
  story               text,
  category            text not null,
  area                text,
  address             text,
  whatsapp            text,
  hours               jsonb default '{}',
  logo_url            text,
  banner_url          text,
  /** Optional external site (Wix / Shopify / link-in-bio). Checkout stays on Local Hub. */
  website_url         text,
  lat                 double precision,
  lng                 double precision,
  is_online           boolean default false,
  is_approved         boolean default false,
  is_suspended        boolean default false,
  commission_rate     numeric(5,2) default 10.00,
  contract_signed     boolean default false,
  contract_signed_at  timestamptz,
  contract_name       text,
  payout_phone        text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index vendors_search_idx on public.vendors
  using gin ((name || ' ' || coalesce(area,'') || ' ' || category) gin_trgm_ops);

-- ------------------------------------------------------------
-- PRODUCTS (prices in “cents”: 250000 = Ksh 2,500)
-- ------------------------------------------------------------
create table public.products (
  id             uuid primary key default uuid_generate_v4(),
  vendor_id      uuid references public.vendors(id) on delete cascade,
  title          text not null,
  slug           text not null,
  description    text,
  price          integer not null,
  compare_price  integer,
  category       text,
  tags           text[],
  images         jsonb default '[]',
  inventory      integer default 0,
  is_available   boolean default true,
  is_featured    boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (vendor_id, slug)
);

create index products_vendor_idx on public.products (vendor_id);
create index products_search_idx on public.products
  using gin ((title || ' ' || coalesce(description,'')) gin_trgm_ops);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table public.orders (
  id                 uuid primary key default uuid_generate_v4(),
  order_ref          text unique not null,
  buyer_id           uuid references public.profiles(id),
  buyer_name         text not null,
  buyer_phone        text not null,
  buyer_email        text,
  delivery_address   text not null,
  delivery_notes     text,
  subtotal           integer not null,
  delivery_fee       integer default 0,
  total_amount       integer not null,
  status             text not null default 'pending'
                     check (status in (
                       'pending','payment_initiated','paid','confirmed',
                       'preparing','dispatched','delivered','cancelled','refunded'
                     )),
  payment_method     text default 'mpesa',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------
create table public.order_items (
  id                uuid primary key default uuid_generate_v4(),
  order_id          uuid references public.orders(id) on delete cascade,
  vendor_id         uuid references public.vendors(id),
  product_id        uuid references public.products(id),
  product_title     text not null,
  product_image     text,
  quantity          integer not null default 1,
  unit_price        integer not null,
  subtotal          integer not null,
  commission_rate   numeric(5,2) not null,
  commission_amount integer not null,
  vendor_payout     integer not null,
  payout_status     text default 'pending'
                    check (payout_status in ('pending','processing','paid'))
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_vendor_idx on public.order_items (vendor_id);

-- ------------------------------------------------------------
-- MPESA
-- ------------------------------------------------------------
create table public.mpesa_transactions (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid references public.orders(id),
  checkout_request_id   text unique,
  merchant_request_id   text,
  phone                 text not null,
  amount                integer not null,
  result_code           integer,
  result_desc           text,
  mpesa_receipt         text,
  status                text default 'initiated'
                        check (status in ('initiated','success','failed','cancelled','timeout')),
  raw_callback          jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ------------------------------------------------------------
-- VENDOR PAYOUTS
-- ------------------------------------------------------------
create table public.vendor_payouts (
  id                     uuid primary key default uuid_generate_v4(),
  vendor_id              uuid references public.vendors(id),
  period_start           date not null,
  period_end             date not null,
  gross_sales            integer not null,
  commission_total       integer not null,
  net_payout             integer not null,
  order_count            integer not null,
  status                 text default 'pending'
                         check (status in ('pending','processing','paid','failed')),
  mpesa_transaction_id   text,
  paid_at                timestamptz,
  notes                  text,
  created_at             timestamptz default now()
);

-- ------------------------------------------------------------
-- ANALYTICS
-- ------------------------------------------------------------
create table public.analytics_events (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null check (type in (
                'page_view','vendor_view','product_view','cart_add','cart_remove',
                'checkout_start','order_placed'
              )),
  vendor_id   uuid references public.vendors(id),
  product_id  uuid references public.products(id),
  session_id  text,
  payload     jsonb default '{}',
  ts          timestamptz default now()
);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text default 'info' check (type in ('info','success','warning','error')),
  is_read    boolean default false,
  link       text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PLATFORM SETTINGS (non-secret keys only — never store live M-Pesa secrets here)
-- ------------------------------------------------------------
create table public.platform_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- delivery_fee_base: same integer “cents” as product prices (100 Ksh = 10000)
insert into public.platform_settings (key, value) values
  ('default_commission_rate', '10'),
  ('delivery_fee_base', '10000'),
  ('platform_name', 'Soko'),
  ('platform_tagline', 'Your city, delivered.'),
  ('payout_day', 'friday'),
  ('mpesa_shortcode', ''),
  ('mpesa_passkey', '')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- AUTH: new user → profile row (CONTEXT.md §6)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
