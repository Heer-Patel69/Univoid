import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import jsQR from 'https://esm.sh/jsqr@1.4.0';
import { PNG } from 'https://esm.sh/pngjs@7.0.0';
import jpeg from 'https://esm.sh/jpeg-js@0.4.4';

type RequestBody = {
  bucket: string;
  path: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

function parseUpiIdFromContent(data: string): string | null {
  const match = data.match(/upi:\/\/pay\?([^ \n\r\t]+)/i);
  if (!match) return null;

  try {
    const url = new URL(`upi://pay?${match[1]}`);
    const pa = url.searchParams.get('pa');
    if (pa && UPI_REGEX.test(pa)) return pa;
  } catch (_e) {
    return null;
  }
  return null;
}

function bufferToImageData(buffer: Uint8Array, contentType?: string): { data: Uint8ClampedArray; width: number; height: number } {
  if (contentType?.includes('png')) {
    const png = PNG.sync.read(buffer);
    return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
  }
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
    const { data, width, height } = jpeg.decode(buffer, { useTArray: true });
    return { data: new Uint8ClampedArray(data), width, height };
  }
  // Try both decoders as fallback
  try {
    const png = PNG.sync.read(buffer);
    return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
  } catch {
    // Fallback to JPEG
  }
  const { data, width, height } = jpeg.decode(buffer, { useTArray: true });
  return { data: new Uint8ClampedArray(data), width, height };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucket, path }: Partial<RequestBody> = await req.json();
    
    console.log('scan-upi: Processing request', { bucket, path });
    
    if (!bucket || !path) {
      return new Response(JSON.stringify({ success: false, error: 'bucket and path are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: fileData, error } = await supabase.storage.from(bucket).download(path);
    if (error || !fileData) {
      console.error('scan-upi: File download failed', error);
      return new Response(JSON.stringify({ success: false, error: 'File download failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Detect content type from file extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    
    const { data, width, height } = bufferToImageData(buffer, contentType);

    console.log('scan-upi: Image decoded', { width, height });

    const qr = jsQR(data, width, height);
    if (!qr?.data) {
      console.log('scan-upi: QR decode failed');
      return new Response(JSON.stringify({ success: false, error: 'QR decode failed - no QR code found in image' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: QR content', qr.data);

    const upiId = parseUpiIdFromContent(qr.data);
    if (!upiId) {
      console.log('scan-upi: UPI ID not found in QR content');
      return new Response(JSON.stringify({ success: false, error: 'UPI ID not found in QR - ensure this is a valid UPI payment QR' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: UPI ID extracted', upiId);

    return new Response(JSON.stringify({ success: true, upi_id: upiId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('scan-upi error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error processing QR image' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
