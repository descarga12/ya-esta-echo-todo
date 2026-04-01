export async function isCapacitorNative() {
  try {
    // @ts-ignore
    return typeof window !== "undefined" && !!(window.Capacitor && (window.Capacitor as any).isNative);
  } catch {
    return false;
  }
}

export async function takePhotoNative(): Promise<string | null> {
  try {
        // Use dynamic import trick to avoid Vite resolving native plugins in dev web
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mod = await import(/* @vite-ignore */ "@capacitor" + "/camera");
      const Camera = (mod as any).Camera ?? (mod as any).Plugins?.Camera;
      if (!Camera) return null;
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: (mod as any).CameraResultType?.DataUrl || "dataUrl",
        source: (mod as any).CameraSource?.Camera || "CAMERA",
      });
      return (photo as any).dataUrl || null;
  } catch (e) {
    return null;
  }
}

export async function scanBarcodeNative(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ "@capacitor-community" + "/barcode-scanner");
    const BarcodeScanner = (mod as any).BarcodeScanner || (mod as any).Plugins?.BarcodeScanner;
    if (!BarcodeScanner) return null;
    const result = await BarcodeScanner.scan();
    if (result?.hasContent) return result.content || null;
    if (result?.text) return result.text || null;
    return null;
  } catch (e) {
    return null;
  }
}
