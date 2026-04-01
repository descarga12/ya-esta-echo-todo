import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSku(name?: string): string {
  const base =
    (name || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 4) || "SKU";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${base}-${rand}`;
}
