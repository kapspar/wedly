-- Wedly Database Schema
-- Initial migration: all tables for MVP + future feature support

-- Enums
CREATE TYPE public.user_role AS ENUM ('couple', 'vendor', 'admin');
CREATE TYPE public.wedding_type AS ENUM ('hindu', 'christian_catholic', 'interfaith');
CREATE TYPE public.event_type AS ENUM ('engagement', 'temple_ceremony', 'church_ceremony', 'reception', 'home_ceremony', 'sangeet', 'mehndi', 'other');
CREATE TYPE public.inquiry_status AS ENUM ('pending', 'read', 'replied', 'closed');
CREATE TYPE public.vendor_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.wedding_status AS ENUM ('planning', 'completed', 'cancelled');

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'couple',
  full_name text,
  email text NOT NULL,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Weddings
CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner1_name text NOT NULL,
  partner2_name text NOT NULL,
  wedding_type public.wedding_type NOT NULL,
  wedding_date date,
  seeking_auspicious_date boolean NOT NULL DEFAULT false,
  city text,
  slug text UNIQUE NOT NULL,
  status public.wedding_status NOT NULL DEFAULT 'planning',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wedding Events
CREATE TABLE public.wedding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  custom_label text,
  event_date date,
  event_time time,
  venue_name text,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Budget Categories
CREATE TABLE public.budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category text NOT NULL,
  budgeted numeric(10,2) NOT NULL DEFAULT 0,
  spent numeric(10,2) NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor Categories
CREATE TABLE public.vendor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  icon text,
  description text
);

-- Vendors
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES public.vendor_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  city text NOT NULL,
  area text,
  pricing_range text,
  website_url text,
  phone text,
  email text,
  instagram_url text,
  is_claimed boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  priority public.vendor_priority NOT NULL DEFAULT 'medium',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor Photos
CREATE TABLE public.vendor_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inquiries
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  couple_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wedding_id uuid REFERENCES public.weddings(id) ON DELETE SET NULL,
  message text NOT NULL,
  event_date date,
  guest_count int,
  status public.inquiry_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved Vendors
CREATE TABLE public.saved_vendors (
  couple_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, vendor_id)
);

-- Reviews (Phase 2 — table created now for schema readiness)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  couple_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks (wedding planning checklist)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  due_date date,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Guest List (future feature — table created now)
CREATE TABLE public.guest_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  party_size int NOT NULL DEFAULT 1,
  side text NOT NULL DEFAULT 'couple',
  rsvp_status text NOT NULL DEFAULT 'pending',
  dietary_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_weddings_couple_id ON public.weddings(couple_id);
CREATE INDEX idx_wedding_events_wedding_id ON public.wedding_events(wedding_id);
CREATE INDEX idx_budget_categories_wedding_id ON public.budget_categories(wedding_id);
CREATE INDEX idx_vendors_category_id ON public.vendors(category_id);
CREATE INDEX idx_vendors_city ON public.vendors(city);
CREATE INDEX idx_vendors_slug ON public.vendors(slug);
CREATE INDEX idx_vendor_photos_vendor_id ON public.vendor_photos(vendor_id);
CREATE INDEX idx_inquiries_vendor_id ON public.inquiries(vendor_id);
CREATE INDEX idx_inquiries_couple_id ON public.inquiries(couple_id);
CREATE INDEX idx_saved_vendors_couple_id ON public.saved_vendors(couple_id);
CREATE INDEX idx_tasks_wedding_id ON public.tasks(wedding_id);
CREATE INDEX idx_guest_list_wedding_id ON public.guest_list(wedding_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    'couple'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON public.weddings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON public.budget_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_guest_list_updated_at BEFORE UPDATE ON public.guest_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_list ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Weddings policies
CREATE POLICY "Couples can manage own wedding" ON public.weddings FOR ALL USING (couple_id = auth.uid());
CREATE POLICY "Admins can view all weddings" ON public.weddings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wedding events policies
CREATE POLICY "Couples can manage own events" ON public.wedding_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND couple_id = auth.uid())
);

-- Budget policies
CREATE POLICY "Couples can manage own budget" ON public.budget_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND couple_id = auth.uid())
);

-- Vendor categories: public read
CREATE POLICY "Anyone can view vendor categories" ON public.vendor_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage vendor categories" ON public.vendor_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Vendors: public read for published, admin full access
CREATE POLICY "Anyone can view published vendors" ON public.vendors FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all vendors" ON public.vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Vendor photos: public read
CREATE POLICY "Anyone can view vendor photos" ON public.vendor_photos FOR SELECT USING (true);
CREATE POLICY "Admins can manage vendor photos" ON public.vendor_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Inquiries
CREATE POLICY "Couples can create inquiries" ON public.inquiries FOR INSERT WITH CHECK (couple_id = auth.uid());
CREATE POLICY "Couples can view own inquiries" ON public.inquiries FOR SELECT USING (couple_id = auth.uid());
CREATE POLICY "Admins can view all inquiries" ON public.inquiries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update inquiries" ON public.inquiries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Saved vendors
CREATE POLICY "Couples can manage saved vendors" ON public.saved_vendors FOR ALL USING (couple_id = auth.uid());

-- Reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Couples can create reviews" ON public.reviews FOR INSERT WITH CHECK (couple_id = auth.uid());

-- Tasks
CREATE POLICY "Couples can manage own tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND couple_id = auth.uid())
);

-- Guest list
CREATE POLICY "Couples can manage own guest list" ON public.guest_list FOR ALL USING (
  EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND couple_id = auth.uid())
);
