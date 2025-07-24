-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Update profiles table to sync with subscription tier
ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier DROP DEFAULT,
ADD CONSTRAINT check_subscription_tier 
CHECK (subscription_tier IN ('free', 'basic', 'premium', 'luxury'));

-- Create function to sync subscription tier between tables
CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table when subscribers table changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET subscription_tier = COALESCE(NEW.subscription_tier, 'free')
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to sync subscription tier
CREATE TRIGGER sync_subscription_tier_trigger
  AFTER INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_tier();

-- Create payments table for tracking individual payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  subscription_tier TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "select_own_payments" ON public.payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "insert_payment" ON public.payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "update_payment" ON public.payments
FOR UPDATE
USING (true);