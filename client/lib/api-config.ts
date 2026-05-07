/**
 * CONFIGURACIÓN DE LA API
 * -----------------------
 * Este archivo centraliza la URL base de la API para que la aplicación
 * funcione tanto en la web (rutas relativas) como en el APK (IP del servidor).
 */

// Servidor local (celular en la MISMA RED)
// Puedes cambiarlo SIN recompilar el APK desde la pantalla "Configurar Servidor"
// (se guarda en localStorage como "custom_api_url").
const DEFAULT_LOCAL_API_URL = "http://10.10.10.13:3000";

// Detectar si estamos en un entorno móvil (Capacitor)
const origin = window.origin || "";
const userAgent = navigator.userAgent || "";
const hasCapacitorObject = typeof (window as any).Capacitor !== "undefined";
const isCapacitorOrigin = origin.startsWith('capacitor://') || origin.startsWith('ionic://');
const isLocalhostOrigin = origin.startsWith('http://localhost') || origin.startsWith('https://localhost');
const hasCapacitorUserAgent = /Capacitor|cordova|ionic/i.test(userAgent);
const isCapacitor = hasCapacitorObject || isCapacitorOrigin || (isLocalhostOrigin && hasCapacitorUserAgent) || window.location.protocol === 'capacitor:' || (window.location.protocol === 'file:' && hasCapacitorUserAgent);

// Lógica de URL Base
// 1. Prioridad: URL guardada manualmente por el usuario en el app (para no re-generar APK)
// 2. Default: servidor público
const CUSTOM_URL = localStorage.getItem("custom_api_url");

export const API_BASE_URL = isCapacitor
  ? (CUSTOM_URL || DEFAULT_LOCAL_API_URL)
  : "";

/**
 * Encabezados comunes para todas las peticiones API.
 * Incluye el skip-browser-warning para ngrok.
 */
export const getApiHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    ...extraHeaders
  };

  // Si estamos usando una URL de ngrok (túnel), añadimos el header para saltar la advertencia
  const currentUrl = API_BASE_URL || window.location.origin;
  if (currentUrl.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
};

console.log(`[API Config] Modo: ${isCapacitor ? 'Móvil (Capacitor)' : 'Web'}`);
console.log(`[API Config] Base URL: ${API_BASE_URL || "(relativa)"}`);
