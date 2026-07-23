# Rutas IA

> Nombre provisional (`SITE_NAME` en `src/lib/constants.ts`) — cámbialo cuando decidas la marca final.

Centro de recopilación y orden de **recursos de aprendizaje sobre IA y datos**:
reúne y organiza contenido de calidad de YouTube (en español, gratuito) por área
temática, para aprender de forma guiada en vez de perderse entre miles de videos
dispersos. Incluye, como una pestaña más, el histórico de **Platzi Lives** con
detección automática.

**Producción**: https://platzi-live.vercel.app/

## Características

- 🧭 **Landing** que explica la plataforma e invita a explorar el catálogo
- 🗂️ **Catálogo por pestañas**: categorías extensibles (IA, Agentes, Datos…) + "Todo"
- 🎬 **Dos tipos de recurso**: **playlists** curadas (reproductor + lista de episodios) y **videos** sueltos
- ⬇️ **Importación de playlists de YouTube** por scraping (sin API de Google), con fallback manual
- 🔴 **Pestaña Platzi Lives** intacta: detección automática de transmisiones, fechas reales, "EN VIVO"
- 🛠️ **Panel `/admin`**: gestión de categorías, recursos y lives, más estadísticas
- 📊 **Analítica anónima** de reproducciones (sin datos personales)
- 🚫 **Sin API de YouTube/Google**: scraping de páginas públicas + oEmbed + fallback Invidious
- ☁️ **Sin costo de video**: todo se reproduce en iframes de YouTube

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres): catálogo (categorías, recursos, playlists), histórico de lives y analítica
- **Vercel**: hosting con deploy automático desde `master`

## Desarrollo

```bash
npm install
npm run dev
```

Crea `.env.local` con las variables de [docs/05-pruebas-y-despliegue.md](docs/05-pruebas-y-despliegue.md).

**Probar la pestaña Platzi Lives con un live simulado** (solo dev):

```
http://localhost:3000/platzi-lives?test=VIDEO_ID
```

## Documentación

La documentación completa (arquitectura, base de datos, catálogo de recursos,
detección sin API, analítica, pruebas y despliegue) vive en [`docs/`](docs/00-resumen.md).
