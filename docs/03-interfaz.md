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
