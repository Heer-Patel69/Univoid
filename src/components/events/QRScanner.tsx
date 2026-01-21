import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, AlertTriangle, Scan } from 'lucide-react';

interface QRScannerProps {
  onScan: (qrCode: string) => Promise<void>;
  eventId: string;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export default function QRScanner({ onScan, eventId }: QRScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanner = useCallback(async () => {
    if (scanCooldownRef.current) {
      clearTimeout(scanCooldownRef.current);
      scanCooldownRef.current = null;
    }
    
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanStatus('idle');
    setStatusMessage('');
    isProcessingRef.current = false;
    lastScannedRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    
    setIsStarting(true);
    setError(null);
    isProcessingRef.current = false;
    lastScannedRef.current = null;
    
    try {
      // Step 1: Verify camera permission with simple constraints first (mobile-friendly)
      // Using basic constraints to avoid OverconstrainedError on mobile devices
      let permissionGranted = false;
      
      // Try permission check with basic video constraint
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true // Most compatible - works on all mobile browsers
        });
        console.log('[QRScanner] Camera access granted');
        stream.getTracks().forEach(track => track.stop());
        permissionGranted = true;
      } catch (permErr: any) {
        console.log('[QRScanner] Permission check error:', permErr.name, permErr.message);
        
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings and reload the page.');
        }
        if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
          throw new Error('No camera found on this device.');
        }
        if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
          throw new Error('Camera is busy or in use by another app. Please close other camera apps and try again.');
        }
        if (permErr.name === 'AbortError') {
          throw new Error('Camera initialization was cancelled. Please try again.');
        }
        // For OverconstrainedError or other errors, continue anyway
        console.log('[QRScanner] Continuing despite initial error...');
        permissionGranted = true; // Try to start scanner anyway
      }

      if (!permissionGranted) {
        throw new Error('Could not access camera. Please check your browser settings.');
      }

      // Step 2: Create scanner instance
      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
        formatsToSupport: [0], // QR_CODE only for faster detection
      });
      scannerRef.current = scanner;

      // Step 3: Get available cameras with error handling
      let devices: { id: string; label: string }[] = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (cameraListErr) {
        console.log('[QRScanner] Could not enumerate cameras, using facingMode fallback');
        // Continue with facingMode - this often works even when enumeration fails
      }
      
      console.log('[QRScanner] Found cameras:', devices.length);

      // Step 4: Determine camera configuration
      // On mobile, prefer facingMode over device ID for better compatibility
      let cameraConfig: string | { facingMode: string | { ideal: string } };
      
      if (devices.length > 0) {
        // Check for back camera
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          // Use facingMode for better mobile compatibility
          cameraConfig = { facingMode: { ideal: 'environment' } };
        } else {
          // Use first available camera
          cameraConfig = devices[0].id;
        }
      } else {
        // No devices enumerated - use facingMode as fallback
        cameraConfig = { facingMode: 'environment' };
      }

      console.log('[QRScanner] Using camera config:', cameraConfig);

      // Step 5: Start scanner with mobile-optimized settings
      await scanner.start(
        cameraConfig,
        {
          fps: 10, // Lower FPS for better mobile battery and performance
          qrbox: { width: 250, height: 250 }, // Slightly smaller for easier framing
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          // Prevent duplicate scans
          if (isProcessingRef.current) return;
          if (lastScannedRef.current === decodedText) return;
          
          isProcessingRef.current = true;
          lastScannedRef.current = decodedText;
          
          // Immediate visual feedback
          setScanStatus('scanning');
          setStatusMessage('Validating ticket...');
          
          try {
            await onScan(decodedText);
            setScanStatus('success');
            setStatusMessage('Check-in successful!');
          } catch (err: any) {
            setScanStatus('error');
            setStatusMessage(err.message || 'Check-in failed');
          }
          
          // Reset after delay for next scan
          scanCooldownRef.current = setTimeout(() => {
            setScanStatus('idle');
            setStatusMessage('');
            isProcessingRef.current = false;
            // Allow same QR after 5 seconds (in case of retry)
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 5000);
          }, 2000);
        },
        () => {
          // Error callback - ignore scan errors (normal when no QR visible)
        }
      );

      // After scanner starts, try to enable continuous autofocus via video track constraints
      try {
        const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const videoStream = videoElement.srcObject as MediaStream;
          const track = videoStream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { focusMode?: string[] };
            if (capabilities?.focusMode?.includes('continuous')) {
              await track.applyConstraints({
                // @ts-ignore - focusMode is a valid constraint but not in all TypeScript definitions
                focusMode: 'continuous'
              });
              console.log('[QRScanner] Continuous autofocus enabled');
            } else if (capabilities?.focusMode?.includes('auto')) {
              // Fallback to auto focus mode if continuous not available
              await track.applyConstraints({
                // @ts-ignore
                focusMode: 'auto'
              });
              console.log('[QRScanner] Auto focus mode enabled');
            } else {
              console.log('[QRScanner] No focus mode available, using device default');
            }
          }
        }
      } catch (focusErr) {
        // Autofocus enhancement failed - scanner will still work with default focus
        console.log('[QRScanner] Could not set focus mode:', focusErr);
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message || 'Failed to access camera';
      
      if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('No camera')) {
        errorMessage = 'No camera found on this device.';
      } else if (errorMessage.includes('in use') || errorMessage.includes('busy')) {
        errorMessage = 'Camera is being used by another app. Please close other camera apps and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [onScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Stop scanner when eventId changes
  useEffect(() => {
    stopScanner();
  }, [eventId, stopScanner]);

  // Auto-start removed - require user gesture for camera access
  // Many browsers (especially mobile) require explicit user interaction
  // before allowing camera access to prevent abuse

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden"
        style={{ minHeight: isScanning ? '340px' : '200px' }}
      >
        <div id="qr-reader" className="w-full" />
        
        {/* Scan guide overlay when scanning */}
        {isScanning && scanStatus === 'idle' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[280px] h-[280px]">
              {/* Corner guides */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              
              {/* Scanning animation line */}
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
            </div>
          </div>
        )}
        
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted/50">
            {error ? (
              <>
                <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={startScanner}
                  disabled={isStarting}
                >
                  Try Again
                </Button>
              </>
            ) : isStarting ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Initializing camera...</p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tap to start camera and scan QR codes
                </p>
              </>
            )}
          </div>
        )}

        {/* Status overlay */}
        {isScanning && scanStatus !== 'idle' && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            scanStatus === 'success' ? 'bg-green-600/95' : 
            scanStatus === 'error' ? 'bg-destructive/95' : 
            'bg-background/95'
          }`}>
            {scanStatus === 'scanning' && (
              <Loader2 className="w-16 h-16 animate-spin mb-3 text-primary" />
            )}
            {scanStatus === 'success' && (
              <CheckCircle className="w-20 h-20 mb-3 text-white animate-bounce" />
            )}
            {scanStatus === 'error' && (
              <XCircle className="w-20 h-20 mb-3 text-white" />
            )}
            <p className={`text-xl font-bold ${scanStatus !== 'scanning' ? 'text-white' : ''}`}>
              {statusMessage}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isScanning ? (
          <Button 
            onClick={startScanner}
            disabled={isStarting}
            size="lg"
            className="gap-2 rounded-full px-8"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                Start Scanning
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={stopScanner}
            size="lg"
            className="gap-2 rounded-full px-8"
          >
            <CameraOff className="w-5 h-5" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Instructions */}
      {isScanning && scanStatus === 'idle' && (
        <div className="text-center text-xs text-muted-foreground space-y-1 animate-pulse">
          <p className="font-medium">Point camera at QR code</p>
          <p>Detection is automatic • No need to tap</p>
        </div>
      )}
    </div>
  );
}
