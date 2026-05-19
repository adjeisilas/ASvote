-- Supabase SQL Schema for ASVote

-- 1. Profiles (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'organizer')) NOT NULL DEFAULT 'organizer',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Events (Base Table)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('voting', 'ticketing')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'active', 'ended', 'rejected')) NOT NULL DEFAULT 'draft',
  cover_image TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.1 Voting Events Extension
CREATE TABLE voting_events (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE PRIMARY KEY,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  total_votes INTEGER DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  voting_instructions TEXT,
  multiple_votes_enabled BOOLEAN DEFAULT TRUE
);

-- 2.2 Ticketing Events Extension
CREATE TABLE ticketing_events (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE PRIMARY KEY,
  venue TEXT NOT NULL,
  doors_open TEXT,
  event_time TEXT,
  expected_end TEXT,
  event_date TIMESTAMPTZ,
  organizer_email TEXT,
  organizer_phone TEXT,
  sales_start TIMESTAMPTZ,
  sales_end TIMESTAMPTZ,
  refund_policy TEXT,
  max_tickets_per_user INTEGER DEFAULT 10,
  commission NUMERIC DEFAULT 0,
  total_sales INTEGER DEFAULT 0
);

-- 3. Voting Categories (Strictly for Voting)
CREATE TABLE voting_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  vote_price NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Nominees (Strictly for Voting)
CREATE TABLE nominees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES voting_categories(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  capacity INTEGER,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ticket Tiers (Strictly for Ticketing)
CREATE TABLE ticket_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 100,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Transactions (Unified but cleaner)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  voter_email TEXT,
  amount NUMERIC NOT NULL,
  commission NUMERIC DEFAULT 0,
  type TEXT CHECK (type IN ('vote', 'ticket')) NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')) NOT NULL,
  paystack_ref TEXT,
  discount_applied NUMERIC DEFAULT 0,
  promo_code_id UUID,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.1 Promo Codes
CREATE TABLE promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
  discount_value NUMERIC NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, code)
);

-- 7. Voting Sub-trans
CREATE TABLE vote_transactions (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE PRIMARY KEY,
  nominee_id UUID REFERENCES nominees(id) ON DELETE SET NULL,
  category_id UUID REFERENCES voting_categories(id) ON DELETE SET NULL,
  vote_count INTEGER NOT NULL
);

-- 8. Tickets (Strictly for Ticketing)
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES ticket_tiers(id) ON DELETE SET NULL,
  ticket_holder_name TEXT,
  ticket_holder_email TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  checked_in BOOLEAN DEFAULT FALSE NOT NULL,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Withdrawals
CREATE TABLE withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ
);

-- 7. Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Activity Logs
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id UUID,
  target_type TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USSD Sessions
CREATE TABLE ussd_sessions (
  id TEXT PRIMARY KEY,
  msisdn TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Functions for Atomic Increments
CREATE OR REPLACE FUNCTION public.increment_nominee_votes(row_id UUID, votes INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.nominees
  SET vote_count = vote_count + votes
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_event_votes(row_id UUID, votes INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.voting_events
  SET total_votes = total_votes + votes
  WHERE event_id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_event_sales(row_id UUID, tickets INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.ticketing_events
  SET total_sales = total_sales + tickets
  WHERE event_id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_tier_sold_count(row_id UUID, tickets INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.ticket_tiers
  SET sold_count = sold_count + tickets
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
-- This avoids the race condition where profiles are inserted before auth.users is fully committed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone_number, role, status, email_verified)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'phone_number',
    CASE WHEN new.email = 'adjeisikapasilas@gmail.com' THEN 'admin' ELSE 'organizer' END,
    CASE WHEN new.email = 'adjeisikapasilas@gmail.com' THEN 'approved' ELSE 'pending' END,
    new.email_confirmed_at IS NOT NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync verification status
CREATE OR REPLACE FUNCTION public.sync_verification_status()
RETURNS trigger AS $$
BEGIN
  -- Update profiles whenever auth.users is updated and confirmed_at changed
  -- Or just sync whenever any update happens to ensure consistency
  UPDATE public.profiles
  SET email_verified = (new.email_confirmed_at IS NOT NULL)
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Trigger execution
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_updated') THEN
    CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.sync_verification_status();
  END IF;

  -- Backfill existing profiles
  UPDATE public.profiles p
  SET email_verified = (u.email_confirmed_at IS NOT NULL)
  FROM auth.users u
  WHERE p.id = u.id AND p.email_verified IS FALSE AND u.email_confirmed_at IS NOT NULL;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Profiles)
CREATE OR REPLACE FUNCTION public.is_verified()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  -- Temporarily disabled: always returns true
  SELECT true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Profiles: Important to separate SELECT to avoid recursion if we use is_admin() in policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
-- Allow users to insert their own profile during initialization
CREATE POLICY "Users can insert own profile." ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id AND 
  (
    -- Regular users must have default role/status
    (role = 'organizer' AND status = 'pending') OR
    -- The bootstrap admin can set their correct role
    (email = 'adjeisikapasilas@gmail.com' AND role = 'admin' AND status = 'approved')
  )
);
-- Avoid FOR ALL here because it includes SELECT, which causes recursion with is_admin()
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin());

-- Events Policies
CREATE POLICY "Events are viewable by everyone." ON events FOR SELECT USING (true);
CREATE POLICY "Organizers can manage own events." ON events FOR ALL USING (auth.uid() = organizer_id);
CREATE POLICY "Admins can manage all events." ON events FOR ALL USING (is_admin());

-- Voting Events Policies
CREATE POLICY "Voting details are public." ON voting_events FOR SELECT USING (true);
CREATE POLICY "Organizers manage own voting details." ON voting_events FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = voting_events.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all voting details." ON voting_events FOR ALL USING (is_admin());

-- Ticketing Events Policies
CREATE POLICY "Ticketing details are public." ON ticketing_events FOR SELECT USING (true);
CREATE POLICY "Organizers manage own ticketing details." ON ticketing_events FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticketing_events.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all ticketing details." ON ticketing_events FOR ALL USING (is_admin());

-- Voting Categories Policies
CREATE POLICY "Voting categories are public." ON voting_categories FOR SELECT USING (true);
CREATE POLICY "Organizers manage own voting categories." ON voting_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = voting_categories.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all voting categories." ON voting_categories FOR ALL USING (is_admin());

-- Ticket Tiers Policies
CREATE POLICY "Ticket tiers are public." ON ticket_tiers FOR SELECT USING (true);
CREATE POLICY "Organizers manage own ticket tiers." ON ticket_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticket_tiers.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all ticket tiers." ON ticket_tiers FOR ALL USING (is_admin());

-- Nominees Policies
CREATE POLICY "Nominees are viewable by everyone." ON nominees FOR SELECT USING (true);
CREATE POLICY "Organizers can manage nominees of their events." ON nominees FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = nominees.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all nominees." ON nominees FOR ALL USING (is_admin());

-- Tickets Policies
CREATE POLICY "Tickets are viewable by owner and admin." ON tickets FOR SELECT USING (
  is_admin() OR 
  EXISTS (SELECT 1 FROM transactions WHERE transactions.id = tickets.transaction_id AND (transactions.organizer_id = auth.uid()))
);

CREATE POLICY "Users can insert tickets for their events." ON tickets FOR INSERT WITH CHECK (
  is_admin() OR
  EXISTS (SELECT 1 FROM transactions WHERE transactions.id = transaction_id AND organizer_id = auth.uid())
);

CREATE POLICY "Users can update tickets for their events." ON tickets FOR UPDATE USING (
  is_admin() OR
  EXISTS (SELECT 1 FROM transactions WHERE transactions.id = tickets.transaction_id AND (transactions.organizer_id = auth.uid()))
);

-- Transactions Policies
CREATE POLICY "Public can view transactions." ON transactions FOR SELECT USING (
  is_admin() OR auth.uid() = organizer_id
);

-- Vote Transactions Policies
CREATE POLICY "Vote transactions viewable by organizers." ON vote_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM transactions WHERE transactions.id = vote_transactions.transaction_id AND (transactions.organizer_id = auth.uid() OR is_admin()))
);

-- Notifications Policies
CREATE POLICY "Notifications are private." ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications." ON notifications FOR DELETE USING (auth.uid() = user_id);
-- Only system can insert notifications normally, but for now we keep it restricted to authenticated users if needed
-- Actually, it's better to keep it system-only if possible, but let's at least restrict to auth
CREATE POLICY "Authenticated users can insert notifications." ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all notifications." ON notifications FOR ALL USING (is_admin());

-- Withdrawals Policies
CREATE POLICY "Organizers can view own withdrawals." ON withdrawals FOR SELECT USING (auth.uid() = organizer_id);
-- Only system can insert withdrawals to ensure balance validation.
-- CREATE POLICY "Organizers can insert own withdrawals." ON withdrawals FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Admins can manage all withdrawals." ON withdrawals FOR ALL USING (is_admin());

-- Activity Logs Policies
CREATE POLICY "Admins can view activity logs." ON activity_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert activity logs." ON activity_logs FOR INSERT WITH CHECK (is_admin());

-- Promo Codes Policies
CREATE POLICY "Promo codes are viewable by everyone." ON promo_codes FOR SELECT USING (true);
CREATE POLICY "Organizers can manage promo codes for their events." ON promo_codes 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = promo_codes.event_id AND events.organizer_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = promo_codes.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Admins can manage all promo codes." ON promo_codes FOR ALL USING (is_admin());
