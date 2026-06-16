-- Run this in Supabase → SQL Editor

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  town text,
  category text,
  website boolean default false,
  stars float,
  reviews int,
  lat float,
  lng float,
  maps_url text,
  status text default 'none' check (status in ('none', 'followup', 'scheduled', 'noint')),
  followup_date date,
  notes text,
  agent_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- Add lead_id to cold_calls for future sync (nullable — won't break existing rows)
alter table cold_calls add column if not exists lead_id uuid references leads(id);

-- RLS: allow service role full access (your API uses service role key)
alter table leads enable row level security;
create policy if not exists "service role full access" on leads
  using (true) with check (true);
