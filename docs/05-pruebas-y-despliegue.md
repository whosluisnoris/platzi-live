# Pruebas y despliegue

## Principio rector

Producción nunca debe depender de algo que aún no existe, y **la base de datos jamás se
toca con operaciones destructivas**. Orden seguido en este rediseño:

1. ✅ Migración **aditiva** en Supabase (columnas nuevas + tabla nueva) → el código viejo
   en producción las ignora; se verificó `/api/live` (200 OK) tras aplicarla.
2. ✅ Backfill de fechas (solo `UPDATE` de columnas nuevas en las 23 filas) → verificado:
   23/23 con fechas, 0 filas dañadas, títulos intactos.
3. ✅ Código nuevo en la rama `feature/redesign` (nunca directo a `master`).
4. Build + lint + pruebas locales con navegador (checklist abajo).
5. Push de la rama → **Vercel Preview** (URL propia con los mismos env vars) → pruebas
   de escritura reales (eventos, stats).
6. Revisión y aprobación del usuario sobre el preview.
7. Merge a `master` → deploy automático → smoke test en producción.

**Rollback**: revertir el merge en git. Las migraciones son aditivas, así que el código
anterior funciona sin cambios en la DB.

## Checklist de pruebas locales

- [ ] `npm run build` y `npm run lint` sin errores
- [ ] La home carga el histórico (23 lives) con fechas en español
- [ ] Sin live activo, el reproductor abre la radio lofi 24/7
- [ ] Con `?test=VIDEO_ID` (solo dev) aparece un live simulado, con prioridad en el reproductor y en "En vivo ahora"
- [ ] El selector de orden invierte la lista correctamente
- [ ] Clic en una tarjeta: cambia el video, resalta la tarjeta, actualiza `?v=` en la URL
- [ ] Deep-link `?v=VIDEO_ID` abre ese video directamente
- [ ] Responsive: columnas apiladas en móvil (375px) y lado a lado en escritorio
- [ ] `/admin`: login, lista con fechas, agregar/quitar (con confirmación), estadísticas

## Checklist en el Preview de Vercel

- [ ] Todo lo anterior (sin `?test=`, que es solo dev)
- [ ] Los eventos aparecen en `watch_events` (SELECT en Supabase)
- [ ] `/api/admin/stats` responde con los agregados
- [ ] `/api/live` guarda/refresca sin errores en los runtime logs de Vercel

## Resultados de la verificación del rediseño (2026-07-16)

Todo lo ejecutable sin sesión de Vercel quedó verificado:

| Prueba | Resultado |
|---|---|
| `npm run build` + `npm run lint` + `tsc --noEmit` | ✅ sin errores |
| Migración aditiva aplicada → producción (código viejo) siguió sirviendo `/api/live` | ✅ 200 OK |
| Backfill: 23/23 filas con fechas, títulos intactos, 0 filas dañadas | ✅ |
| Home local: lofi por defecto, 23 lives con fechas en español, orden asc/desc | ✅ |
| `?test=` (live simulado): prioridad en reproductor + "En vivo ahora" + badge en header | ✅ |
| Clic en tarjeta: cambia video (autoplay), resalta, actualiza `?v=` | ✅ |
| Deep-link `?v=` directo | ✅ |
| Móvil 375px: apilado, sin scroll horizontal | ✅ |
| `/api/live` sin service key: lectura sigue viva (escrituras se omiten) | ✅ |
| Analítica end-to-end en DB (INSERT de los 3 tipos + agregados en `watch_stats`) | ✅ probado en transacción con ROLLBACK — cero datos residuales |
| RLS: anon no lee `watch_events`/`watch_stats` (`[]`), INSERT anon → 401, `streams` legible | ✅ |
| Build del preview en Vercel | ✅ "Deployment has completed" |

Pendiente de verificación humana (el preview está protegido por SSO de Vercel y el
conector MCP no tiene acceso al proyecto): abrir la URL del preview con sesión de
Vercel y probar que los eventos aparezcan en `watch_events`. Alternativa: verificarlo
en producción justo después del merge (la clave service role ya funciona en prod — el
auto-guardado de streams la usa hoy mismo).

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lecturas públicas (RLS solo permite SELECT en `streams`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Escrituras desde rutas API (server-only) |
| `ADMIN_SECRET` | Contraseña del panel `/admin` |

Para desarrollo local: copiar esas mismas variables a `.env.local` (no se versiona).

## Opcional: detección sin visitantes

Hoy la detección corre cuando alguien visita la página. Si se quiere detectar lives
aunque nadie tenga la página abierta, dos opciones gratuitas:

1. **pg_cron + pg_net en Supabase**: un job cada 5 minutos que haga
   `select net.http_get('https://platzi-live.vercel.app/api/live')`.
2. Un monitor externo gratuito (p. ej. UptimeRobot) apuntando a `/api/live`.

Ambas son cambios de configuración, no de código.
