# Platzi Live — Resumen de la plataforma

## Qué es

Una plataforma tipo YouTube que reúne en un solo lugar todos los **Platzi Lives**:

- **Reproductor principal**: al entrar, se carga el Platzi Live que esté activo en ese momento; si no hay ninguno, se carga la **radio lofi 24/7 de Claude** para acompañarte mientras exploras.
- **Lista lateral**: histórico completo de lives como tarjetas (miniatura, título, "hace 3 semanas"), ordenable de más reciente a más antiguo o al revés.
- **Detección automática**: cuando Platzi inicia un live en YouTube, la plataforma lo detecta, lo guarda con su fecha real de transmisión y lo marca "EN VIVO" mientras dura.
- **Analítica anónima**: cada reproducción se registra (sin datos personales) para saber qué lives interesan más.

## Por qué

Actualmente los Platzi Lives viven dispersos en el canal de YouTube. Esta plataforma es la
propuesta de una pestaña dedicada de lives: organizada, medible y sin costo de
infraestructura de video (los videos se reproducen en un `<iframe>` de YouTube; la
plataforma solo organiza enlaces públicos).

## Arquitectura en una imagen

```
Navegador (Next.js, client components)
  │  GET /api/live  ──────────► scraping del canal de YouTube (¿hay lives?)
  │                             + lectura del histórico en Supabase
  │                             + guardado/enriquecimiento de lives nuevos
  │  POST /api/events ────────► inserta evento anónimo en Supabase
  │  GET /api/admin/stats ────► agregados de reproducción (con contraseña)
  ▼
Supabase (Postgres)
  ├── streams        ← histórico de lives (con fechas y estado en vivo)
  ├── watch_events   ← eventos de analítica
  └── watch_stats    ← vista con los agregados
```

- **Hosting**: Vercel (deploy automático al hacer push a `master` en GitHub).
- **Sin API de YouTube/Google**: todo se obtiene por scraping de páginas públicas
  (ver [02-deteccion-y-fechas.md](02-deteccion-y-fechas.md)).

## Índice de la documentación

| Documento | Contenido |
|---|---|
| [01-base-de-datos.md](01-base-de-datos.md) | Esquema, migraciones y seguridad (RLS) |
| [02-deteccion-y-fechas.md](02-deteccion-y-fechas.md) | Cómo se detectan lives y se obtienen fechas sin API |
| [03-interfaz.md](03-interfaz.md) | Estructura de la UI y sus componentes |
| [04-analitica.md](04-analitica.md) | Eventos, sesiones anónimas y consultas útiles |
| [05-pruebas-y-despliegue.md](05-pruebas-y-despliegue.md) | Checklist de pruebas y proceso de deploy |
| [06-propuesta-ia-gemini.md](06-propuesta-ia-gemini.md) | Plan del buscador con IA (fase futura) |

## Decisiones de diseño

| Decisión | Elección | Motivo |
|---|---|---|
| Idioma de la UI | Español | Audiencia de Platzi |
| Video inicial | Platzi Live activo → si no, lofi | No perderse ningún live real |
| Analítica | Eventos + sesión anónima | Medir interés sin datos personales |
| Fecha principal | `live_started_at` (inicio real del live) | El `publishDate` de YouTube a veces difiere semanas del live real |
| Buscador IA | Solo documentado | Se decidirá más adelante |
