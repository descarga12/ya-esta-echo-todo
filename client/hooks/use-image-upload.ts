import { useState } from "react";
import { API_BASE_URL } from "../lib/api-config";

export interface UploadResponse {
  success: boolean;
  filename: string;
  url: string;
  originalName: string;
  size: number;
}

export function useImageUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<UploadResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al subir imagen");
      }

      const data: UploadResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadImage, isLoading, error };
}
