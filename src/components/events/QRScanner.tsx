import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    setIsStarting(true);
    setError(null);
    
    try {
      // Create scanner instance
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Prefer back camera on mobile
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera?.id || devices[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // QR code detected
          setScanStatus('scanning');
          setStatusMessage('Validating ticket...');
          
          try {
            await onScan(decodedText);
            setScanStatus('success');
            setStatusMessage('Check-in successful!');
            
            // Reset after 2 seconds
            setTimeout(() => {
              setScanStatus('idle');
              setStatusMessage('');
            }, 2000);
          } catch (err: any) {
            setScanStatus('error');
            setStatusMessage(err.message || 'Check-in failed');
            
            // Reset after 3 seconds
            setTimeout(() => {
              setScanStatus('idle');
              setStatusMessage('');
            }, 3000);
          }
        },
        () => {
          // Error callback - ignore scan errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopScanner = async () => {
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
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Stop scanner when eventId changes
  useEffect(() => {
    stopScanner();
  }, [eventId]);

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div 
        ref={containerRef}
        className="relative bg-black/5 rounded-lg overflow-hidden"
        style={{ minHeight: isScanning ? '300px' : '200px' }}
      >
        <div id="qr-reader" className="w-full" />
        
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
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
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-background/90 ${
            scanStatus === 'success' ? 'text-green-600' : 
            scanStatus === 'error' ? 'text-destructive' : 
            'text-primary'
          }`}>
            {scanStatus === 'scanning' && (
              <Loader2 className="w-12 h-12 animate-spin mb-3" />
            )}
            {scanStatus === 'success' && (
              <CheckCircle className="w-16 h-16 mb-3 animate-pulse" />
            )}
            {scanStatus === 'error' && (
              <XCircle className="w-16 h-16 mb-3" />
            )}
            <p className="text-lg font-semibold">{statusMessage}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isScanning ? (
          <Button 
            onClick={startScanner}
            disabled={isStarting}
            className="gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting Camera...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Start Scanning
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={stopScanner}
            className="gap-2"
          >
            <CameraOff className="w-4 h-4" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Point the camera at the attendee's QR code ticket</p>
        <p>Make sure the QR code is clearly visible and well-lit</p>
      </div>
    </div>
  );
}
