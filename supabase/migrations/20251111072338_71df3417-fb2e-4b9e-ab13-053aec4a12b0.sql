-- Allow edge functions to insert and update subscriber records
CREATE POLICY "Edge functions can manage subscribers"
ON subscribers
FOR ALL
USING (true)
WITH CHECK (true);