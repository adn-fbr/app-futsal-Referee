import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScan, onError, onClose, className }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const containerId = "qr-scanner-container";

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Extract verification code from URL if needed
          let code = decodedText;
          if (decodedText.includes("/verify/")) {
            code = decodedText.split("/verify/").pop() || decodedText;
          }
          onScan(code);
          stopScanner();
        },
        () => {
          // Ignore scan errors (no QR found)
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setHasPermission(false);
      onError?.(err.message || "Gagal mengakses kamera");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Scanner Container */}
      <div className="relative bg-black rounded-xl overflow-hidden">
        <div
          id={containerId}
          className="w-full aspect-square"
          style={{ minHeight: 280 }}
        />

        {/* Overlay when not scanning */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
            {hasPermission === false ? (
              <>
                <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center px-4 mb-4">
                  Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.
                </p>
                <Button onClick={startScanner} variant="outline">
                  Coba Lagi
                </Button>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center px-4 mb-4">
                  Scan QR Code pada ID Card wasit
                </p>
                <Button onClick={startScanner}>
                  <Camera className="h-4 w-4 mr-2" />
                  Mulai Scan
                </Button>
              </>
            )}
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => {
              stopScanner();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Scanning indicator */}
        {isScanning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Scanning...
            </div>
          </div>
        )}
      </div>

      {/* Stop button */}
      {isScanning && (
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={stopScanner}
        >
          <CameraOff className="h-4 w-4 mr-2" />
          Stop Scan
        </Button>
      )}
    </div>
  );
}
