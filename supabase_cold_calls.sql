-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/imcdbjtvqkhunakgteif/sql

create table if not exists cold_calls (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  created_by       uuid references auth.users(id),

  -- Contact info
  business_name    text,
  contact_name     text,
  phone            text,
  email            text,
  website          text,
  address          text,
  industry         text,

  -- Call tracking
  call_status      text default 'pending'
                   check (call_status in ('pending','no_answer','answered','call_back','follow_up','not_interested','booked')),
  follow_up_date   date,
  notes            text,
  booked_at        timestamptz,

  -- Links (filled when booked or scraped)
  google_maps_url  text,
  instagram_url    text
);

-- Enable RLS
alter table cold_calls enable row level security;

-- Admins can do everything
create policy "Admins full access" on cold_calls
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Index for fast queries
create index if not exists cold_calls_status_idx on cold_calls(call_status);
create index if not exists cold_calls_follow_up_idx on cold_calls(follow_up_date);
