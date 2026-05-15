import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { API_BASE_URL, getApiHeaders } from "@/lib/api-config";
import { displayRegistranteNombre } from "@/hooks/use-bienes";

/**
 * ============================================
 * PÁGINA DE DETALLE DE BIEN/ARTÍCULO
 * ============================================
 * 
 * Esta página muestra la información detallada de un
 * bien específico del inventario, incluyendo su código QR
 * generado dinámicamente. Se accede mediante la ruta /item/:id
 */

/**
 * Interfaz que define la estructura de datos de un bien/artículo.
 * Incluye campos en español y compatibilidad con nombres antiguos en inglés.
 */
interface ItemData {
  id: string;                    // Identificador único del bien
  nombre?: string;               // Nombre del bien (en español)
  sku?: string;                  // Código único de inventario
  cantidad?: number;             // Cantidad disponible
  ubicacion?: string;            // Ubicación física
  foto?: string;                 // URL de la imagen (en español)
  qr_code?: string;              // Código QR asociado
  registrado_por?: string | number; // Id o usuario del registrador
  registrado_nombre?: string;    // Nombre del registrador
  registrado_unidad?: string;    // Unidad orgánica del registrador
  registrado_cargo?: string;     // Cargo del registrador
  fecha_registro?: string;       // Fecha de creación
  fecha_actualizacion?: string;  // Fecha de última modificación
  // Campos en inglés para compatibilidad con versiones antiguas
  name?: string;
  quantity?: number;
  location?: string;
  photo?: string;
}

/**
 * Componente principal que muestra el detalle de un bien.
 * Obtiene el ID desde los parámetros de la URL y carga
 * los datos desde la API.
 */
export default function Item() {
  // Extraer el ID del bien desde los parámetros de la URL
  const { id } = useParams<{ id: string }>();
  // Estado para almacenar los datos del bien cargado
  const [item, setItem] = useState<ItemData | null>(null);
  // Estado de carga mientras se obtienen los datos
  const [loading, setLoading] = useState(true);
  // Estado para almacenar mensajes de error
  const [error, setError] = useState<string | null>(null);

  /**
   * Efecto para cargar los datos del bien cuando cambia el ID.
   * Realiza una llamada GET a la API de bienes.
   */
  useEffect(() => {
    // Validar que se proporcionó un ID
    if (!id) {
      setError("ID de artículo no proporcionado");
      setLoading(false);
      return;
    }

    // Función asíncrona para obtener el bien desde el servidor
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/bienes/${id}`, {
          headers: getApiHeaders()
        });
        if (!response.ok) {
          // Manejar errores específicos según el código de estado
          if (response.status === 404) {
            setError("Artículo no encontrado");
          } else {
            setError("Error al cargar el artículo");
          }
          return;
        }
        const data = await response.json();
        setItem(data);
      } catch (err) {
        console.error("Error fetching item:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Mostrar pantalla de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Cargando artículo...</h2>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de error si no se pudo cargar el bien
  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold">Artículo no encontrado</h2>
        <p className="text-muted-foreground mt-2">
          {error || "El artículo solicitado no existe o ha sido eliminado."}
        </p>
        <div className="mt-4">
          <Link to="/">
            <Button>Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Generar la URL completa para el código QR
  const qrText = `${window.location.origin}/item/${item.id}`;

  return (
    // Layout principal en dos columnas: info del bien y código QR
    <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
      {/* Panel izquierdo: Información detallada del bien */}
      <div className="rounded-lg border bg-card p-4">
        {/* Nombre y SKU del artículo - soporta tanto 'nombre' como 'name' */}
        <h3 className="text-lg font-semibold">{item.nombre || item.name || "Sin nombre"}</h3>
        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
        
        {/* Cantidad disponible - soporta tanto 'cantidad' como 'quantity' */}
        <p className="text-sm text-muted-foreground">
          Cantidad: {item.cantidad ?? item.quantity ?? 0}
        </p>
        
        {/* Ubicación física - soporta tanto 'ubicacion' como 'location' */}
        {(item.ubicacion || item.location) && (
          <p className="text-sm text-muted-foreground">
            Ubicación: {item.ubicacion || item.location}
          </p>
        )}
        
        {/* Unidad orgánica del registrador (condicional) */}
        {item.registrado_unidad && (
          <p className="text-sm text-muted-foreground font-semibold">
            Unidad orgánica: {item.registrado_unidad}
          </p>
        )}
        
        {/* Cargo del registrador (condicional) */}
        {item.registrado_cargo && (
          <p className="text-sm text-muted-foreground">
            Cargo: {item.registrado_cargo}
          </p>
        )}
        
        {/* Información del registrador */}
        <p className="text-sm text-muted-foreground">
          Registrado por: {displayRegistranteNombre(item)}
        </p>
        
        {/* Sección de foto del artículo */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Foto</h4>
          {item.foto || item.photo ? (
            <img
              src={item.foto || item.photo}
              alt={item.nombre || item.name}
              className="w-full rounded-md object-cover"
            />
          ) : (
            <div className="h-48 w-full grid place-items-center rounded-md bg-muted text-muted-foreground">
              Sin foto
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho: Visualización del código QR */}
      <div className="rounded-lg border bg-card p-4 flex flex-col items-center gap-4">
        <h4 className="text-sm font-medium">Código QR</h4>
        {/* Generador del código QR con la URL del artículo */}
        <QRCodeGenerator value={qrText} size="lg" />
        <div className="mt-4 text-xs text-muted-foreground text-center">
          {/* Mostrar la URL completa debajo del QR */}
          <p className="font-mono break-all">{qrText}</p>
        </div>
      </div>
    </div>
  );
}
