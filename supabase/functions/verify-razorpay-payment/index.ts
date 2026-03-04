import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return expectedSignature === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
      throw new Error('Razorpay credentials not configured');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registration_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registration_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET,
    );

    if (!isValid) {
      console.error('Invalid Razorpay signature for order:', razorpay_order_id);
      return new Response(JSON.stringify({ error: 'Payment verification failed', verified: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch full payment details from Razorpay API
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    let paymentDetails: Record<string, unknown> = {};
    
    try {
      const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        paymentDetails = {
          method: paymentData.method, // upi, card, netbanking, wallet
          vpa: paymentData.vpa, // UPI ID if UPI
          bank: paymentData.bank,
          wallet: paymentData.wallet,
          card_id: paymentData.card_id,
          card_last4: paymentData.card?.last4,
          card_network: paymentData.card?.network,
          email: paymentData.email,
          contact: paymentData.contact,
          fee: paymentData.fee, // Razorpay fee in paise
          tax: paymentData.tax,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          captured: paymentData.captured,
          created_at: paymentData.created_at,
          description: paymentData.description,
          error_code: paymentData.error_code,
          error_description: paymentData.error_description,
          international: paymentData.international,
          acquirer_data: paymentData.acquirer_data, // Contains UPI transaction ID etc.
        };
      } else {
        console.warn('Failed to fetch payment details from Razorpay:', await paymentRes.text());
      }
    } catch (fetchErr) {
      console.warn('Error fetching Razorpay payment details:', fetchErr);
    }

    // Update registration with payment details and auto-approve
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: 'approved',
        reviewed_at: new Date().toISOString(),
        razorpay_payment_method: (paymentDetails.method as string) || null,
        razorpay_payment_status: (paymentDetails.status as string) || 'captured',
        razorpay_paid_at: paymentDetails.created_at 
          ? new Date((paymentDetails.created_at as number) * 1000).toISOString()
          : new Date().toISOString(),
        razorpay_payment_details: paymentDetails,
      })
      .eq('id', registration_id);

    if (updateError) {
      console.error('Failed to update registration:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update registration status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Payment verified and registration approved:', registration_id, 'method:', paymentDetails.method);

    return new Response(JSON.stringify({ 
      verified: true, 
      message: 'Payment verified and registration approved',
      payment_method: paymentDetails.method,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return new Response(JSON.stringify({ error: error.message, verified: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
