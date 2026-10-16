# Platzi Live

Plataforma tipo YouTube que reúne los lives del canal de [Platzi](https://platzi.com):
reproductor principal + histórico de transmisiones como lista lateral, con detección
automática de lives, fechas reales de transmisión y analítica anónima.

**Producción**: (definir tras crear el proyecto en Vercel)

## Características

- 📺 **Reproductor principal**: al entrar carga el Platzi Live activo; si no hay, la radio lofi 24/7 de Claude
- 🗂️ **Histórico ordenable**: todos los lives guardados, de más reciente a más antiguo (o al revés)
- 🔴 **Detección automática**: los lives nuevos se guardan solos, con su fecha real de inicio, y se marcan "EN VIVO" mientras duran
- 📊 **Analítica anónima**: qué lives se ven más, sin datos personales (panel en `/admin`)
- 🔗 **Deep-links**: `?v=VIDEO_ID` para compartir un live específico
- 🚫 **Sin API de YouTube/Google**: scraping de páginas públicas + fallback a Invidious
- ☁️ **Sin costo de video**: todo se reproduce en iframes de YouTube

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres): histórico de lives y eventos de analítica
- **Vercel**: hosting con deploy automático desde `master`

## Desarrollo

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y completa las variables. Crea un proyecto Supabase propio y ejecuta `supabase/schema.sql` en el SQL Editor.

**Probar la UI con un live simulado** (solo dev):

```
http://localhost:3000?test=VIDEO_ID
```

## Documentación

La documentación completa (arquitectura, base de datos, detección sin API, analítica,
pruebas y la propuesta de buscador con IA) vive en [`docs/`](docs/00-resumen.md).
