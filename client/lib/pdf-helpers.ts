/** Texto largo en PDF: menos bytes y tablas más rápidas */
export function clipPdfText(value: unknown, maxLen = 34): string {
  const s = String(value ?? "").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(1, maxLen - 1))}…`;
}

/** A partir de ~50 filas conviene tema “plain” (menos operadores en el PDF). */
export function isHeavyPdfRowCount(n: number): boolean {
  return n >= 50;
}
