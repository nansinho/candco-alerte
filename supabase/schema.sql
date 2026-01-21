-- CandCO Alerte - Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (facilities/locations)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings within sites
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors within buildings
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones within floors
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'site_manager', 'sst', 'employee')),
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Site assignments (which sites a user has access to)
CREATE TABLE IF NOT EXISTS user_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('fire', 'accident', 'medical', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  site_id UUID REFERENCES sites(id),
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  zone_id UUID REFERENCES zones(id),
  created_by UUID REFERENCES profiles(id),
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert photos
CREATE TABLE IF NOT EXISTS alert_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert messages (chat)
CREATE TABLE IF NOT EXISTS alert_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- User sites policies
CREATE POLICY "Users can view their site assignments" ON user_sites
  FOR SELECT USING (auth.uid() = user_id);

-- Sites policies
CREATE POLICY "Users can view sites they are assigned to" ON sites
  FOR SELECT USING (
    id IN (SELECT site_id FROM user_sites WHERE user_id = auth.uid())
  );

-- Buildings policies
CREATE POLICY "Users can view buildings of their sites" ON buildings
  FOR SELECT USING (
    site_id IN (SELECT site_id FROM user_sites WHERE user_id = auth.uid())
  );

-- Floors policies
CREATE POLICY "Users can view floors of their sites" ON floors
  FOR SELECT USING (
    building_id IN (
      SELECT b.id FROM buildings b
      JOIN user_sites us ON b.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Zones policies
CREATE POLICY "Users can view zones of their sites" ON zones
  FOR SELECT USING (
    floor_id IN (
      SELECT f.id FROM floors f
      JOIN buildings b ON f.building_id = b.id
      JOIN user_sites us ON b.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Alerts policies
CREATE POLICY "Users can view alerts of their sites" ON alerts
  FOR SELECT USING (
    site_id IN (SELECT site_id FROM user_sites WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create alerts" ON alerts
  FOR INSERT WITH CHECK (
    site_id IN (SELECT site_id FROM user_sites WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update alerts of their sites" ON alerts
  FOR UPDATE USING (
    site_id IN (SELECT site_id FROM user_sites WHERE user_id = auth.uid())
  );

-- Alert photos policies
CREATE POLICY "Users can view alert photos" ON alert_photos
  FOR SELECT USING (
    alert_id IN (
      SELECT a.id FROM alerts a
      JOIN user_sites us ON a.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add alert photos" ON alert_photos
  FOR INSERT WITH CHECK (
    alert_id IN (
      SELECT a.id FROM alerts a
      JOIN user_sites us ON a.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Alert messages policies
CREATE POLICY "Users can view alert messages" ON alert_messages
  FOR SELECT USING (
    alert_id IN (
      SELECT a.id FROM alerts a
      JOIN user_sites us ON a.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send alert messages" ON alert_messages
  FOR INSERT WITH CHECK (
    alert_id IN (
      SELECT a.id FROM alerts a
      JOIN user_sites us ON a.site_id = us.site_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Check-ins policies
CREATE POLICY "Users can view their check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA (for testing)
-- =====================================================

-- Create a test organization
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'CandCO Test')
ON CONFLICT DO NOTHING;

-- Create a test site
INSERT INTO sites (id, organization_id, name, address, check_in_enabled) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Siège Social', '123 Rue de Test, Paris', true)
ON CONFLICT DO NOTHING;

-- Create test buildings
INSERT INTO buildings (id, site_id, name) VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Bâtiment A'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Bâtiment B')
ON CONFLICT DO NOTHING;

-- Create test floors
INSERT INTO floors (id, building_id, name, level) VALUES
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'RDC', 0),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', '1er étage', 1),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', '2ème étage', 2)
ON CONFLICT DO NOTHING;

-- Create test zones
INSERT INTO zones (id, floor_id, name) VALUES
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 'Accueil'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000005', 'Open Space'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006', 'Salle de réunion')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Create storage bucket for alert photos (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('alert-photos', 'alert-photos', true);
