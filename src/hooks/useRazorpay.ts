import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  modal?: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface UseRazorpayOptions {
  eventTitle: string;
  onSuccess: (paymentId: string) => void;
  onError?: (error: string) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay({ eventTitle, onSuccess, onError }: UseRazorpayOptions) {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = useCallback(async (
    amount: number,
    eventId: string,
    userId: string,
    registrationId: string,
    prefill?: { name?: string; email?: string; contact?: string },
  ) => {
    setIsProcessing(true);

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway. Please check your internet connection.');
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount, eventId, userId },
      });

      if (error || !data?.orderId) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'UniVoid',
        description: `Registration: ${eventTitle}`,
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment on backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registration_id: registrationId,
              },
            });

            if (verifyError || !verifyData?.verified) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Payment successful! Your ticket is confirmed.');
            onSuccess(response.razorpay_payment_id);
          } catch (verifyErr) {
            const msg = verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed';
            toast.error(msg);
            onError?.(msg);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill,
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: unknown) => {
        setIsProcessing(false);
        const errMsg = (response as { error?: { description?: string } })?.error?.description || 'Payment failed';
        toast.error(errMsg);
        onError?.(errMsg);
      });
      razorpay.open();
    } catch (err) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Payment initiation failed';
      toast.error(msg);
      onError?.(msg);
    }
  }, [eventTitle, onSuccess, onError]);

  return { initiatePayment, isProcessing };
}
