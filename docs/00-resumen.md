# Resumen de la plataforma

## Qué es

Un **centro de recopilación y orden de recursos de aprendizaje sobre IA y datos**:
reúne y organiza contenido de calidad de YouTube (en español, gratuito) por área
temática, para poder aprender de forma guiada en vez de perderse entre miles de
videos dispersos.

- **Landing (`/`)**: presenta la plataforma (qué resuelve, cómo funciona) e invita
  a explorar el catálogo.
- **Explorar (`/todo`)**: cuadrícula de **recursos** (playlists curadas y videos
  sueltos) filtrable por categoría y orden (más votados / recientes), con el estado
  en la URL. Cada tarjeta muestra sus categorías. Al abrir un recurso se reproduce
  en un `<iframe>` de YouTube; las playlists muestran reproductor + lista de episodios.
- **Cuentas, envíos y votación**: registro/login con confirmación por correo
  (Supabase Auth + Resend). Los usuarios aportan videos (`/enviar`), la comunidad
  vota (+/−) y ese puntaje ordena el catálogo. Ver
  [08-cuentas-votacion-setup.md](08-cuentas-votacion-setup.md).
- **Roles** (`owner` / `admin` / `user`): el panel `/admin` se abre por el rol de la
  sesión (no por contraseña); ahí se gestionan categorías, recursos y lives, más
  estadísticas.
- **"Platzi Lives" (`/platzi-lives`)**: el producto original intacto — histórico de
  lives con **detección automática** (se guardan solos con su fecha real y se marcan
  "EN VIVO"), reproductor + lista lateral, y la radio lofi 24/7 cuando no hay live.
- **Analítica anónima**: cada reproducción se registra (sin datos personales) para
  saber qué interesa más.

## Por qué

Hay demasiado contenido de aprendizaje de IA/datos disperso y desordenado en
YouTube como para estudiarlo con criterio. La plataforma cura y ordena ese
contenido por temática — sin costo de infraestructura de video (todo se reproduce
en iframes; la plataforma solo organiza enlaces públicos) y sin API de Google
(scraping de páginas públicas). El detalle del catálogo está en
[07-catalogo-de-recursos.md](07-catalogo-de-recursos.md).

## Arquitectura en una imagen

```
Navegador (Next.js)
  │  Catálogo (Server Components) ─► lectura directa de Supabase (RLS público)
  │  /api/auth/* + Send Email Hook► registro/login (Supabase Auth) + correo (Resend)
  │  POST /api/resources ─────────► envío de la comunidad (sesión requerida)
  │  POST /api/resources/[id]/vote► voto +/− (sesión requerida)
  │  GET /api/live  ──────────────► scraping del canal de YouTube (¿hay lives?)
  │                                 + histórico en Supabase + enriquecimiento
  │  POST /api/events ────────────► inserta evento anónimo en Supabase
  │  /api/admin/* (rol owner/admin)► CRUD de categorías/recursos + scraping de
  │                                  playlists + stats
  ▼
Supabase (Postgres + Auth)
  ├── profiles       ← perfil por usuario + role (owner/admin/user)
  ├── categories, resources, playlist_items, resource_categories ← catálogo
  ├── resource_votes ← un voto por usuario/recurso (mantiene resources.vote_count)
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
| [07-catalogo-de-recursos.md](07-catalogo-de-recursos.md) | El pivot: catálogo de recursos, playlists y admin |
| [08-cuentas-votacion-setup.md](08-cuentas-votacion-setup.md) | Cuentas, correo (Resend), roles, envíos y votación: puesta en marcha |
| [09-plan-de-monetizacion.md](09-plan-de-monetizacion.md) | Opciones y hoja de ruta para monetizar la plataforma |

## Decisiones de diseño

| Decisión | Elección | Motivo |
|---|---|---|
| Idioma de la UI | Español | Audiencia de Platzi |
| Video inicial | Platzi Live activo → si no, lofi | No perderse ningún live real |
| Analítica | Eventos + sesión anónima | Medir interés sin datos personales |
| Fecha principal | `live_started_at` (inicio real del live) | El `publishDate` de YouTube a veces difiere semanas del live real |
| Buscador IA | Solo documentado | Se decidirá más adelante |
