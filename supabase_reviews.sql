-- Run this in your Supabase SQL editor
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Anyone can submit a review (landing page form — no auth needed)
create policy "Anyone can submit a review"
  on public.reviews for insert
  with check (true);

-- Only authenticated admins can read all reviews
create policy "Admins can read all reviews"
  on public.reviews for select
  using (auth.role() = 'authenticated');

-- Only authenticated admins can update review status
create policy "Admins can moderate reviews"
  on public.reviews for update
  using (auth.role() = 'authenticated');
