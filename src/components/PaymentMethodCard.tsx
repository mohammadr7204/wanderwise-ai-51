import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';
import { useStripePayment } from '@/hooks/useStripePayment';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentMethodForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { addPaymentMethod, loading } = useStripePayment();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setError(null);

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (stripeError) {
      setError(stripeError.message || 'Failed to add payment method');
      return;
    }

    if (paymentMethod) {
      try {
        await addPaymentMethod(paymentMethod.id);
        onSuccess();
      } catch (err) {
        setError('Failed to save payment method');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: 'hsl(var(--foreground))',
                '::placeholder': {
                  color: 'hsl(var(--muted-foreground))',
                },
              },
            },
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Adding...' : 'Add Payment Method'}
      </Button>
    </form>
  );
};

export const PaymentMethodCard = () => {
  const { paymentMethod, getPaymentMethod, loading } = useStripePayment();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getPaymentMethod();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    getPaymentMethod();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>
          Add a payment method to automatically charge for itinerary generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : paymentMethod && !showForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium capitalize">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(true)} 
              className="w-full"
            >
              Update Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {showForm ? (
              <>
                <Elements stripe={stripePromise}>
                  <PaymentMethodForm onSuccess={handleSuccess} />
                </Elements>
                {paymentMethod && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowForm(false)} 
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
