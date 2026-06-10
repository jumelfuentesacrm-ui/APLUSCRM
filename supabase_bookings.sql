-- Run this in your Supabase SQL editor
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  business text not null,
  date date not null,
  time text not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz default now()
);

-- Allow anyone to insert (landing page form — no auth needed)
alter table public.bookings enable row level security;

create policy "Anyone can create a booking"
  on public.bookings for insert
  with check (true);

create policy "Admins can read all bookings"
  on public.bookings for select
  using (auth.role() = 'authenticated');

create policy "Admins can update bookings"
  on public.bookings for update
  using (auth.role() = 'authenticated');
