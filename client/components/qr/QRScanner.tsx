import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { isCapacitorNative, scanBarcodeNative } from "@/lib/native";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QRScannerProps {
  onResult: (text: string) => void;
  onError?: (err: Error) => void;
  autoStart?: boolean;
  /** Clases extra para el botón principal (altura, colores, etc.) */
  buttonClassName?: string;
}

export default function QRScanner({ onResult, onError, autoStart, buttonClassName }: QRScannerProps) {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    isCapacitorNative().then(setIsNative).catch(() => setIsNative(false));
  }, []);

  const stopScanner = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.stop();
      } catch {
        /* ignore */
      }
      readerRef.current = null;
    }
    setActive(false);
  }, []);

  const startWebScanner = useCallback(async () => {
    const mount = document.getElementById("qr-reader");
    if (!mount) {
      throw new Error("El visor de cámara no está listo. Intenta de nuevo.");
    }

    if (readerRef.current) {
      try {
        await readerRef.current.stop();
      } catch {
        /* ignore */
      }
      readerRef.current = null;
    }

    readerRef.current = new Html5Qrcode("qr-reader");

    const config = {
      fps: 10,
      qrbox: { width: 150, height: 150 },
      rememberLastUsedCamera: true,
    };
    const onDecode = (decodedText: string) => {
      onResult(decodedText);
      void stopScanner();
    };
    const onFrameError = () => {
      // Ignore frame-level decode noise while camera is active.
    };

    try {
      await readerRef.current.start(
        { facingMode: "environment" },
        config,
        onDecode,
        onFrameError
      );
    } catch {
      const devices = await Html5Qrcode.getCameras();
      if (!devices.length) {
        throw new Error("No se encontró una cámara disponible en el dispositivo.");
      }
      await readerRef.current.start(devices[0].id, config, onDecode, onFrameError);
    }
  }, [onResult, stopScanner]);

  const start = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Html5Qrcode necesita que exista el div #qr-reader en el DOM antes de .start().
      flushSync(() => {
        setActive(true);
      });

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      try {
        await startWebScanner();
      } catch (webErr: any) {
        await stopScanner();
        if (isNative) {
          const value = await scanBarcodeNative();
          if (value) {
            onResult(value);
            return;
          }
        }
        throw webErr;
      }
    } catch (err: any) {
      const errorMsg = err?.message || "No se pudo iniciar el escaneo de QR";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      await stopScanner();
    } finally {
      setLoading(false);
    }
  }, [isNative, onResult, onError, startWebScanner, stopScanner]);

  useEffect(() => {
    if (autoStart) void start();
    return () => {
      void stopScanner();
    };
  }, [autoStart, start, stopScanner]);

  return (
    <div className="w-full space-y-2">
      {!active ? (
        <>
          <Button 
            type="button"
            onClick={() => void start()} 
            disabled={loading}
            className={cn(
              "w-full min-h-[3.5rem] gap-2 rounded-2xl font-bold uppercase tracking-wider text-xs",
              "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
              buttonClassName
            )}
          >
            <ScanLine className="h-5 w-5 shrink-0" aria-hidden />
            {loading ? "Abriendo cámara..." : "Escanear QR"}
          </Button>
          {error && (
            <p className="text-xs text-red-400 text-center px-1">{error}</p>
          )}
        </>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden max-w-xs mx-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b gap-2">
            <p className="text-xs font-medium truncate">QR</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                void stopScanner();
                setError(null);
              }}
              className="text-xs h-7"
            >
              Detener
            </Button>
          </div>
          <div className="relative aspect-square bg-black">
            {error && (
              <div className="absolute inset-0 z-10 grid place-items-center text-center p-3 bg-black/80">
                <div>
                  <p className="text-xs text-destructive font-medium mb-1">Error</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}
            <div id="qr-reader" style={{ width: "100%", minHeight: "100%" }} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-28 w-28 rounded-lg border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
