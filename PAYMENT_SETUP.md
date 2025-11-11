# Payment Setup Instructions

## Stripe Integration

This app now uses automatic payment charging before itinerary generation. Here's how the payment flow works:

### User Flow
1. **Add Payment Method**: Users add a credit/debit card to their account on the Dashboard
2. **Create Trip**: Users go through the trip creation wizard
3. **Review & Quote**: System shows pricing based on trip details
4. **Automatic Charge**: When user clicks "Pay & Generate", the saved payment method is automatically charged
5. **Itinerary Generation**: Only after successful payment, the AI generates the itinerary

### Setup Required

You need to add your Stripe publishable key to your environment:

1. Get your publishable key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Add it to your project's environment variables:
   - Variable name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)

The Stripe secret key (`STRIPE_SECRET_KEY`) is already configured in Supabase secrets.

### Testing

For testing, use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Any future expiry date and any 3-digit CVC

### Edge Functions

Three new edge functions handle payment:
1. **add-payment-method**: Saves a payment method to the customer
2. **get-payment-method**: Retrieves the saved payment method
3. **charge-itinerary**: Automatically charges the saved card for itinerary generation

### Database

The `trip_payments` table tracks all payment transactions with:
- Trip ID reference
- Amount charged
- Stripe payment ID
- Payment status

Payment is required before itinerary generation begins.
