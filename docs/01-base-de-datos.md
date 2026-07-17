# Base de datos (Supabase / Postgres)

Proyecto Supabase: `platzi-live` (`ozkmxovmdognljtsvhrl`).

## Tabla `streams` — histórico de lives

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `video_id` | text (único) | ID de YouTube (11 caracteres) |
| `title` | text | Título del video |
| `channel_title` | text | Canal (default `Platzi`) |
| `added_at` | timestamptz | Cuándo lo detectó/guardó la plataforma |
| `published_at` | timestamptz | Fecha de publicación según YouTube |
| `live_started_at` | timestamptz | **Inicio real de la transmisión** (fecha principal para mostrar/ordenar) |
| `live_ended_at` | timestamptz | Fin de la transmisión (`null` mientras siga en vivo) |
| `is_live` | boolean | `true` mientras el live está activo |
| `thumbnail_url` | text | Miniatura (`i.ytimg.com/vi/<id>/maxresdefault.jpg`) |
| `enriched_at` | timestamptz | Cuándo se scrapearon los metadatos (`null` = pendiente de auto-reparación) |

> ¿Por qué `live_started_at` y no `published_at`? Los lives se programan con antelación:
> hay casos reales donde `published_at` es semanas anterior (o incluso posterior) al live.
> `live_started_at` refleja cuándo ocurrió de verdad.

## Tabla `watch_events` — analítica anónima

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `video_id` | text | Video sobre el que ocurrió el evento |
| `event_type` | text | `play` \| `open_youtube` \| `autoplay_default` (CHECK en DB) |
| `session_id` | text | UUID anónimo del navegador (localStorage), puede ser `null` |
| `created_at` | timestamptz | Momento del evento |

Índice: `(video_id, created_at)`.

## Vista `watch_stats`

Agregados por video: `plays`, `autoplays`, `youtube_opens`, `unique_sessions`,
`last_activity`. Creada con `security_invoker = true`.

## Seguridad (RLS)

| Objeto | Política |
|---|---|
| `streams` | RLS activo; `SELECT` público (la anon key solo lee) |
| `watch_events` | RLS activo **sin políticas públicas**: solo el service role (rutas API del servidor) puede leer/escribir |
| `watch_stats` | `security_invoker = true`: hereda las restricciones de `watch_events` (anon bloqueado) |

Las escrituras siempre pasan por rutas API del servidor con `SUPABASE_SERVICE_ROLE_KEY`
(nunca expuesta al navegador).

## Migraciones aplicadas

1. **`add_stream_metadata_and_watch_events`** (2026-07-16): columnas nuevas en `streams`
   (todas aditivas, `ADD COLUMN IF NOT EXISTS`), tabla `watch_events`, índice y vista
   `watch_stats`. **Sin ningún `DROP`/`DELETE`** — el código anterior siguió funcionando
   durante la transición.
2. **Backfill** (2026-07-16): las 23 filas existentes recibieron `published_at`,
   `live_started_at`, `live_ended_at` y `thumbnail_url` scrapeando la página watch de
   cada video (solo `UPDATE` de columnas nuevas; título y demás campos intactos).
