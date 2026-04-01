import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";

const STORAGE_KEY = "qr-inventory.items.v1";

export default function Item() {
  const { id } = useParams();
  const [item, setItem] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const items = JSON.parse(raw) as any[];
      setItem(items.find((it) => it.id === id) || null);
    } catch (e) {
      setItem(null);
    }
  }, [id]);

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold">Artículo no encontrado</h2>
        <p className="text-muted-foreground mt-2">
          Revisa que el código sea correcto.
        </p>
        <div className="mt-4">
          <Link to="/">
            <Button>Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  const qrText = `${window.location.origin}/item/${item.id}`;

  return (
    <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
        <p className="text-sm text-muted-foreground">
          Cantidad: {item.quantity}
        </p>
        {item.location && (
          <p className="text-sm text-muted-foreground">
            Ubicación: {item.location}
          </p>
        )}
        {item.registeredUnidad && (
          <p className="text-sm text-muted-foreground font-semibold">
            Unidad orgánica: {item.registeredUnidad}
          </p>
        )}
        {item.registeredCargo && (
          <p className="text-sm text-muted-foreground">
            Cargo: {item.registeredCargo}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Registrado por: {item.registeredName || item.registeredBy || "-"}
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Foto</h4>
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              className="w-full rounded-md object-cover"
            />
          ) : (
            <div className="h-48 w-full grid place-items-center rounded-md bg-muted text-muted-foreground">
              Sin foto
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 flex flex-col items-center gap-4">
        <h4 className="text-sm font-medium">Código QR</h4>
        <QRCodeGenerator value={qrText} size="lg" />
        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p className="font-mono break-all">{qrText}</p>
        </div>
      </div>
    </div>
  );
}
