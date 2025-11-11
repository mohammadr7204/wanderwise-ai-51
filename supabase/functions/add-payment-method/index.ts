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
    console.log('Auth header received:', authHeader ? authHeader.substring(0, 30) + '...' : 'NONE');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const { paymentMethodId } = await req.json();

    console.log('Adding payment method for user:', user.id);

    // Get or create Stripe customer
    const { data: subscriber } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscriber?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;

      // Update subscribers table
      const { data: upsertData, error: upsertError } = await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email!,
          stripe_customer_id: customerId
        }, {
          onConflict: 'user_id'
        })
        .select();

      console.log('Upsert result:', upsertData, 'error:', upsertError);
      
      if (upsertError) {
        console.error('Failed to upsert subscriber:', upsertError);
      }
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Retrieve payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in add-payment-method:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
