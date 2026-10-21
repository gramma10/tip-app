-- Kerasma: initial schema.
-- All writes go through the Next.js server using the service role, after the
-- app has authorised the request. RLS below is defence in depth for any
-- direct client access (e.g. Realtime subscriptions with the user's JWT).

create extension if not exists pgcrypto;

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  city text,
  accent_color text not null default '#0A66FF',
  google_place_id text,
  tip_presets integer[] not null default '{200,300,500}',
  mode text not null default 'individual' check (mode in ('individual', 'pool')),
  payee_mode text not null default 'staff' check (payee_mode in ('staff', 'venue')),
  stripe_account_id text,
  currency text not null default 'eur' check (currency = 'eur'),
  created_at timestamptz not null default now()
);

create table public.venue_members (
  user_id uuid not null references auth.users on delete cascade,
  venue_id uuid not null references public.venues on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  primary key (user_id, venue_id)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues on delete cascade,
  user_id uuid unique references auth.users on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role_label text not null default '',
  photo_url text,
  color text not null default '#6B46C1',
  stripe_account_id text unique,
  payouts_enabled boolean not null default false,
  active boolean not null default true,
  invite_token text unique,
  created_at timestamptz not null default now()
);
create index staff_venue_idx on public.staff (venue_id);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9-]{3,32}$'),
  label text not null check (char_length(label) between 1 and 60),
  kind text not null check (kind in ('staff', 'venue')),
  assigned_staff_id uuid references public.staff on delete set null,
  created_at timestamptz not null default now()
);
create index cards_venue_idx on public.cards (venue_id);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues on delete cascade,
  staff_id uuid not null references public.staff on delete restrict,
  card_id uuid references public.cards on delete set null,
  amount_cents integer not null check (amount_cents between 100 and 15000),
  fee_cover_cents integer not null default 0 check (fee_cover_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  currency text not null default 'eur',
  provider text not null check (provider in ('stripe', 'demo')),
  provider_ref text unique,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index tips_venue_created_idx on public.tips (venue_id, created_at desc);
create index tips_staff_created_idx on public.tips (staff_id, created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null unique references public.tips on delete cascade,
  venue_id uuid not null references public.venues on delete cascade,
  staff_id uuid not null references public.staff on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  published boolean not null default false,
  google_clicked boolean not null default false,
  manager_message text check (char_length(manager_message) <= 1000),
  created_at timestamptz not null default now()
);
create index reviews_venue_created_idx on public.reviews (venue_id, created_at desc);
create index reviews_staff_created_idx on public.reviews (staff_id, created_at desc);

-- Helpers ------------------------------------------------------------------

create or replace function public.is_venue_member(v uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from venue_members where venue_id = v and user_id = auth.uid());
$$;

create or replace function public.my_staff_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from staff where user_id = auth.uid() limit 1;
$$;

-- Row level security -------------------------------------------------------

alter table public.venues enable row level security;
alter table public.venue_members enable row level security;
alter table public.staff enable row level security;
alter table public.cards enable row level security;
alter table public.tips enable row level security;
alter table public.reviews enable row level security;

create policy "members and staff read their venue" on public.venues for select
  using (public.is_venue_member(id) or id in (select venue_id from public.staff where user_id = auth.uid()));
create policy "members update their venue" on public.venues for update
  using (public.is_venue_member(id));

create policy "read own memberships" on public.venue_members for select
  using (user_id = auth.uid());

create policy "members read venue staff, staff read self" on public.staff for select
  using (public.is_venue_member(venue_id) or user_id = auth.uid());

create policy "members read venue cards, staff read own" on public.cards for select
  using (public.is_venue_member(venue_id) or assigned_staff_id = public.my_staff_id());

create policy "members read venue tips, staff read own" on public.tips for select
  using (public.is_venue_member(venue_id) or staff_id = public.my_staff_id());

-- Staff never see private manager messages; the app reads those server-side for members only.
create policy "members read venue reviews, staff read own published" on public.reviews for select
  using (public.is_venue_member(venue_id) or (staff_id = public.my_staff_id() and published));

-- Live "new tip" notifications in the staff app.
alter publication supabase_realtime add table public.tips;

-- Staff photos (public read, writes via server only).
insert into storage.buckets (id, name, public) values ('staff-photos', 'staff-photos', true)
  on conflict (id) do nothing;
