import type { ReactNode } from "react";
import { cn } from "./cn";
import { IconTile } from "./IconTile";
import { BackLink } from "./BackLink";

// Cabecera de página con la tipografía de la landing: título grande en
// Bricolage extrabold, texto de apoyo en gris y, opcionalmente, ícono de
// temática, enlace de volver y acciones.
//
// Con `size="lg"`, en móvil todo se apila (acciones debajo del texto) y desde
// `sm` las acciones se alinean a la derecha, a la altura de la última línea.
//
// `size="md"` es para cabeceras que no son protagonistas (el reproductor,
// el panel admin, la tarjeta de acceso): título más chico y las
// acciones al lado desde móvil (bajan de línea solo si no caben).
export function PageHeader({
  title,
  description,
  icon,
  iconColor,
  back,
  actions,
  children,
  size = "lg",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Ícono (p. ej. <CategoryIcon/>) que va en un IconTile a la izquierda. */
  icon?: ReactNode;
  iconColor?: string;
  back?: { href: string; label: ReactNode };
  /** Botones a la derecha (ButtonLink, Button…). */
  actions?: ReactNode;
  /** Contenido extra bajo la descripción (insignias, metadatos). */
  children?: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <header className={cn(size === "lg" ? "mb-8 sm:mb-10" : "mb-6", className)}>
      {back && (
        <BackLink href={back.href} className="mb-4 sm:mb-5">
          {back.label}
        </BackLink>
      )}
      <div
        className={cn(
          "flex",
          size === "lg"
            ? "flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8"
            : "flex-wrap items-center justify-between gap-x-6 gap-y-3"
        )}
      >
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          {icon && (
            <IconTile color={iconColor} size={size === "lg" ? "lg" : "md"}>
              {icon}
            </IconTile>
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                "font-extrabold tracking-tight text-foreground",
                size === "lg"
                  ? "text-[2rem] leading-[1.08] sm:text-[2.6rem] lg:text-5xl lg:leading-[1.04]"
                  : "text-2xl leading-tight sm:text-3xl"
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "max-w-2xl leading-relaxed text-muted",
                  size === "lg" ? "mt-3 text-[15px] sm:mt-4 sm:text-base" : "mt-2 text-sm sm:text-[15px]"
                )}
              >
                {description}
              </p>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
        )}
      </div>
    </header>
  );
}
