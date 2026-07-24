# Clusly

**Te ayudamos a encontrar tu camino en el mundo infinito de videos.**

Centro comunitario de **recursos de aprendizaje de tecnología**: reúne y ordena
contenido de calidad de YouTube (en español, gratuito) por área temática, para
aprender de forma guiada en vez de perderse entre miles de videos dispersos. La
comunidad aporta videos, los clasifica y vota por los que ayudan. Incluye, como
sección aparte, el histórico de **Platzi Lives** con detección automática. (La
marca vive en `SITE_NAME`, `src/lib/constants.ts`.)

**Producción**: https://clusly.com

## Características

- 🧭 **Landing** editorial que explica la plataforma e invita a explorar el catálogo
- 🔎 **Explorar** (`/todo`): cuadrícula filtrable por categoría y orden (más votados / recientes), con el estado en la URL
- 🗂️ **Categorías extensibles** (Tecnología, Programación, Web, IA, Agentes, Datos, Diseño, Producto, DevOps, Ciberseguridad, Móvil, Carrera), cada una con ícono e identidad propios
- 🎬 **Dos tipos de recurso**: **playlists** curadas (reproductor + lista de episodios) y **videos** sueltos; cada tarjeta muestra sus categorías
- 👤 **Cuentas** (Supabase Auth): registro con confirmación por correo (Resend) e inicio de sesión
- 🙌 **Envíos de la comunidad** (`/enviar`) con detección de duplicados
- ⬆️⬇️ **Votación** positiva/negativa que ordena el catálogo
- 🛡️ **Roles** (`owner` / `admin` / `user`): el panel `/admin` se abre por rol de la sesión
- ⬇️ **Importación de playlists de YouTube** por scraping (sin API de Google), con fallback manual
- 🔴 **Platzi Lives**: detección automática de transmisiones, fechas reales, "EN VIVO"
- 📊 **Analítica anónima** de reproducciones (sin datos personales)
- 📱 **Responsive**: en móvil la navegación vive en un menú lateral (drawer)
- 🚫 **Sin API de YouTube/Google**: scraping de páginas públicas + oEmbed + fallback Invidious

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres + Auth): catálogo, cuentas/perfiles/roles, votos, histórico de lives y analítica
- **Resend**: correos de autenticación (Send Email Hook de Supabase)
- **Vercel**: hosting con deploy automático desde `master`

## Desarrollo

```bash
npm install
npm run dev
```

Crea `.env.local` con las variables de [docs/05-pruebas-y-despliegue.md](docs/05-pruebas-y-despliegue.md)
(Supabase, Resend, `ADMIN_SECRET`).

**Probar la sección Platzi Lives con un live simulado** (solo dev):

```
http://localhost:3000/platzi-lives?test=VIDEO_ID
```

## Documentación

La documentación completa (arquitectura, base de datos, catálogo de recursos,
cuentas/votación/roles, detección sin API, analítica, pruebas y despliegue) vive
en [`docs/`](docs/00-resumen.md).
