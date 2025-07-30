-- Add missing real_time_data column to itineraries table
ALTER TABLE public.itineraries 
ADD COLUMN IF NOT EXISTS real_time_data JSONB;