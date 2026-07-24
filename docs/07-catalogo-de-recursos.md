# Catálogo de recursos (IA / Datos)

> El pivot de la plataforma: de reunir solo los lives de Platzi a ser un **centro
> de recopilación y orden de recursos de aprendizaje sobre IA y datos**. El dolor
> que resuelve: hay demasiado contenido de calidad en español, gratuito y en
> YouTube, pero disperso y desordenado como para aprender de forma guiada. Aquí se
> cura y se organiza por área temática.

## Qué cambió

- La home (`/`) pasó de ser el reproductor de lives a una **landing** que explica
  la plataforma e invita a explorar.
- Los lives de Platzi siguen **intactos** (detección automática, scraping, tabla
  `streams`), pero ahora viven en la pestaña **Platzi Lives**, una más entre las
  temáticas.
- El contenido nuevo se organiza en **categorías extensibles** (IA, Agentes,
  Datos…), cada una con un catálogo de **recursos**: videos sueltos y **playlists**.

## Modelo de datos

Cuatro tablas nuevas, todas aditivas (ver esquema en
[01-base-de-datos.md](01-base-de-datos.md)):

- `categories` — taxonomía extensible (slug, nombre, orden, activo). "Platzi
  Lives" y "Todo" **no** son filas aquí: son pestañas fijas en código.
- `resources` — un video suelto o una playlist (`kind`), con su `youtube_id`,
  título, canal, miniatura y metadatos. Tabla única porque la categorización, el
  grid, el borrado y la RLS son idénticos para ambos tipos.
- `playlist_items` — los videos ordenados de una playlist (`position`).
- `resource_categories` — relación N:N (un recurso puede estar en varias
  categorías).

Un recurso se lee en público (RLS `SELECT` abierto); todas las escrituras pasan
por `/api/admin/*` con `Bearer ADMIN_SECRET`, igual que los streams.

## Rutas (App Router)

```
/                         landing (hero + cómo funciona + categorías + CTA)
(catalog)/
  layout.tsx             barra de pestañas + footer + encuesta
  todo                   grid con TODOS los recursos
  categoria/[slug]       grid de una categoría
  recurso/[youtubeId]    detalle: video → reproductor; playlist → reproductor + episodios
  platzi-lives           el histórico de lives de siempre
```

- El **catálogo se lee desde Server Components** con el cliente anon
  (`src/lib/catalog.ts`), sin rutas `/api` públicas nuevas — solo las escrituras
  del admin usan API. Platzi Lives conserva su `/api/live` (necesita polling y
  escritura).
- `/recurso/[youtubeId]` es la URL canónica; el grid pasa `?from=slug|todo` para
  el enlace "← Volver a {origen}".

## Importación de playlists de YouTube (sin API de Google)

`fetchPlaylistVideos(playlistId)` en [`src/lib/invidious.ts`](../src/lib/invidious.ts)
scrapea `youtube.com/playlist?list=<ID>` y parsea el `ytInitialData` embebido
(reusa `parseYtInitialData` y reconoce `playlistVideoRenderer` y `lockupViewModel`,
igual que la detección de lives). Devuelve título, curador y los videos ordenados.

Consideraciones:

- **oEmbed no sirve para playlists** (solo videos): el título sale del scrape o,
  si falla, de un título manual que escribe el admin.
- **Paginación**: solo se importa la primera página (~100 videos). Si hay
  `continuation`, se avisa y el resto se completa a mano.
- **Nunca destructivo**: "Resincronizar" hace `upsert` por
  `(playlist_resource_id, youtube_video_id)` — inserta nuevos y refresca los
  existentes, sin borrar.
- **Diagnóstico**: `diagnosePlaylistParsing(playlistId)` reporta qué claves
  aparecen en una playlist real, para verificar el parser contra YouTube (útil
  desde Vercel/local, donde el egress a YouTube no está bloqueado).

## Panel `/admin`

Reorganizado en pestañas internas (el login no cambió):

- **Catálogo** — `CategoriesManager` (crear/reordenar/activar categorías) y
  `ResourcesManager` (pegar URL con detección automática video/playlist,
  multi-select de categorías, tabla de recursos, y gestión de episodios de una
  playlist: agregar/quitar/resincronizar).
- **Platzi Lives** — `StreamsManager`, extraído tal cual del panel original.
- **Estadísticas** — `StatsPanel`, extraído tal cual (analítica, visitas,
  encuesta, comentarios).

Rutas API nuevas: `/api/admin/categories`, `/api/admin/resources`,
`/api/admin/resources/[id]/items`, `/api/admin/resources/[id]/sync`.

## Reuso de componentes

`PlayerPanel` y `VideoListItem` operan sobre la interfaz común `Playable`
([`src/lib/types.ts`](../src/lib/types.ts); `LiveStream` es un alias), así que se
reutilizan sin cambios: en Platzi Lives y como reproductor + lista de episodios de
una playlist. La analítica (`trackEvent`/`watch_events`) es genérica por
`video_id`, sin cambios de esquema. `PlayerPanel` acepta un verbo de fecha
(`dateVerb`) para decir "Publicado" en el catálogo y "Transmitido" en los lives.

## Marca

El sitio se llama **Clusly** — "te ayudamos a encontrar tu camino en el mundo infinito
de videos". El nombre vive en `SITE_NAME`
([`src/lib/constants.ts`](../src/lib/constants.ts)) como **punto único de cambio**. La
encuesta flotante solo se muestra en `/platzi-lives` (su pregunta es sobre esa
funcionalidad, no sobre el catálogo). La encuesta
(`FeedbackPoll`) es parametrizable (`questionId`/`title`) para plantear una
pregunta post-pivot sin tocar la lógica; por defecto conserva la pregunta y los
votos históricos.
