
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create intersections table
CREATE TABLE public.intersections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_signal_state TEXT NOT NULL DEFAULT 'green',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create traffic_data table
CREATE TABLE public.traffic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intersection_id UUID REFERENCES public.intersections(id) ON DELETE CASCADE NOT NULL,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  average_speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_suggestions table
CREATE TABLE public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intersection_id UUID REFERENCES public.intersections(id) ON DELETE CASCADE NOT NULL,
  suggestion_type TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create traffic_scenarios table
CREATE TABLE public.traffic_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS policies for intersections (readable by all authenticated users)
ALTER TABLE public.intersections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read intersections" ON public.intersections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert intersections" ON public.intersections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update intersections" ON public.intersections FOR UPDATE TO authenticated USING (true);

-- RLS policies for traffic_data
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read traffic_data" ON public.traffic_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert traffic_data" ON public.traffic_data FOR INSERT TO authenticated WITH CHECK (true);

-- RLS policies for ai_suggestions
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ai_suggestions" ON public.ai_suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ai_suggestions" ON public.ai_suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ai_suggestions" ON public.ai_suggestions FOR UPDATE TO authenticated USING (true);

-- RLS policies for traffic_scenarios
ALTER TABLE public.traffic_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own scenarios" ON public.traffic_scenarios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenarios" ON public.traffic_scenarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON public.traffic_scenarios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON public.traffic_scenarios FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Signup trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
