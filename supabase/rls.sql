-- ============================================================
-- Row Level Security — run after schema.sql
-- Edge Functions use the service role and bypass RLS.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.mpesa_transactions enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.platform_settings enable row level security;
alter table public.vendor_applications enable row level security;

-- Stable helper functions (SECURITY DEFINER bypasses RLS when reading profiles/vendors)
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_vendor_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.vendors where owner_id = auth.uid() limit 1
$$;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "Super admin reads all profiles" on public.profiles;
create policy "Super admin reads all profiles" on public.profiles
  for select using (public.current_role() = 'super_admin');

drop policy if exists "Super admin updates all profiles" on public.profiles;
create policy "Super admin updates all profiles" on public.profiles
  for update using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- VENDOR APPLICATIONS
-- ------------------------------------------------------------
drop policy if exists "Applicant reads own vendor applications"
  on public.vendor_applications;
create policy "Applicant reads own vendor applications"
  on public.vendor_applications
  for select using (applicant_id = auth.uid());

drop policy if exists "Applicant inserts own vendor application"
  on public.vendor_applications;
create policy "Applicant inserts own vendor application"
  on public.vendor_applications
  for insert with check (
    applicant_id = auth.uid()
    and status = 'pending'
  );

drop policy if exists "Super admin full access vendor_applications"
  on public.vendor_applications;
create policy "Super admin full access vendor_applications"
  on public.vendor_applications
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- VENDORS
-- ------------------------------------------------------------
drop policy if exists "Public can view approved vendors" on public.vendors;
create policy "Public can view approved vendors" on public.vendors
  for select using (is_approved = true and is_suspended = false);

drop policy if exists "Vendor reads own record" on public.vendors;
create policy "Vendor reads own record" on public.vendors
  for select using (owner_id = auth.uid());

drop policy if exists "Vendor inserts own vendor row" on public.vendors;
create policy "Vendor inserts own vendor row" on public.vendors
  for insert with check (owner_id = auth.uid());

drop policy if exists "Vendor updates own record" on public.vendors;
create policy "Vendor updates own record" on public.vendors
  for update using (owner_id = auth.uid());

drop policy if exists "Super admin full access vendors" on public.vendors;
create policy "Super admin full access vendors" on public.vendors
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
drop policy if exists "Public reads available products" on public.products;
create policy "Public reads available products" on public.products
  for select using (
    is_available = true
    and exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.is_approved = true and v.is_suspended = false
    )
  );

-- Vendors maintain listings for their shop (including drafts: is_available = false)
drop policy if exists "Vendor reads own products" on public.products;
create policy "Vendor reads own products" on public.products
  for select using (vendor_id = public.my_vendor_id());

drop policy if exists "Vendor manages own products" on public.products;
create policy "Vendor manages own products" on public.products
  for all using (vendor_id = public.my_vendor_id());

drop policy if exists "Super admin full access products" on public.products;
create policy "Super admin full access products" on public.products
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
drop policy if exists "Buyer reads own orders" on public.orders;
create policy "Buyer reads own orders" on public.orders
  for select using (buyer_id = auth.uid());

drop policy if exists "Vendor reads orders with their items" on public.orders;
create policy "Vendor reads orders with their items" on public.orders
  for select using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = id and oi.vendor_id = public.my_vendor_id()
    )
  );

drop policy if exists "Buyer creates own order" on public.orders;
create policy "Buyer creates own order" on public.orders
  for insert with check (
    buyer_id = auth.uid()
    and public.current_role() in ('customer', 'vendor', 'super_admin')
  );

drop policy if exists "Super admin full access orders" on public.orders;
create policy "Super admin full access orders" on public.orders
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------
drop policy if exists "Buyer reads items for own order" on public.order_items;
create policy "Buyer reads items for own order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

drop policy if exists "Vendor reads own order items" on public.order_items;
create policy "Vendor reads own order items" on public.order_items
  for select using (vendor_id = public.my_vendor_id());

drop policy if exists "Buyer inserts items for own order" on public.order_items;
create policy "Buyer inserts items for own order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

drop policy if exists "Super admin full access order_items" on public.order_items;
create policy "Super admin full access order_items" on public.order_items
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- MPESA TRANSACTIONS (admin-only from client)
-- ------------------------------------------------------------
drop policy if exists "Super admin mpesa rows" on public.mpesa_transactions;
create policy "Super admin mpesa rows" on public.mpesa_transactions
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- VENDOR PAYOUTS
-- ------------------------------------------------------------
drop policy if exists "Vendor reads own payouts" on public.vendor_payouts;
create policy "Vendor reads own payouts" on public.vendor_payouts
  for select using (vendor_id = public.my_vendor_id());

drop policy if exists "Super admin payouts" on public.vendor_payouts;
create policy "Super admin payouts" on public.vendor_payouts
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists "Super admin notifications" on public.notifications;
create policy "Super admin notifications" on public.notifications
  for all using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- ANALYTICS (open insert for MVP — tighten later if spam appears)
-- ------------------------------------------------------------
drop policy if exists "Anyone can insert analytics" on public.analytics_events;
create policy "Anyone can insert analytics" on public.analytics_events
  for insert with check (true);

drop policy if exists "Super admin reads analytics" on public.analytics_events;
create policy "Super admin reads analytics" on public.analytics_events
  for select using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- PLATFORM SETTINGS
-- ------------------------------------------------------------
drop policy if exists "Public read platform settings" on public.platform_settings;
create policy "Public read platform settings" on public.platform_settings
  for select using (true);

drop policy if exists "Super admin update platform settings" on public.platform_settings;
create policy "Super admin update platform settings" on public.platform_settings
  for all using (public.current_role() = 'super_admin');
