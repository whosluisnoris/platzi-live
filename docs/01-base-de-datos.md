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
| `duration_seconds` | integer | Duración del video (`null` mientras el live sigue activo; se captura al terminar) |

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

## Tabla `feedback_votes` — encuesta de la plataforma

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `question_id` | text | Pregunta (hoy: `live_platform_v1`) |
| `answer` | text | `si` \| `puede_mejorar` \| `no` (CHECK en DB) |
| `session_id` | text | Misma sesión anónima de la analítica |
| `comment` | text | Comentario opcional (máx. 500 caracteres, solo visible en /admin) |
| `created_at` | timestamptz | Momento del voto |

`UNIQUE (question_id, session_id)`: un voto por sesión; volver a votar **actualiza** la
respuesta (upsert). Si el navegador bloquea localStorage, el voto entra sin sesión (los
`NULL` no chocan con la restricción). RLS activo sin políticas públicas, igual que
`watch_events`.

## Catálogo de recursos (IA/Datos)

El pivot a centro de recursos añade cuatro tablas nuevas (todas aditivas, sin tocar
`streams`/`watch_events`/`feedback_votes`). Detalle completo en
[07-catalogo-de-recursos.md](07-catalogo-de-recursos.md).

### Tabla `categories` — taxonomía extensible

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `slug` | text (único) | Identificador en la URL (`ia`, `agentes`, `datos`) |
| `name` | text | Etiqueta visible ("IA") |
| `description` | text | Opcional, para landing y encabezado de la pestaña |
| `sort_order` | integer | Orden de las pestañas (editable en `/admin`) |
| `is_active` | boolean | Ocultar sin borrar (default `true`) |
| `color` | text | Color predominante (hex, p. ej. `#FB62F6`); la UI cae al acento si es `null` |
| `created_at` | timestamptz | |

> "Platzi Lives" y "Todo" **no** son filas de esta tabla: son pestañas fijas en código.

### Tabla `resources` — video suelto o playlist

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `kind` | text | `video` \| `playlist` (CHECK en DB) |
| `youtube_id` | text | ID de video (11) o de playlist (`PL…`) |
| `title` | text | Título del recurso |
| `channel_title` | text | Canal o curador |
| `description` | text | Opcional |
| `thumbnail_url` | text | Miniatura |
| `video_count` | integer | Solo `kind='playlist'`: nº de videos importados |
| `duration_seconds` | integer | Solo `kind='video'` |
| `published_at` | timestamptz | Fecha de publicación (videos) |
| `added_at` | timestamptz | Cuándo se curó en la plataforma |
| `synced_at` | timestamptz | Última importación/resync exitosa |
| `source` | text | `manual` \| `playlist_import` (CHECK en DB) |

`UNIQUE (kind, youtube_id)`: evita duplicar el mismo recurso.

### Tabla `playlist_items` — videos ordenados de una playlist

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `playlist_resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | Playlist dueña |
| `position` | integer | Orden dentro de la playlist |
| `youtube_video_id` | text | ID del video |
| `title` | text | Título del video |
| `thumbnail_url` | text | Miniatura |
| `added_at` | timestamptz | |

`UNIQUE (playlist_resource_id, youtube_video_id)` + índice `(playlist_resource_id, position)`.

### Tabla `resource_categories` — relación N:N

| Columna | Tipo | Descripción |
|---|---|---|
| `resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | |
| `category_id` | uuid (FK → `categories`, ON DELETE CASCADE) | |
| `created_at` | timestamptz | |

PK `(resource_id, category_id)` + índice adicional en `category_id`. Un recurso puede
pertenecer a varias categorías.

## Vista `watch_stats`

Agregados por video: `plays`, `autoplays`, `youtube_opens`, `unique_sessions`,
`last_activity`. Creada con `security_invoker = true`.

## Seguridad (RLS)

| Objeto | Política |
|---|---|
| `streams` | RLS activo; `SELECT` público (la anon key solo lee) |
| `watch_events` | RLS activo **sin políticas públicas**: solo el service role (rutas API del servidor) puede leer/escribir |
| `watch_stats` | `security_invoker = true`: hereda las restricciones de `watch_events` (anon bloqueado) |
| `categories`, `resources`, `playlist_items`, `resource_categories` | RLS activo; `SELECT` público (contenido curado sin PII); escrituras solo vía service role en `/api/admin/*` |

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
3. **`add_feedback_votes`** (2026-07-17): tabla de la encuesta (aditiva), con RLS sin
   políticas públicas e índice por pregunta.
4. **`add_duration_seconds`** (2026-07-17): columna de duración en `streams` (aditiva)
   + backfill de las 23 filas scrapeando `lengthSeconds` de cada página watch.
5. **`add_resource_catalog`** (2026-07-23): cuatro tablas nuevas del catálogo
   (`categories`, `resources`, `playlist_items`, `resource_categories`) con índices y
   RLS (`SELECT` público). Todo `CREATE TABLE IF NOT EXISTS`, **sin ningún `DROP`/`DELETE`**;
   el código anterior sigue funcionando sin cambios.
6. **`seed_default_categories`** (2026-07-23): inserta las categorías iniciales (IA,
   Agentes, Datos) con `ON CONFLICT (slug) DO NOTHING` (idempotente).
7. **`add_category_color`** (2026-07-23): columna `color` en `categories` (aditiva) +
   asignación de la paleta de marca a IA (magenta), Agentes (rojo) y Datos (vino).
