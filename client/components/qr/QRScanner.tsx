import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { isCapacitorNative, scanBarcodeNative } from "@/lib/native";

export interface QRScannerProps {
  onResult: (text: string) => void;
  onError?: (err: Error) => void;
  autoStart?: boolean;
}

export default function QRScanner({ onResult, onError, autoStart }: QRScannerProps) {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    isCapacitorNative().then(setIsNative).catch(() => setIsNative(false));
  }, []);

  const stop = useCallback(() => {
    if (readerRef.current) {
      readerRef.current
        .stop()
        .then(() => {
          setActive(false);
        })
        .catch(() => {
          setActive(false);
        });
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isNative) {
        const value = await scanBarcodeNative();
        if (value) {
          onResult(value);
        } else {
          const errorMsg = "No se detectó ningún código QR";
          setError(errorMsg);
          onError?.(new Error(errorMsg));
        }
        return;
      }

      if (!readerRef.current) {
        readerRef.current = new Html5Qrcode("qr-reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 150, height: 150 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [],
      };

      await readerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          onResult(decodedText);
          stop();
        },
        () => {
          // ignoring errors on frames
        }
      );
      
      setActive(true);
    } catch (err: any) {
      const errorMsg = err?.message || "No se pudo iniciar el escaneo de QR";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  }, [isNative, onResult, onError, stop]);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (readerRef.current?.isScanning) {
        stop();
      }
    };
  }, [autoStart, start, stop]);

  const onPickImage = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = ev.target.files?.[0];
      if (!file) return;

      if (!readerRef.current) {
        readerRef.current = new Html5Qrcode("qr-reader");
      }

      const result = await readerRef.current.scanFile(file, true);
      onResult(result);
    } catch (err: any) {
      const errorMsg = err?.message || "No se pudo escanear la imagen";
      onError?.(new Error(errorMsg));
      setError(errorMsg);
    } finally {
      ev.target.value = "";
    }
  };

  return (
    <div className="w-full">
      {!active || isNative ? (
        <Button 
          onClick={start} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Iniciando..." : "Escanear QR"}
        </Button>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden max-w-xs mx-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b gap-2">
            <p className="text-xs font-medium truncate">QR</p>
            <Button size="sm" variant="secondary" onClick={stop} className="text-xs h-7">Detener</Button>
          </div>
          <div className="relative aspect-square bg-black">
            {error && (
              <div className="absolute inset-0 grid place-items-center text-center p-3 bg-black/80">
                <div>
                  <p className="text-xs text-destructive font-medium mb-1">Error</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}
            <div id="qr-reader" style={{ width: "100%" }} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-28 w-28 rounded-lg border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
