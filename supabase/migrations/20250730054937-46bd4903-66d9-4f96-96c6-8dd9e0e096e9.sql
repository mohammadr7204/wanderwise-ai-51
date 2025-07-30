-- Add DELETE policy for itineraries table so users can delete their own itineraries
CREATE POLICY "Users can delete their own itineraries" 
ON public.itineraries 
FOR DELETE 
USING (trip_id IN ( SELECT trips.id FROM trips WHERE (trips.user_id = auth.uid())));