-- Add 'quoted' status to the trips status check constraint
ALTER TABLE public.trips DROP CONSTRAINT trips_status_check;

ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'quoted'::text, 'generating'::text, 'completed'::text, 'archived'::text]));