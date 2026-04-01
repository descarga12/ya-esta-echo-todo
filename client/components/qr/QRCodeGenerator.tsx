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

  const handleDownload = () => {
    if (qrCode) {
      qrCode.download({
        name: "qr-code",
        extension: "png",
      });
    }
  };

  const handleCopy = () => {
    if (qrCode && containerRef.current?.querySelector("canvas")) {
      const canvas = containerRef.current.querySelector("canvas") as HTMLCanvasElement;
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          alert("Código QR copiado al portapapeles");
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
