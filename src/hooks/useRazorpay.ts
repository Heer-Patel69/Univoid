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
  onCancel?: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function trackPaymentFailure(registrationId: string, details: Record<string, unknown>) {
  try {
    await supabase
      .from('event_registrations')
      .update({
        razorpay_payment_status: 'failed',
        razorpay_payment_details: {
          ...details,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', registrationId)
      .eq('payment_status', 'pending');
  } catch (error) {
    console.error('Failed to track Razorpay failure details:', error);
  }
}

export function useRazorpay({ eventTitle, onSuccess, onError, onCancel }: UseRazorpayOptions) {
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
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        const msg = 'Failed to load payment gateway. Please disable ad-blocker/VPN and try again.';
        await trackPaymentFailure(registrationId, { phase: 'sdk_load', message: msg });
        throw new Error(msg);
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount, eventId, userId, registrationId },
      });

      if (error) {
        await trackPaymentFailure(registrationId, { phase: 'order_create', message: error.message });
        throw new Error('Failed to create payment order. Please try again.');
      }

      if (!data?.orderId) {
        await trackPaymentFailure(registrationId, {
          phase: 'order_create',
          message: data?.error || 'No order ID returned',
          response: data,
        });
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'UniVoid',
        description: `Registration: ${eventTitle}`,
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registration_id: registrationId,
              },
            });

            if (verifyError || !verifyData?.verified) {
              await trackPaymentFailure(registrationId, {
                phase: 'verification',
                message: verifyData?.error || verifyError?.message || 'Payment verification failed',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });
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
            toast.info('Payment cancelled. You can retry from the same registration.');
            onCancel?.();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', async (response: unknown) => {
        setIsProcessing(false);

        const failed = response as {
          error?: {
            code?: string;
            description?: string;
            source?: string;
            step?: string;
            reason?: string;
            metadata?: { order_id?: string; payment_id?: string };
          };
        };

        const errMsg = failed.error?.description || 'Payment failed';

        await trackPaymentFailure(registrationId, {
          phase: 'checkout',
          message: errMsg,
          code: failed.error?.code,
          source: failed.error?.source,
          step: failed.error?.step,
          reason: failed.error?.reason,
          razorpay_order_id: failed.error?.metadata?.order_id || data.orderId,
          razorpay_payment_id: failed.error?.metadata?.payment_id,
        });

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
  }, [eventTitle, onSuccess, onError, onCancel]);

  return { initiatePayment, isProcessing };
}
