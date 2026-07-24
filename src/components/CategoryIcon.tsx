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
    // Tecnología → microchip
    case "tecnologia":
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <rect x="10" y="10" width="4" height="4" rx="0.5" />
          <path d="M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3" />
        </svg>
      );
    // Programación → símbolos de código </>
    case "programacion":
      return (
        <svg {...common}>
          <path d="M8.5 8L4 12l4.5 4" />
          <path d="M15.5 8L20 12l-4.5 4" />
          <path d="M13.5 6l-3 12" />
        </svg>
      );
    // Web → globo con meridianos
    case "web":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.3" />
          <ellipse cx="12" cy="12" rx="3.6" ry="8.3" />
          <path d="M3.8 12h16.4" />
        </svg>
      );
    // Diseño → pluma / nib de edición
    case "diseno":
      return (
        <svg {...common}>
          <path d="M4 20l4.5-1.5L19 8a2.12 2.12 0 0 0-3-3L5.5 15.5 4 20Z" />
          <path d="M14.5 6.5l3 3" />
          <path d="M5.5 15.5l3 3" />
        </svg>
      );
    // Producto → caja / paquete
    case "producto":
      return (
        <svg {...common}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M4 7.5l8 4.5 8-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
    // DevOps → bucle infinito (ciclo continuo)
    case "devops":
      return (
        <svg {...common}>
          <path d="M12 12C10.5 9.6 8.6 9 7 9c-2.2 0-3.5 1.4-3.5 3s1.3 3 3.5 3c1.6 0 3.5-.6 5-3 1.5-2.4 3.4-3 5-3 2.2 0 3.5 1.4 3.5 3s-1.3 3-3.5 3c-1.6 0-3.5-.6-5-3Z" />
        </svg>
      );
    // Ciberseguridad → escudo con check
    case "ciberseguridad":
      return (
        <svg {...common}>
          <path d="M12 3l7 2.5v5.6c0 4.4-3 7.9-7 9.4-4-1.5-7-5-7-9.4V5.5L12 3Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    // Móvil → smartphone
    case "movil":
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="2.5" />
          <path d="M10.5 5.5h3" />
          <path d="M10.5 18h3" />
        </svg>
      );
    // Carrera → maletín
    case "carrera":
      return (
        <svg {...common}>
          <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
          <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
          <path d="M3.5 12.5h17" />
          <path d="M12 11.5v2" />
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
