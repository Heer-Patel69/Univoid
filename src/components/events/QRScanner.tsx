import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, AlertTriangle, Scan, Keyboard, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRScannerProps {
  onScan: (qrCode: string) => Promise<void>;
  eventId: string;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';
type CameraError = 'permission_denied' | 'not_found' | 'busy' | 'not_supported' | 'unknown' | null;

export default function QRScanner({ onScan, eventId }: QRScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports camera
  const isCameraSupported = typeof navigator !== 'undefined' && 
    typeof navigator.mediaDevices !== 'undefined' && 
    typeof navigator.mediaDevices.getUserMedia === 'function';

  // Check if page is served over HTTPS (required for camera on mobile)
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');

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
        console.error('[QRScanner] Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanStatus('idle');
    setStatusMessage('');
    isProcessingRef.current = false;
    lastScannedRef.current = null;
  }, []);

  const getCameraErrorInfo = (error: any): { type: CameraError; message: string } => {
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorMessage.includes('denied')) {
      return {
        type: 'permission_denied',
        message: 'Camera permission denied. Please allow camera access in your browser settings and reload the page.'
      };
    }
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorMessage.includes('not found')) {
      return {
        type: 'not_found',
        message: 'No camera found on this device. Please use manual ticket entry instead.'
      };
    }
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorMessage.includes('busy') || errorMessage.includes('in use')) {
      return {
        type: 'busy',
        message: 'Camera is busy or in use by another app. Please close other camera apps and try again.'
      };
    }
    if (errorName === 'NotSupportedError' || errorName === 'TypeError') {
      return {
        type: 'not_supported',
        message: 'Camera is not supported in this browser. Please use manual ticket entry.'
      };
    }
    return {
      type: 'unknown',
      message: errorMessage || 'Failed to access camera. Please try manual ticket entry.'
    };
  };

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    
    // Pre-flight checks
    if (!isSecureContext) {
      setCameraError('not_supported');
      setErrorDetails('Camera requires a secure connection (HTTPS). Please use manual entry.');
      return;
    }

    if (!isCameraSupported) {
      setCameraError('not_supported');
      setErrorDetails('Camera is not supported in this browser. Please use Chrome, Safari, or Firefox.');
      return;
    }
    
    setIsStarting(true);
    setCameraError(null);
    setErrorDetails('');
    isProcessingRef.current = false;
    lastScannedRef.current = null;
    
    try {
      // Step 1: Request camera permission with minimal constraints
      console.log('[QRScanner] Requesting camera access...');
      let stream: MediaStream;
      
      try {
        // Try with environment camera first (back camera on mobile)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
      } catch (envErr) {
        console.log('[QRScanner] Environment camera failed, trying any camera...');
        // Fallback to any camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      console.log('[QRScanner] Camera access granted');
      // Release the test stream
      stream.getTracks().forEach(track => track.stop());

      // Step 2: Create scanner instance
      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
        formatsToSupport: [0], // QR_CODE only
      });
      scannerRef.current = scanner;

      // Step 3: Get available cameras
      let devices: { id: string; label: string }[] = [];
      try {
        devices = await Html5Qrcode.getCameras();
        console.log('[QRScanner] Found cameras:', devices.length);
      } catch (cameraListErr) {
        console.log('[QRScanner] Could not enumerate cameras');
      }

      // Step 4: Determine camera configuration
      let cameraConfig: string | { facingMode: string | { ideal: string } };
      
      if (devices.length > 0) {
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        cameraConfig = backCamera ? { facingMode: { ideal: 'environment' } } : devices[0].id;
      } else {
        cameraConfig = { facingMode: 'environment' };
      }

      console.log('[QRScanner] Starting with config:', cameraConfig);

      // Step 5: Start scanner
      await scanner.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          if (lastScannedRef.current === decodedText) return;
          
          isProcessingRef.current = true;
          lastScannedRef.current = decodedText;
          
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
          
          scanCooldownRef.current = setTimeout(() => {
            setScanStatus('idle');
            setStatusMessage('');
            isProcessingRef.current = false;
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 5000);
          }, 2000);
        },
        () => {} // Ignore scan errors
      );

      // Step 6: Try to enable continuous autofocus
      try {
        const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
        if (videoElement?.srcObject) {
          const videoStream = videoElement.srcObject as MediaStream;
          const track = videoStream.getVideoTracks()[0];
          const capabilities = track?.getCapabilities?.() as any;
          
          if (capabilities?.focusMode?.includes('continuous')) {
            await track.applyConstraints({ focusMode: 'continuous' } as any);
            console.log('[QRScanner] Continuous autofocus enabled');
          }
        }
      } catch (focusErr) {
        console.log('[QRScanner] Could not set focus mode');
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error('[QRScanner] Failed to start:', err);
      const errorInfo = getCameraErrorInfo(err);
      setCameraError(errorInfo.type);
      setErrorDetails(errorInfo.message);
    } finally {
      setIsStarting(false);
    }
  }, [onScan, isCameraSupported, isSecureContext]);

  // Handle manual ticket verification
  const handleManualSubmit = async () => {
    if (!manualTicketId.trim()) return;
    
    setIsManualSubmitting(true);
    try {
      await onScan(manualTicketId.trim());
      setScanStatus('success');
      setStatusMessage('Check-in successful!');
      setManualTicketId('');
      
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 2000);
    } catch (err: any) {
      setScanStatus('error');
      setStatusMessage(err.message || 'Check-in failed');
      
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 3000);
    } finally {
      setIsManualSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Browser compatibility warning */}
      {!isSecureContext && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Camera requires HTTPS. Please use manual ticket entry below.
          </AlertDescription>
        </Alert>
      )}

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
            <div className="relative w-[260px] h-[260px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
            </div>
          </div>
        )}
        
        {/* Non-scanning state */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted/50">
            {cameraError ? (
              <>
                <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
                <p className="text-sm text-destructive font-medium mb-1">Camera Error</p>
                <p className="text-xs text-muted-foreground mb-3 max-w-xs">{errorDetails}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCameraError(null);
                      setErrorDetails('');
                      startScanner();
                    }}
                    disabled={isStarting}
                    className="gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowManualInput(true)}
                    className="gap-1"
                  >
                    <Keyboard className="w-4 h-4" />
                    Manual Entry
                  </Button>
                </div>
              </>
            ) : isStarting ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Initializing camera...</p>
                <p className="text-xs text-muted-foreground mt-1">Please allow camera access if prompted</p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Tap to start camera
                </p>
                <p className="text-xs text-muted-foreground">
                  Point at QR code to scan
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
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {!isScanning ? (
          <>
            <Button 
              onClick={startScanner}
              disabled={isStarting || !isCameraSupported}
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
                  Start Camera
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              size="lg"
              className="gap-2 rounded-full px-6"
            >
              <Keyboard className="w-5 h-5" />
              Manual Entry
            </Button>
          </>
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

      {/* Manual ticket entry */}
      {showManualInput && (
        <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
          <Label htmlFor="manual-ticket" className="text-sm font-medium">
            Enter Ticket ID Manually
          </Label>
          <div className="flex gap-2">
            <Input
              id="manual-ticket"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Ticket ID or QR code content"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button
              onClick={handleManualSubmit}
              disabled={isManualSubmitting || !manualTicketId.trim()}
            >
              {isManualSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask attendee for their ticket ID if QR scanning isn't working
          </p>
        </div>
      )}

      {/* Instructions */}
      {isScanning && scanStatus === 'idle' && (
        <div className="text-center text-xs text-muted-foreground space-y-1 animate-pulse">
          <p className="font-medium">Point camera at QR code</p>
          <p>Detection is automatic</p>
        </div>
      )}
    </div>
  );
}