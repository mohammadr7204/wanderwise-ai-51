import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  try {
    // Environment validation
    const requiredEnvVars = {
      STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY")
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      logStep("Environment validation failed", { missingVars });
      throw new Error(errorMsg);
    }

    logStep("Environment variables validated");

    const supabaseClient = createClient(
      requiredEnvVars.SUPABASE_URL!,
      requiredEnvVars.SUPABASE_ANON_KEY!
    );

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed", { body: requestBody });
    } catch (parseError: any) {
      logStep("Request body parse error", { error: parseError.message });
      throw new Error("Invalid JSON in request body");
    }

    const { tripId, amount, tierName } = requestBody;
    
    // Enhanced parameter validation
    const validationErrors = [];
    if (!tripId || typeof tripId !== 'string') validationErrors.push("tripId must be a non-empty string");
    if (!amount || typeof amount !== 'number' || amount <= 0) validationErrors.push("amount must be a positive number");
    if (!tierName || typeof tierName !== 'string') validationErrors.push("tierName must be a non-empty string");

    if (validationErrors.length > 0) {
      const errorMsg = `Validation errors: ${validationErrors.join(', ')}`;
      logStep("Parameter validation failed", { errors: validationErrors, received: { tripId, amount, tierName } });
      throw new Error(errorMsg);
    }

    logStep("Parameters validated", { tripId, amount, tierName });

    // Initialize Stripe with error handling
    let stripe;
    try {
      stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, { 
        apiVersion: "2023-10-16" 
      });
      logStep("Stripe client initialized");
    } catch (stripeError: any) {
      logStep("Stripe initialization failed", { error: stripeError.message });
      throw new Error("Payment system initialization failed");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header");
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("Authentication error", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    const user = data.user;
    if (!user?.email) {
      logStep("User not authenticated or no email");
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for existing Stripe customer
    logStep("Checking for existing Stripe customer");
    let customerId;
    
    try {
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        logStep("No existing customer found, will create new one");
      }
    } catch (customerError: any) {
      logStep("Error checking customer", { error: customerError.message });
      // Continue without customer ID - Stripe will create one
    }

    // Validate origin for redirect URLs
    const origin = req.headers.get("origin");
    if (!origin) {
      logStep("Missing origin header");
      throw new Error("Missing origin header for redirect URLs");
    }

    const successUrl = `${origin}/trip/${tripId}/generating?payment=success`;
    const cancelUrl = `${origin}/trip/${tripId}/quote?payment=cancelled`;
    
    logStep("Creating Stripe checkout session", {
      customerId,
      userEmail: user.email,
      amount,
      tierName,
      successUrl,
      cancelUrl
    });

    // Create Stripe checkout session with enhanced error handling
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: `${tierName} Itinerary`,
                description: `WanderWise ${tierName} Travel Itinerary`
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment", // One-time payment, not subscription
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          tripId: tripId,
          tierName: tierName,
          userId: user.id
        }
      });

      logStep("Stripe checkout session created successfully", { 
        sessionId: session.id, 
        url: session.url 
      });

    } catch (stripeSessionError: any) {
      logStep("Stripe session creation failed", { error: stripeSessionError.message });
      throw new Error(`Failed to create payment session: ${stripeSessionError.message}`);
    }

    if (!session.url) {
      logStep("No checkout URL in session", { sessionId: session.id });
      throw new Error("Payment session created but no checkout URL available");
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});