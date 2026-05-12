-- Vendor applications queue + super_admin profile updates + role tamper prevention.
-- Run in Supabase SQL Editor after schema.sql / rls.sql (idempotent-ish).

-- ------------------------------------------------------------
-- VENDOR APPLICATIONS (pending → admin approves → vendors row created)
-- ------------------------------------------------------------
create table if not exists public.vendor_applications (
  id uuid primary key default uuid_generate_v4(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),

  slug text not null,
  name text not null,
  tagline text,
  description text,
  story text,
  category text not null,
  area text,
  address text,
  whatsapp text,
  hours jsonb not null default '{}'::jsonb,
  logo_url text,
  banner_url text,
  website_url text,
  lat double precision,
  lng double precision,
  payout_phone text,

  commission_rate numeric(5, 2),

  contract_name text not null,
  contract_signed_at timestamptz not null default now(),

  applicant_notes text,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  created_vendor_id uuid references public.vendors(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vendor_applications_one_pending_per_applicant
  on public.vendor_applications (applicant_id)
  where status = 'pending';

create index if not exists vendor_applications_status_created_idx
  on public.vendor_applications (status, created_at desc);

alter table public.vendor_applications enable row level security;

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
-- PROFILES: super_admin may update rows (approve vendor → role bump)
-- ------------------------------------------------------------
drop policy if exists "Super admin updates all profiles"
  on public.profiles;
create policy "Super admin updates all profiles"
  on public.profiles
  for update using (public.current_role() = 'super_admin');

-- ------------------------------------------------------------
-- PROFILES: block non–super_admin users from editing their role
-- ------------------------------------------------------------
create or replace function public.profiles_enforce_role_integrity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.role is distinct from new.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_integrity_trigger on public.profiles;
create trigger profiles_role_integrity_trigger
  before update on public.profiles
  for each row execute function public.profiles_enforce_role_integrity();
