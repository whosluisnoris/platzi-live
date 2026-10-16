# Resumen de la plataforma

## Qué es

Un **centro de recopilación y orden de recursos de aprendizaje sobre IA y datos**:
reúne y organiza contenido de calidad de YouTube (en español, gratuito) por área
temática, para poder aprender de forma guiada en vez de perderse entre miles de
videos dispersos.

- **Landing (`/`)**: presenta la plataforma (qué resuelve, cómo funciona) e invita
  a explorar el catálogo.
- **Explorar (`/todo`)**: cuadrícula de **recursos** (playlists curadas y videos
  sueltos) filtrable por categoría, orden (más votados / recientes) e **idioma del
  video**, con el estado en la URL. Cada tarjeta muestra sus categorías. Al abrir un recurso se reproduce
  en un `<iframe>` de YouTube; las playlists muestran reproductor + lista de episodios.
- **Cuentas, envíos y votación**: registro/login con confirmación por correo
  (Supabase Auth + Resend). Cualquiera aporta videos (`/enviar`) — sin cuenta el
  aporte queda pendiente de aprobación —, la comunidad vota (+/−) y ese puntaje
  ordena el catálogo. Ver
  [08-cuentas-votacion-setup.md](08-cuentas-votacion-setup.md).
- **Guardados (`/guardados`)**: cada tarjeta tiene un corazón al pasar el cursor;
  lo guardado forma una lista privada del usuario.
- **Opiniones (`/opiniones`)**: buzón de feedback abierto a cualquiera (con o sin
  cuenta). Lo que se escribe **no se publica**: se lee solo desde el panel.
- **Perfil (`/perfil`)**: los datos de la cuenta, biografía, ubicación y enlaces
  editables, más el resumen de actividad del usuario.
- **Idiomas (`/es`, `/en`)**: la interfaz está en español e inglés. El idioma se
  detecta por el navegador (`Accept-Language`) y se puede cambiar con el botón ES/EN,
  que recuerda la elección. El panel `/admin` se queda en español.
- **Blog (`/blog`)**: artículos en Markdown, con portada e imágenes que se suben a
  un bucket de Supabase Storage. Solo los escribe y publica el staff
  (`owner`/`admin`) desde la pestaña Blog del panel; el resto solo lee.
- **Roles** (`owner` / `admin` / `user`): el panel `/admin` se abre por el rol de la
  sesión (no por contraseña); ahí se gestionan categorías, recursos y blog, más
  estadísticas.
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
  │  POST /api/resources ─────────► envío de la comunidad (sin sesión: pendiente)
  │  POST /api/resources/[id]/vote► voto +/− (sesión requerida)
  │  POST /api/resources/[id]/favorite► guardar/quitar (sesión requerida)
  │  POST /api/opinions ──────────► opinión al buzón privado (con o sin cuenta)
  │  PATCH /api/profile ──────────► perfil: nombre, bio, ubicación y enlaces
  │  /api/admin/blog (rol owner/admin)► escribir y publicar artículos del blog
  │  POST /api/admin/blog/upload ─► sube imágenes al bucket `blog` de Storage
  │  /api/admin/blog/media ───────► ver el bucket y borrar imágenes a mano
  │  POST /api/events ────────────► inserta evento anónimo en Supabase
  │  /api/admin/* (rol owner/admin)► CRUD de categorías/recursos + scraping de
  │                                  playlists + stats
  ▼
Supabase (Postgres + Auth + Storage)
  ├── profiles       ← perfil por usuario: nombre, role, bio, ubicación y enlaces
  ├── categories, resources, playlist_items, resource_categories ← catálogo
  ├── resource_votes ← un voto por usuario/recurso (mantiene resources.vote_count)
  ├── resource_favorites ← lista privada de guardados por usuario
  ├── site_feedback  ← buzón privado de opiniones (solo lo lee el staff)
  ├── blog_posts     ← artículos del blog (público solo lo publicado)
  ├── watch_events   ← eventos de analítica
  ├── watch_stats    ← vista con los agregados
  └── Storage: bucket `blog` ← imágenes de los artículos (leer sí, escribir no)
```

- **Hosting**: Vercel (deploy automático al hacer push a `master` en GitHub).
- **Sin API de YouTube/Google**: todo se obtiene por scraping de páginas públicas

## Índice de la documentación

| Documento | Contenido |
|---|---|
| [01-base-de-datos.md](01-base-de-datos.md) | Esquema, migraciones y seguridad (RLS) |
| [03-interfaz.md](03-interfaz.md) | Estructura de la UI y sus componentes |
| [04-analitica.md](04-analitica.md) | Eventos, sesiones anónimas y consultas útiles |
| [05-pruebas-y-despliegue.md](05-pruebas-y-despliegue.md) | Checklist de pruebas y proceso de deploy |
| [07-catalogo-de-recursos.md](07-catalogo-de-recursos.md) | El pivot: catálogo de recursos, playlists y admin |
| [08-cuentas-votacion-setup.md](08-cuentas-votacion-setup.md) | Cuentas, correo (Resend), roles, envíos y votación: puesta en marcha |
| [09-plan-de-monetizacion.md](09-plan-de-monetizacion.md) | Opciones y hoja de ruta para monetizar la plataforma |
| [10-componentes-ui.md](10-componentes-ui.md) | Componentes de interfaz reutilizables (`@/components/ui`) y cómo usarlos |

## Decisiones de diseño

| Decisión | Elección | Motivo |
|---|---|---|
| Idioma de la UI | Español por defecto, inglés opcional | El catálogo son videos en español: quien llega sin preferencia debe caer en español |
| Detección de idioma | `Accept-Language`, no geo-IP | El país no es el idioma: hay hispanohablantes en todo el mundo y el navegador ya dice la preferencia real |
| Analítica | Eventos + sesión anónima | Medir interés sin datos personales |
