import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface ScanUpiResult {
  success: boolean;
  upi_id?: string;
  error?: string;
}

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

// Parse UPI ID from QR content
function parseUpiIdFromContent(data: string): string | null {
  // Try standard UPI URL format: upi://pay?pa=example@upi&pn=Name
  const upiMatch = data.match(/upi:\/\/pay\?([^ \n\r\t]+)/i);
  if (upiMatch) {
    try {
      const params = new URLSearchParams(upiMatch[1]);
      const pa = params.get('pa');
      if (pa && UPI_REGEX.test(pa)) return pa;
    } catch (_e) {
      // Continue to other methods
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

// Client-side QR scanning from file
async function scanQRFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    // Create temporary hidden element before instantiating Html5Qrcode
    let tempDiv = document.getElementById("qr-reader-hidden");
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = "qr-reader-hidden";
      tempDiv.style.display = "none";
      document.body.appendChild(tempDiv);
    }

    const html5QrCode = new Html5Qrcode("qr-reader-hidden", { verbose: false });

    html5QrCode
      .scanFile(file, true)
      .then((decodedText) => {
        console.log("Client QR scan success:", decodedText);
        html5QrCode.clear().catch(() => {}); // Clean up instance
        resolve(decodedText);
      })
      .catch((err) => {
        console.log("Client QR scan failed:", err);
        html5QrCode.clear().catch(() => {}); // Clean up instance
        resolve(null);
      });
  });
}

export const useUpiScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const scanUpiFromFile = async (
    file: File,
    userId: string
  ): Promise<string | null> => {
    if (!file) return null;

    setIsScanning(true);

    try {
      // STEP 1: Try client-side scanning first (faster & more reliable)
      console.log("Attempting client-side QR scan...");
      const qrContent = await scanQRFromFile(file);
      
      if (qrContent) {
        const upiId = parseUpiIdFromContent(qrContent);
        if (upiId) {
          toast({
            title: "✅ UPI ID Detected",
            description: `Found: ${upiId}`,
          });
          setIsScanning(false);
          return upiId;
        }
      }

      // STEP 2: Fallback to server-side scanning
      console.log("Client scan failed, trying server-side...");
      
      const ext = file.name.split(".").pop();
      const path = `${userId}/upi-qr-temp/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("event-assets")
        .upload(path, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload Failed",
          description: "Could not upload QR image for scanning.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke<ScanUpiResult>("scan-upi", {
        body: { bucket: "event-assets", path },
      });

      // Clean up temp file
      await supabase.storage.from("event-assets").remove([path]);

      if (error) {
        console.error("Server scan error:", error);
        toast({
          title: "Scan Failed",
          description: "Could not scan QR code. Please enter UPI ID manually.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.success && data?.upi_id) {
        toast({
          title: "✅ UPI ID Detected",
          description: `Found: ${data.upi_id}`,
        });
        return data.upi_id;
      } else {
        toast({
          title: "No UPI ID Found",
          description: data?.error || "Could not extract UPI ID from QR. Please enter manually.",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error("UPI scan error:", err);
      toast({
        title: "Scan Error",
        description: "An error occurred while scanning. Please enter UPI ID manually.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  return { scanUpiFromFile, isScanning };
};
