import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";

interface QRCodeGeneratorProps {
  value: string;
  size?: "sm" | "md" | "lg";
  withGradient?: boolean;
  withLogo?: string;
}

export function QRCodeGenerator({
  value,
  size = "md",
  withGradient = false,
  withLogo,
}: QRCodeGeneratorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);

  const sizeMap = {
    sm: 200,
    md: 300,
    lg: 400,
  };

  const actualSize = sizeMap[size];

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: actualSize,
      height: actualSize,
      type: "canvas",
      data: value,
      image: withLogo,
      dotsOptions: {
        color: "#1f2937",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersDotOptions: {
        type: "square",
        color: "#1f2937",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#1f2937",
      },
    });

    setQrCode(qr);

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      qr.append(containerRef.current);
    }
  }, [value, actualSize, withLogo]);

  const handleDownload = async () => {
    if (!qrCode) return;
    try {
      qrCode.download({
        name: "qr-code",
        extension: "png",
      });
    } catch (error) {
      try {
        const rawData = await qrCode.getRawData("png");
        if (!rawData) {
          throw new Error("No se pudo generar la imagen");
        }
        let blob: Blob;
        if (rawData instanceof Blob) {
          blob = rawData;
        } else if (rawData instanceof ArrayBuffer) {
          blob = new Blob([rawData], { type: "image/png" });
        } else if (ArrayBuffer.isView(rawData)) {
          const bytes = new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength);
          const safeArrayBuffer = Uint8Array.from(bytes).buffer;
          blob = new Blob([safeArrayBuffer], { type: "image/png" });
        } else {
          blob = new Blob([new Uint8Array(rawData as any)], { type: "image/png" });
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "qr-code.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch {
        alert("No se pudo guardar la imagen en este dispositivo.");
      }
    }
  };

  const handleCopy = async () => {
    if (qrCode && containerRef.current?.querySelector("canvas")) {
      const canvas = containerRef.current.querySelector("canvas") as HTMLCanvasElement;
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) {
            throw new Error("No se pudo crear la imagen");
          }
          if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
            throw new Error("Portapapeles no compatible");
          }
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          alert("Código QR copiado al portapapeles");
        } catch {
          alert("No se pudo copiar la imagen en este dispositivo.");
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="flex items-center justify-center p-6 bg-white rounded-lg border border-gray-200"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          Copiar
        </Button>
      </div>
    </div>
  );
}
