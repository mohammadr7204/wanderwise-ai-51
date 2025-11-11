import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false
        }
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    console.log('User auth result:', { user: !!user, error: userError?.message });
    
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`);
    }

    const { tripId, amount } = await req.json();

    console.log('Charging for itinerary:', { tripId, amount, userId: user.id });

    // Get Stripe customer ID
    const { data: subscriber } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscriber?.stripe_customer_id) {
      throw new Error('No payment method on file. Please add a payment method first.');
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(subscriber.stripe_customer_id);
    
    if (customer.deleted || !customer.invoice_settings?.default_payment_method) {
      throw new Error('No payment method on file. Please add a payment method first.');
    }

    const paymentMethodId = typeof customer.invoice_settings.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings.default_payment_method.id;

    // Create payment intent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: subscriber.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Itinerary generation for trip ${tripId}`,
      metadata: {
        trip_id: tripId,
        user_id: user.id,
      },
    });

    console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

    // Record payment in trip_payments table
    await supabaseClient
      .from('trip_payments')
      .insert({
        trip_id: tripId,
        amount: amount,
        stripe_payment_id: paymentIntent.id,
        status: paymentIntent.status
      });

    // Update trip status to paid if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      await supabaseClient
        .from('trips')
        .update({ 
          status: 'paid',
          price_paid: amount 
        })
        .eq('id', tripId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentIntent.status,
        paymentId: paymentIntent.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in charge-itinerary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
