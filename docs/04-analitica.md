# Analítica de reproducciones

## Qué se mide (y qué no)

Cada interacción relevante genera un evento **anónimo**:

| Evento | Cuándo |
|---|---|
| `play` | El usuario hace clic en un video de la lista (o llega por deep-link `?v=`) |
| `autoplay_default` | El reproductor cargó un video automáticamente al entrar (o cambió solo al empezar/terminar un live) |
| `open_youtube` | Clic en "Ver en YouTube" |

Junto al evento se guarda un `session_id`: un UUID generado en el navegador y guardado en
`localStorage` (`pl_session_id`). Permite aproximar "personas únicas" **sin** cookies de
rastreo, IPs, ni ningún dato personal. Si `localStorage` está bloqueado, el evento se
registra sin sesión.

> `play` mide interés real (clics); `autoplay_default` mide visitas/exposición. Por eso
> se cuentan por separado.

## Flujo

```
Navegador: trackEvent(videoId, tipo)          [src/lib/analytics.ts]
  → navigator.sendBeacon("/api/events") (o fetch keepalive como fallback)
  → POST /api/events                          [src/app/api/events/route.ts]
      valida videoId (regex), tipo (lista blanca) y sessionId (formato)
  → INSERT en watch_events (service role)
```

Es *fire-and-forget*: si la analítica falla, la reproducción no se entera.

## Dónde verla

En `/admin` → sección **Estadísticas**: reproducciones, cargas automáticas, aperturas en
YouTube, sesiones únicas y última actividad por video (vía `GET /api/admin/stats`,
protegido con la contraseña de admin).

## Consultas SQL útiles (SQL Editor de Supabase)

```sql
-- Videos más vistos (clics reales)
SELECT video_id, plays, unique_sessions FROM watch_stats ORDER BY plays DESC;

-- Actividad por día de los últimos 30 días
SELECT date_trunc('day', created_at) AS dia, count(*) AS eventos,
       count(DISTINCT session_id) AS sesiones
FROM watch_events
WHERE created_at > now() - interval '30 days'
GROUP BY 1 ORDER BY 1 DESC;

-- ¿Qué hace la gente al entrar? (proporción autoplay vs clics)
SELECT event_type, count(*) FROM watch_events GROUP BY 1;
```

## Gráfica del panel de admin

En `/admin` hay una gráfica de barras apiladas con la actividad de los últimos 14 días
(reproducciones, cargas automáticas y aperturas en YouTube; sesiones únicas en el
tooltip). Es SVG puro sin dependencias ([`src/components/DailyChart.tsx`](../src/components/DailyChart.tsx));
la paleta categórica (verde `#09b06a`, azul `#4a90e0`, ámbar `#b87a16`) fue validada con
el validador del sistema de diseño para la superficie oscura (banda de luminosidad,
croma, separación para daltonismo y contraste). Incluye vista de tabla accesible.

## Visitas desde Vercel Web Analytics

Vercel **sí** expone las visitas por API (`/v1/query/web-analytics/visits/aggregate`),
y el panel ya está preparado para mostrarlas. Requiere configuración única:

1. Dashboard de Vercel → proyecto → **Analytics** → *Enable Web Analytics* (gratis en
   Hobby). El paquete `@vercel/analytics` ya está integrado en el layout, así que la
   recolección empieza en cuanto se habilita.
2. Crear un **Access Token** (Account Settings → Tokens).
3. Variables de entorno del proyecto: `ANALYTICS_API_TOKEN`, `ANALYTICS_PROJECT_ID`
   (prj_…) y `ANALYTICS_TEAM_ID` (team_…).

`GET /api/admin/visits` (protegido con la contraseña de admin) consulta la API de
Vercel y la sección "Visitas" del panel muestra la gráfica; sin configurar, muestra
esta misma guía.

## Encuesta de la plataforma

Encuesta flotante (esquina inferior derecha, se puede cerrar y reabrir con la pastilla
"📊 Encuesta"): "¿Te gustaría tener una funcionalidad así en Platzi?" con tres
opciones: *Sí, me encanta* / *Puede mejorar* / *No me convence*. Se abre sola tras
1.5 s solo si la persona no ha votado ni la ha cerrado antes.

Tras votar aparece un campo opcional "¿Quieres contarnos por qué?" (máx. 500
caracteres). El comentario viaja adjunto al voto de la sesión (columna `comment`;
volver a comentar lo actualiza) y **solo se lee desde /admin** — el GET público sigue
devolviendo únicamente conteos. Los comentarios aparecen en /admin bajo los resultados
de la encuesta, con la respuesta votada y la fecha.

- Un voto por sesión anónima (la misma de la analítica); volver a votar lo **actualiza**
  vía `UNIQUE (question_id, session_id)` + upsert.
- `POST /api/feedback` registra el voto; `GET /api/feedback?question=...` devuelve solo
  agregados (conteos y total — nunca sesiones).
- Tras votar, el usuario ve los porcentajes (estilo encuesta de redes) y puede cambiar
  su respuesta; el estado se recuerda en `localStorage` (`pl_poll_live_platform_v1`).
- Los resultados también aparecen en `/admin` → "Encuesta de la plataforma".

Sirve como evidencia de interés real para la propuesta a Platzi.

## Posibles extensiones futuras

- **Duración de visualización**: eventos periódicos `heartbeat` mientras el iframe está
  visible (requiere la API `postMessage` del player de YouTube).
- **Retención**: comparar `session_id` recurrentes por semana.
- Panel público de "lo más visto" usando `watch_stats`.
