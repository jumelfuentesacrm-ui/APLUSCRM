-- ============================================================
-- A+ CRM — Schema Upgrade
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Bookings: add new columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS facebook_page   text,
  ADD COLUMN IF NOT EXISTS service         text,
  ADD COLUMN IF NOT EXISTS archived        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS buy_service     text,
  ADD COLUMN IF NOT EXISTS buy_amount      numeric,
  ADD COLUMN IF NOT EXISTS buy_type        text,
  ADD COLUMN IF NOT EXISTS buy_monthly     numeric,
  ADD COLUMN IF NOT EXISTS buy_total       numeric,
  ADD COLUMN IF NOT EXISTS buy_installments integer,
  ADD COLUMN IF NOT EXISTS buy_notes       text;

-- 2. Cold calls: add new columns
ALTER TABLE public.cold_calls
  ADD COLUMN IF NOT EXISTS pueblo         text,
  ADD COLUMN IF NOT EXISTS responded      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_date  date,
  ADD COLUMN IF NOT EXISTS notes          text;

-- 3. CRM Clients (created when booking marked as Compró)
CREATE TABLE IF NOT EXISTS public.crm_clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  phone            text,
  facebook_page    text,
  service_acquired text,
  amount_paid      numeric,
  payment_type     text CHECK (payment_type IN ('once','subscription','installments')),
  monthly_amount   numeric,
  total_amount     numeric,
  installments     integer,
  notes            text,
  booking_id       uuid REFERENCES public.bookings(id),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm_clients"
  ON public.crm_clients FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
