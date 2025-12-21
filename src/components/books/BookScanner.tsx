import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, X, ScanBarcode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

interface BookScannerProps {
  onBookScanned: (bookInfo: { title: string; author?: string }) => void;
}

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
}

const BookScanner = ({ onBookScanned }: BookScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "book-scanner-container";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log("Scanner already stopped");
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const fetchBookByISBN = async (isbn: string): Promise<{ title: string; author?: string } | null> => {
    try {
      // Use Open Library API (free, no API key required)
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await response.json();
      
      const bookKey = `ISBN:${isbn}`;
      if (data[bookKey]) {
        const book: OpenLibraryBook = data[bookKey];
        return {
          title: book.title || isbn,
          author: book.authors?.[0]?.name,
        };
      }
      
      // Fallback: Try with Google Books API (also free)
      const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const googleData = await googleResponse.json();
      
      if (googleData.items && googleData.items.length > 0) {
        const volumeInfo = googleData.items[0].volumeInfo;
        return {
          title: volumeInfo.title,
          author: volumeInfo.authors?.[0],
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching book info:", error);
      return null;
    }
  };

  const handleBarcodeDetected = async (decodedText: string) => {
    // Stop scanning immediately
    await stopScanner();
    
    // Check if it looks like an ISBN (10 or 13 digits)
    const cleanedCode = decodedText.replace(/[^0-9X]/gi, "");
    const isISBN = cleanedCode.length === 10 || cleanedCode.length === 13;
    
    if (!isISBN) {
      toast.error("Please scan an ISBN barcode (on book back cover)");
      setIsOpen(false);
      return;
    }

    setIsFetching(true);
    toast.info("Fetching book details...");

    const bookInfo = await fetchBookByISBN(cleanedCode);
    setIsFetching(false);
    setIsOpen(false);

    if (bookInfo) {
      onBookScanned(bookInfo);
      toast.success(`Found: ${bookInfo.title}`);
    } else {
      // Still provide the ISBN for manual lookup
      onBookScanned({ title: `ISBN: ${cleanedCode}` });
      toast.info("Book not found in database. ISBN captured for manual entry.");
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    
    try {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        throw new Error("Scanner container not found");
      }

      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        handleBarcodeDetected,
        () => {} // Ignore scan errors (no barcode found yet)
      );
    } catch (error: any) {
      console.error("Scanner error:", error);
      setIsScanning(false);
      
      if (error.message?.includes("NotAllowedError") || error.name === "NotAllowedError") {
        toast.error("Camera permission denied. Please allow camera access.");
      } else if (error.message?.includes("NotFoundError") || error.name === "NotFoundError") {
        toast.error("No camera found on this device.");
      } else {
        toast.error("Failed to start scanner. Try again.");
      }
    }
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      await stopScanner();
    }
    setIsOpen(open);
  };

  useEffect(() => {
    if (isOpen && !isScanning && !isFetching) {
      startScanner();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <ScanBarcode className="w-4 h-4" />
        Scan ISBN
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Book Barcode
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Fetching book details...</p>
              </div>
            ) : (
              <>
                <div 
                  id={scannerContainerId} 
                  className="w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden"
                />
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Point camera at the <strong>ISBN barcode</strong> on the book's back cover
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The barcode usually starts with 978 or 979
                  </p>
                </div>

                {!isScanning && (
                  <Button onClick={startScanner} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookScanner;
