# Interfaz (estilo YouTube, en español)

## Estructura

```
┌──────────────────────────────────────────────────────────────┐
│ Platzi Live   [EN VIVO]                        [Actualizar]  │  ← header sticky
├──────────────────────────────────┬───────────────────────────┤
│                                  │ ● EN VIVO AHORA           │
│        Reproductor               │  ▸ live de Platzi (si hay)│
│        (iframe de YouTube)       │  ▸ Radio lofi 24/7        │
│                                  ├───────────────────────────┤
│  Título del video                │ LIVES ANTERIORES  [orden▾]│
│  Canal · EN VIVO / fecha         │  ▸ tarjeta (mini+título+  │
│                 [Ver en YouTube] │    "hace 3 semanas")      │
│                                  │  ▸ …                      │
└──────────────────────────────────┴───────────────────────────┘
```

En móvil las columnas se apilan (reproductor arriba). Rejilla:
`lg:grid-cols-[minmax(0,1fr)_400px]`.

## Componentes ([`src/components/`](../src/components))

| Componente | Rol |
|---|---|
| `PlayerPanel` | Iframe del video + título, canal, insignia EN VIVO o fecha ("Transmitido hace 3 semanas · 11 de junio de 2026") y botón "Ver en YouTube" |
| `VideoListItem` | Tarjeta horizontal de la lista (miniatura 160px con fallback a `hqdefault`, título 2 líneas, canal, fecha relativa); resalta el video activo; insignias "EN VIVO" (rojo) y "24/7" (verde) |
| `StatusBadge` | Insignia "EN VIVO" (roja, convención universal; el verde Platzi queda para acciones) |
| `FeedbackPoll` | Encuesta flotante en la esquina inferior derecha, con cierre y pastilla "📊 Encuesta" para reabrir (ver [04-analitica.md](04-analitica.md)) |
| `DailyChart` | Gráfica SVG de barras apiladas por día, usada en `/admin` |

Las tarjetas muestran "hace 3 semanas · 3 h 58 min" (fecha relativa + duración del
video); el reproductor añade además la fecha absoluta.

## Paleta, tema claro/oscuro y color por categoría

Tras el pivot, la marca dejó el verde de Platzi por una paleta propia (definida en
[`globals.css`](../src/app/globals.css)): crema `#FFF8F0`, vino `#5E0035`, crema-verdosa
`#F5F8DE`, rojo `#FF4242` y magenta `#FB62F6`.

- **Tokens semánticos** (`background`, `surface`, `foreground`, `muted`, `border`,
  `fill`, `accent`, …) mapeados en `@theme`. Los componentes usan estos tokens, no
  colores fijos, así que el mismo marcado sirve para ambos temas.
- **Tema claro/oscuro**: `[data-theme]` en `<html>`. Un script en el `<body>` lo fija
  antes del primer paint (elección guardada en `localStorage` o preferencia del sistema),
  sin parpadeo; `ThemeToggle` lo alterna. Por defecto: oscuro (base vino-negro).
- **Color por categoría**: cada categoría tiene su `color` (columna en DB, editable en
  `/admin`). Se usa en la pestaña activa, la cabecera de la categoría y el marco de sus
  tarjetas; en la landing los colores de todas las categorías se **mezclan** en un
  degradado y en manchas de fondo. El degradado de marca (rojo → magenta) firma los CTAs
  (`.brand-gradient` / `.brand-text`).

## Estilo glass y barra de scroll

- Clase `.glass`: tinte sutil derivado del fondo + `backdrop-blur` + borde luminoso.
  Se usa en el header, el panel de la lista, la encuesta flotante y las tarjetas del
  admin. Adaptada a tokens para verse bien en claro y oscuro.
- Clase `.custom-scroll`: barra de 10px con degradado claro y carril tenue, uniforme
  en las dos zonas con scroll propio (más visible que la nativa).

## Zonas de scroll (escritorio, ≥1024px)

La página ocupa exactamente el viewport: **el reproductor queda fijo** y no hay scroll
de página. La lista lateral es un **panel con tono propio** (`bg-white/[0.03]` + borde
sutil) que scrollea por dentro — el cambio de tono marca visualmente qué zona se mueve.
La columna del reproductor solo scrollea si su contenido no cabe (ventanas bajitas).
En móvil todo se apila y la página scrollea normal.

## Selección del video en el reproductor

Prioridad (en [`src/app/page.tsx`](../src/app/page.tsx), derivada durante el render):

1. **Clic del usuario** (estado `chosen`) — nunca se interrumpe automáticamente.
2. **Deep-link `?v=VIDEO_ID`** — enlaces compartibles; al hacer clic en un video la URL
   se actualiza con `history.replaceState` sin recargar.
3. **Platzi Live activo** — si hay transmisión en este momento.
4. **Radio lofi 24/7** (`tRsQsTMvPNg`, constante en [`src/lib/constants.ts`](../src/lib/constants.ts)).

Mientras el usuario no haya hecho clic, si un Platzi Live comienza (lo detecta el polling
de 5 min), el reproductor **cambia solo al live**; al terminar, vuelve a la radio lofi.

El `autoplay` del iframe solo se activa tras un clic del usuario (los navegadores
bloquean el autoplay con sonido sin gesto previo).

## Orden de la lista

Selector con dos opciones: "Más recientes primero" (default) y "Más antiguos primero".
La clave de orden es `live_started_at ?? published_at`. Los lives activos no participan
del orden: van fijados en la sección "En vivo ahora".

## Fechas en español

[`src/lib/dates.ts`](../src/lib/dates.ts) — `Intl.RelativeTimeFormat("es-MX")` para
"hace 3 semanas" e `Intl.DateTimeFormat("es-MX")` para "11 de junio de 2026". Sin
librerías externas.
