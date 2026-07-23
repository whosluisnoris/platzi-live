// Ícono de línea por categoría, que hace referencia a su temática. Usa
// currentColor, así que hereda el color del contenedor. Cae a una cuadrícula
// genérica para categorías nuevas (el admin puede pensar el suyo más adelante).
export function CategoryIcon({
  slug,
  className = "h-6 w-6",
}: {
  slug: string;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (slug) {
    // IA → destellos (contenido generativo)
    case "ia":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
          <path d="M18.4 15.4l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
        </svg>
      );
    // Agentes → cabeza de robot
    case "agentes":
      return (
        <svg {...common}>
          <rect x="4.5" y="8" width="15" height="11" rx="3" />
          <path d="M12 8V5" />
          <circle cx="12" cy="3.7" r="1.2" />
          <path d="M2.7 12.5v3M21.3 12.5v3" />
          <circle cx="9.5" cy="13.2" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="13.2" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      );
    // Datos → base de datos (cilindro)
    case "datos":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
          <path d="M5 5.5v13c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-13" />
          <path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" />
        </svg>
      );
    // genérico → cuadrícula
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
  }
}
