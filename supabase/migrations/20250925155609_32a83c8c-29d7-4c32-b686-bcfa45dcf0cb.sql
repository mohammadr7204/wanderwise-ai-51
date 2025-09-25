-- Create table to track user's destination history for variety
CREATE TABLE public.destination_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggested_destination TEXT NOT NULL,
  destination_category TEXT NOT NULL,
  climate_type TEXT,
  travel_style TEXT,
  continent TEXT,
  suggested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.destination_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own destination history" 
ON public.destination_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can create destination history" 
ON public.destination_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_destination_history_user_id_date ON public.destination_history (user_id, suggested_at DESC);