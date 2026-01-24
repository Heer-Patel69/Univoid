import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

type RequestBody = {
  bucket: string;
  path: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

function parseUpiIdFromContent(data: string): string | null {
  // Try standard UPI URL format
  const upiMatch = data.match(/upi:\/\/pay\?([^ \n\r\t]+)/i);
  if (upiMatch) {
    try {
      const params = new URLSearchParams(upiMatch[1]);
      const pa = params.get('pa');
      if (pa && UPI_REGEX.test(pa)) return pa;
    } catch (_e) {
      // Continue to other extraction methods
    }
  }

  // Try to find pa= parameter directly
  const paMatch = data.match(/pa=([^&\s]+)/i);
  if (paMatch) {
    const pa = decodeURIComponent(paMatch[1]);
    if (UPI_REGEX.test(pa)) return pa;
  }

  // Try to find any UPI ID pattern in the string
  const upiIdMatch = data.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/);
  if (upiIdMatch && UPI_REGEX.test(upiIdMatch[1])) {
    return upiIdMatch[1];
  }

  return null;
}

// Try multiple QR decode services
async function decodeQRFromUrl(imageUrl: string): Promise<string | null> {
  const services = [
    // Primary: goqr.me API
    `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageUrl)}`,
  ];

  for (const serviceUrl of services) {
    try {
      console.log('scan-upi: Trying QR service:', serviceUrl.split('?')[0]);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(serviceUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('scan-upi: Service returned non-OK status:', response.status);
        continue;
      }

      const result = await response.json();
      console.log('scan-upi: QR decode result:', JSON.stringify(result));

      // Handle qrserver.com response format
      const qrData = result?.[0]?.symbol?.[0]?.data;
      if (qrData) {
        return qrData;
      }
    } catch (err) {
      console.log('scan-upi: Service failed:', err);
      continue;
    }
  }

  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { bucket, path }: Partial<RequestBody> = await req.json();

    console.log('scan-upi: Processing request', { bucket, path });

    if (!bucket || !path) {
      return new Response(JSON.stringify({ success: false, error: 'bucket and path are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get signed URL for the image (longer expiry for reliability)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300); // 5 minutes

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('scan-upi: Could not get signed URL', signedUrlError);
      return new Response(JSON.stringify({ success: false, error: 'Could not access file. Please try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: Got signed URL, attempting decode...');

    // Try to decode QR
    const qrData = await decodeQRFromUrl(signedUrlData.signedUrl);

    if (!qrData) {
      console.log('scan-upi: QR decode failed - no data extracted');
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not read QR code. Please ensure the image is clear and try again, or enter UPI ID manually.'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: QR content:', qrData);

    const upiId = parseUpiIdFromContent(qrData);
    if (!upiId) {
      console.log('scan-upi: UPI ID not found in QR content');
      return new Response(JSON.stringify({
        success: false,
        error: 'This QR code does not contain a valid UPI ID. Please ensure this is a UPI payment QR.'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: UPI ID extracted successfully:', upiId);

    return new Response(JSON.stringify({ success: true, upi_id: upiId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('scan-upi error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server error processing QR image. Please try again or enter UPI ID manually.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
