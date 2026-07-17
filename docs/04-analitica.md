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

## Posibles extensiones futuras

- **Duración de visualización**: eventos periódicos `heartbeat` mientras el iframe está
  visible (requiere la API `postMessage` del player de YouTube).
- **Retención**: comparar `session_id` recurrentes por semana.
- Panel público de "lo más visto" usando `watch_stats`.
