import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethodInfo {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null);

  const addPaymentMethod = async (paymentMethodId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      console.log('Adding payment method with token:', session.access_token.substring(0, 20) + '...');
      
      const { data, error } = await supabase.functions.invoke('add-payment-method', {
        body: { paymentMethodId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      setPaymentMethod(data.paymentMethod);
      toast.success('Payment method added successfully');
      return data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethod = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session found for getPaymentMethod');
        setPaymentMethod(null);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('get-payment-method', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      setPaymentMethod(data.paymentMethod);
      return data.paymentMethod;
    } catch (error) {
      console.error('Error fetching payment method:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const chargeForItinerary = async (tripId: string, amount: number) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('You must be logged in to make a payment');
        return { success: false };
      }

      const { data, error } = await supabase.functions.invoke('charge-itinerary', {
        body: { tripId, amount },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.status === 'succeeded') {
        toast.success('Payment successful! Generating itinerary...');
        return { success: true, paymentId: data.paymentId };
      } else {
        toast.error('Payment failed. Please check your payment method.');
        return { success: false };
      }
    } catch (error) {
      console.error('Error charging for itinerary:', error);
      toast.error('Payment processing failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    paymentMethod,
    addPaymentMethod,
    getPaymentMethod,
    chargeForItinerary
  };
};
