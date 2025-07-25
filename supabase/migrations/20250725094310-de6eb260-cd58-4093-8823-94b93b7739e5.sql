-- Update trips table to support the new per-trip pricing flow
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS price_paid DECIMAL;

-- Update trips table status to include new statuses
ALTER TABLE public.trips ALTER COLUMN status SET DEFAULT 'draft';

-- Create payments table for trip payments
CREATE TABLE IF NOT EXISTS public.trip_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.trip_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trip_payments
CREATE POLICY "Users can view their own trip payments" 
ON public.trip_payments 
FOR SELECT 
USING (
  trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create trip payments" 
ON public.trip_payments 
FOR INSERT 
WITH CHECK (
  trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Edge functions can update trip payments" 
ON public.trip_payments 
FOR UPDATE 
USING (true);

-- Create RLS policies for itineraries
CREATE POLICY "Users can view their own itineraries" 
ON public.itineraries 
FOR SELECT 
USING (
  trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Edge functions can create itineraries" 
ON public.itineraries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update itineraries" 
ON public.itineraries 
FOR UPDATE 
USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_trip_payments_updated_at
  BEFORE UPDATE ON public.trip_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();