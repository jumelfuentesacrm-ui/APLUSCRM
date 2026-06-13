-- ============================================================
-- A+ CRM — Full Database Schema
-- Run this in Supabase SQL Editor for every new client project.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────
-- Created automatically by Supabase Auth trigger (or manually for admin users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text,
  business_name  text,
  phone          text,
  role           text NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── bookings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  phone            text NOT NULL,
  business         text NOT NULL,
  facebook_page    text,
  service          text,
  date             date NOT NULL,
  time             text NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','cancelled','no_show')),
  notes            text,
  archived         boolean DEFAULT false,
  archived_reason  text,
  buy_service      text,
  buy_amount       numeric,
  buy_type         text CHECK (buy_type IN ('once','subscription','installments')),
  buy_monthly      numeric,
  buy_total        numeric,
  buy_installments integer,
  buy_notes        text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a booking" ON public.bookings FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins can read all bookings" ON public.bookings FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings(date);
CREATE INDEX IF NOT EXISTS bookings_phone_idx ON public.bookings(phone);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);

-- ── booking_notes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking_notes" ON public.booking_notes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── reviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  business   text NOT NULL,
  rating     integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       text NOT NULL,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins can read all reviews" ON public.reviews FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can moderate reviews" ON public.reviews FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── cold_calls ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cold_calls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  business_name   text,
  contact_name    text,
  phone           text,
  email           text,
  website         text,
  address         text,
  pueblo          text,
  industry        text,
  google_maps_url text,
  instagram_url   text,
  call_status     text DEFAULT 'pending'
                  CHECK (call_status IN ('pending','no_answer','answered','call_back','follow_up','not_interested','booked')),
  follow_up_date  date,
  followup_date   date,
  notes           text,
  responded       boolean DEFAULT false,
  booked_at       timestamptz
);
ALTER TABLE public.cold_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to cold_calls" ON public.cold_calls FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS cold_calls_status_idx ON public.cold_calls(call_status);
CREATE INDEX IF NOT EXISTS cold_calls_follow_up_idx ON public.cold_calls(follow_up_date);

-- ── crm_clients ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  phone            text,
  business         text,
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

CREATE POLICY "Admins can manage crm_clients" ON public.crm_clients FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Anyone can insert (onboarding form)
CREATE POLICY "Public can insert crm_clients" ON public.crm_clients FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS crm_clients_phone_idx ON public.crm_clients(phone);

-- ── push_subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text UNIQUE NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage push_subscriptions" ON public.push_subscriptions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── loyalty_cards ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number text UNIQUE,
  stamps      integer DEFAULT 0,
  cycle       integer DEFAULT 1,
  notes       text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own card" ON public.loyalty_cards FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all cards" ON public.loyalty_cards FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Card number generator (call via supabase.rpc('generate_card_number'))
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  num text;
BEGIN
  LOOP
    num := LPAD(FLOOR(RANDOM() * 1000000000)::text, 9, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.loyalty_cards WHERE card_number = num);
  END LOOP;
  RETURN num;
END;
$$;

-- ── stamp_history ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stamp_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id        uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  payment_amount numeric,
  stamped_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE public.stamp_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stamp_history" ON public.stamp_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── rewards ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rewards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  reward_type text,
  reward_cost integer,
  status      text DEFAULT 'pending' CHECK (status IN ('pending','redeemed','expired')),
  redeemed_at timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── catalog_items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage catalog_items" ON public.catalog_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── catalog_prices ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_prices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  currency   text DEFAULT 'usd',
  interval   text CHECK (interval IN ('month','year','once')),
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.catalog_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage catalog_prices" ON public.catalog_prices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── catalog_costs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_costs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  cost       numeric DEFAULT 0,
  notes      text,
  suppliers  text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.catalog_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage catalog_costs" ON public.catalog_costs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── catalog_cost_history ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_cost_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  cost       numeric,
  notes      text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.catalog_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage catalog_cost_history" ON public.catalog_cost_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── sales ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.catalog_items(id),
  quantity   integer DEFAULT 1,
  amount     numeric,
  notes      text,
  sold_by    uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── expenses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text,
  amount     numeric NOT NULL,
  notes      text,
  date       date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── supplies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  unit       text,
  quantity   numeric DEFAULT 0,
  min_stock  numeric DEFAULT 0,
  cost       numeric DEFAULT 0,
  notes      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supplies" ON public.supplies FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── supply_cost_history ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supply_cost_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id  uuid NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  cost       numeric,
  notes      text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.supply_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supply_cost_history" ON public.supply_cost_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── activity_log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  action     text NOT NULL,
  entity     text,
  entity_id  uuid,
  meta       jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity_log" ON public.activity_log FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS activity_log_created_idx ON public.activity_log(created_at DESC);
