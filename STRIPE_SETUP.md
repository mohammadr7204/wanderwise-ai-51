# Stripe Payment Integration Setup Guide

## Overview
This guide covers setting up Stripe payments for WanderWise travel itinerary purchases. The system uses one-time payments (not subscriptions) through Stripe Checkout.

## Required Environment Variables

You need to configure these environment variables in your Supabase Edge Functions secrets:

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Your Stripe Secret Key (starts with `sk_test_` for test mode or `sk_live_` for production)

### Supabase Configuration  
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

## Setup Instructions

### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Complete business verification if required

### 2. Get Stripe API Keys
1. In Stripe Dashboard, go to **Developers > API Keys**
2. Copy your **Secret Key** (starts with `sk_test_` for test mode)
3. For production, switch to live mode and get live keys

### 3. Configure Supabase Secrets
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings > Edge Functions**
3. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

### 4. Test the Integration

#### Test Mode Setup
- Use Stripe test keys (starting with `sk_test_`)
- Use test card numbers for payments:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Requires 3DS: `4000 0025 0000 3155`

#### Production Setup
- Switch to live Stripe keys (starting with `sk_live_`)
- Update webhook endpoints if using webhooks
- Test with real payment methods in small amounts

## Payment Flow

1. **Quote Generation**: User selects service tier and sees pricing
2. **Payment Processing**: `create-checkout` function creates Stripe checkout session
3. **Stripe Checkout**: User redirected to Stripe-hosted payment page
4. **Payment Success**: User redirected back to `/trip/{tripId}/generating?payment=success`
5. **AI Generation**: Real itinerary generation begins
6. **Completion**: User sees completed itinerary

## Error Handling

The system includes comprehensive error handling for:
- Missing environment variables
- Invalid payment parameters
- Stripe API errors
- Authentication failures
- Network timeouts

## URL Configuration

### Development
- Success URL: `http://localhost:3000/trip/{tripId}/generating?payment=success`
- Cancel URL: `http://localhost:3000/trip/{tripId}/quote?payment=cancelled`

### Production
- Success URL: `https://yourdomain.com/trip/{tripId}/generating?payment=success`
- Cancel URL: `https://yourdomain.com/trip/{tripId}/quote?payment=cancelled`

## Debugging

### Enable Logging
The Edge Function includes comprehensive logging. Check logs in:
1. Supabase Dashboard > Edge Functions > Logs
2. Browser Developer Console
3. Network tab for API responses

### Common Issues

1. **"Missing STRIPE_SECRET_KEY"**
   - Ensure secret is set in Supabase Edge Functions settings
   - Verify key format (starts with `sk_test_` or `sk_live_`)

2. **"User not authenticated"**
   - Check user is logged in
   - Verify JWT token is being passed correctly

3. **"Invalid JSON in request body"**
   - Verify frontend is sending correct parameters: `tripId`, `amount`, `tierName`

4. **Stripe API Errors**
   - Check Stripe Dashboard for declined payments
   - Verify test card numbers in test mode

## Security Notes

- Never expose Stripe secret keys in frontend code
- Use HTTPS in production
- Validate all payment amounts server-side
- Implement proper user authentication
- Monitor for fraudulent transactions

## Support Links

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Lovable Stripe Integration Guide](https://docs.lovable.dev/integrations/stripe)