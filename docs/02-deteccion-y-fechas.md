# Detección de lives y obtención de fechas (sin API de Google)

Todo el acceso a datos de YouTube se hace **scrapeando páginas públicas** — no se usa la
YouTube Data API ni ninguna credencial de Google. El código vive en
[`src/lib/invidious.ts`](../src/lib/invidious.ts).

## 1. ¿Hay lives activos? — página del canal

`fetchPlatziLiveStreams()` descarga `youtube.com/channel/<id>/streams` con un
User-Agent de navegador. La página incrusta un JSON gigante (`var ytInitialData = {...}`)
del que se extraen los `videoRenderer` cuya insignia (`thumbnailOverlayTimeStatusRenderer`)
sea `LIVE`. Eso da: `videoId`, título y canal de cada live activo.

**Fallback**: si YouTube falla, se intenta con tres instancias públicas de
[Invidious](https://invidious.io/) (`/api/v1/channels/<id>/videos?type=streams`).

## 2. Fechas exactas por video — página watch

`fetchVideoDetails(videoId)` descarga `youtube.com/watch?v=<id>`. La página incrusta
`ytInitialPlayerResponse`, que dentro de `microformat.playerMicroformatRenderer` y
`liveBroadcastDetails` contiene:

| Campo | Ejemplo | Se guarda en |
|---|---|---|
| `publishDate` | `2026-06-11T13:26:16-07:00` | `published_at` |
| `startTimestamp` | `2026-06-11T20:27:35+00:00` | `live_started_at` |
| `endTimestamp` | `2026-06-12T00:27:22+00:00` | `live_ended_at` |
| `isLiveNow` | `true` / `false` | `is_live` |

Basta un regex por campo — no hace falta parsear el JSON completo.

## 3. Ciclo de vida de un live en `/api/live`

Cada visita a la página (y el polling de 5 minutos del navegador) dispara
`GET /api/live` ([`src/app/api/live/route.ts`](../src/app/api/live/route.ts)):

```
1. En paralelo: lives activos del canal + histórico de Supabase
2. Live nuevo detectado  → fetchVideoDetails() → upsert con fechas + is_live=true
3. Live que ya no está   → is_live=false, live_ended_at=now()   (solo UPDATE)
4. Auto-reparación       → filas con enriched_at null se re-scrapean (máx. 2 por request)
5. Respuesta: histórico + nuevos, con is_live refrescado
```

Protecciones:

- Las transiciones (paso 3) **solo corren si el scrape del canal tuvo éxito** — un fallo
  transitorio de red no marca lives como terminados.
- Máximo 3 páginas watch por request (`MAX_ENRICH_PER_REQUEST`) y `maxDuration = 30s`.
- Nada se borra nunca: un live terminado queda como grabación visible.

## Limitaciones conocidas

- La detección depende de que alguien (o el polling de una pestaña abierta) visite la
  página mientras el live está activo. Para independizarla de visitas, ver la opción de
  un ping programado en [05-pruebas-y-despliegue.md](05-pruebas-y-despliegue.md).
- El scraping depende de la estructura interna de las páginas de YouTube; si YouTube la
  cambia, hay que ajustar los regex/extractores (por eso existe el fallback de Invidious
  y la auto-reparación con `enriched_at`).
