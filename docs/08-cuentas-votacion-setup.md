# Cuentas, envíos de la comunidad y votación — puesta en marcha

Esta funcionalidad añade: registro/login con confirmación por correo (Supabase
Auth + Resend), envíos de video por usuarios con detección de duplicados,
votación positiva/negativa, categorías de tecnología y exploración por filtros
(orden por más votados). Para que funcione en producción hay que hacer estos
pasos una sola vez.

## 1. Migración de base de datos

Aplica `supabase/migrations/0001_users_submissions_voting.sql` al proyecto
Supabase `platzi-live` (ref `ozkmxovmdognljtsvhrl`):

- **Opción A** — Supabase → SQL Editor → pega el archivo y ejecútalo.
- **Opción B** — deja que Claude lo aplique con la herramienta de migraciones
  (requiere tu aprobación; en modo automático puede quedar bloqueado por
  seguridad).

Es aditiva e idempotente: crea columnas/tablas nuevas y no borra nada. Las filas
actuales de `resources` quedan como `published`.

## 2. Resend (envío de correos)

1. Crea una cuenta en https://resend.com.
2. **Verifica un dominio** (ej. `clusly.com`) en Resend → Domains, agregando los
   registros DNS que te indique. Mientras tanto puedes probar con el remitente
   `onboarding@resend.dev` (solo entrega al correo dueño de la cuenta).
3. Crea una **API Key** (Resend → API Keys).

## 3. Variables de entorno en Vercel

En el proyecto de Vercel → Settings → Environment Variables, agrega:

| Nombre | Valor | Notas |
| --- | --- | --- |
| `RESEND_API_KEY` | la API key de Resend | **Esta es la key que preguntaste.** |
| `SEND_EMAIL_HOOK_SECRET` | el secreto del hook de Supabase (paso 4) | formato `v1,whsec_…` |
| `EMAIL_FROM` | `Clusly <no-reply@clusly.com>` | opcional; usa tu dominio verificado |

Ya deben existir (no las toques): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## 4. Supabase Auth

En el dashboard de Supabase → **Authentication**:

1. **Providers → Email**: activa "Confirm email" (confirmación obligatoria).
2. **URL Configuration**:
   - *Site URL*: `https://clusly.com`
   - *Redirect URLs*: agrega `https://clusly.com/**` (y tu dominio de preview de
     Vercel si pruebas ahí).
3. **Auth Hooks → Send Email Hook**: actívalo como **HTTPS**.
   - URL: `https://clusly.com/api/auth/send-email`
   - Genera el secreto y cópialo a `SEND_EMAIL_HOOK_SECRET` en Vercel (paso 3).

Con el hook activo, Supabase deja de mandar sus correos por defecto: cada correo
de auth lo entrega nuestro endpoint con la plantilla de marca (`src/lib/email/auth-email.ts`)
vía Resend.

## 5. Redeploy

Después de fijar las variables, haz un redeploy en Vercel para que tomen efecto.

---

### Resumen de piezas de código

- Sesión: `src/lib/supabase/{client,server}.ts`, `src/proxy.ts` (antes
  "middleware", renombrado en Next 16), `src/lib/auth.ts`.
- Auth: `src/app/(auth)/{entrar,registro}`, `src/app/api/auth/*`,
  `src/app/auth/confirm/route.ts`, `src/components/AuthForm.tsx`, `AuthNav.tsx`.
- Correo: `src/app/api/auth/send-email/route.ts`, `src/lib/email/auth-email.ts`.
- Envíos: `src/app/(catalog)/enviar`, `src/app/api/resources/route.ts`,
  `src/lib/resources.ts` (compartido con el alta del admin), `SubmitForm.tsx`.
- Votación: `src/app/api/resources/[id]/vote/route.ts`, `src/lib/votes.ts`,
  `src/components/VoteControl.tsx`.
- Exploración por filtros: `src/app/(catalog)/todo/page.tsx`,
  `ExploreFilters.tsx`, `getResourcesFiltered` en `src/lib/catalog.ts`. Las
  pestañas viejas (`CategoryTabs`) se reemplazaron por `SiteHeader.tsx`.
- Mis videos: `src/app/(catalog)/mis-videos/page.tsx`.
