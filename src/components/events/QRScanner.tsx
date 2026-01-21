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
      // Create scanner instance with optimized settings
      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
        formatsToSupport: [0], // QR_CODE only for faster detection
      });
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Prefer back camera on mobile for better scanning
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera?.id || devices[0].id;

      // Use facingMode constraint for better camera selection and autofocus
      // This provides better autofocus support on mobile devices
      const cameraConfig = backCamera 
        ? { facingMode: { ideal: 'environment' } }
        : cameraId;

      // Start with optimized settings for better autofocus and scan reliability
      await scanner.start(
        cameraConfig,
        {
          fps: 10, // Lower FPS = more processing time per frame = better detection
          qrbox: { width: 280, height: 280 }, // Slightly larger scan area
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
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { focusMode?: string[] };
            if (capabilities?.focusMode?.includes('continuous')) {
              await track.applyConstraints({
                // @ts-ignore - focusMode is a valid constraint but not in all TypeScript definitions
                focusMode: 'continuous'
              });
              console.log('[QRScanner] Continuous autofocus enabled');
            } else {
              console.log('[QRScanner] Continuous autofocus not supported, using default');
            }
          }
        }
      } catch (focusErr) {
        // Autofocus enhancement failed - scanner will still work with default focus
        console.log('[QRScanner] Could not set autofocus mode:', focusErr);
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to access camera. Please ensure camera permissions are granted.');
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

  // Auto-start scanner on mount for faster UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isScanning && !isStarting) {
        startScanner();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
