// Utilidades de color para los acentos por categoría. Puras y server-safe.

// Color de categoría con fallback al acento del tema si no hay uno definido.
export function catColor(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "var(--accent)";
}

// Luminancia relativa aproximada (sRGB) para decidir texto legible encima.
function luminance(hex: string): number {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // aproximación perceptual sencilla (suficiente para elegir claro/oscuro)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Texto legible (claro u oscuro de la marca) sobre un fondo del color dado.
export function inkOn(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "var(--on-accent)";
  return luminance(hex) > 0.6 ? "#21000f" : "#fff8f0";
}
