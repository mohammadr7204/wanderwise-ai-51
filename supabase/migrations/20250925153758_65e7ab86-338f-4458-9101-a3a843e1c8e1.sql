-- Fix overly permissive INSERT and UPDATE policies for payment tables

-- 1. Fix subscribers table policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure policies for subscribers table
CREATE POLICY "Users can create their own subscription record" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.email() = email);

CREATE POLICY "Only authenticated users can update subscription records" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.email() = email);

-- 2. Fix payments table policies  
DROP POLICY IF EXISTS "insert_payment" ON public.payments;
DROP POLICY IF EXISTS "update_payment" ON public.payments;

-- Create secure policies for payments table
CREATE POLICY "Users can only create their own payment records" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only system can update payment records" 
ON public.payments 
FOR UPDATE 
USING (false); -- Only allow updates through edge functions with service role

-- 3. Fix trip_payments table policies
-- The existing INSERT policy is already secure, but UPDATE policy needs fixing
DROP POLICY IF EXISTS "Edge functions can update trip payments" ON public.trip_payments;

CREATE POLICY "Only system can update trip payment records" 
ON public.trip_payments 
FOR UPDATE 
USING (false); -- Only allow updates through edge functions with service role