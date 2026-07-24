# Cuentas, envíos de la comunidad y votación — puesta en marcha

Esta funcionalidad añade: registro/login con confirmación por correo (Supabase
Auth + Resend), envíos de video por usuarios con detección de duplicados,
votación positiva/negativa, categorías de tecnología, exploración por filtros
(orden por más votados) y **roles** (owner/admin/user). Para que funcione en
producción hay que hacer estos pasos una sola vez.

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
2. **Verifica un dominio de envío** en Resend → Domains, agregando los registros DNS
   que te indique. En producción se usa el subdominio **`welcome.clusly.com`**.
   Mientras el dominio no esté verificado, `onboarding@resend.dev` solo entrega al
   correo dueño de la cuenta de Resend.
3. Crea una **API Key** (Resend → API Keys).

## 3. Variables de entorno en Vercel

En el proyecto de Vercel → Settings → Environment Variables, agrega:

| Nombre | Valor | Notas |
| --- | --- | --- |
| `RESEND_API_KEY` | la API key de Resend | **Esta es la key que preguntaste.** |
| `SEND_EMAIL_HOOK_SECRET` | el secreto del hook de Supabase (paso 4) | formato `v1,whsec_…` |
| `EMAIL_FROM` | `Clusly <no-reply@welcome.clusly.com>` | usa un buzón del dominio verificado; si no, Resend rechaza el envío (502) |
| `ADMIN_SECRET` | un secreto largo | respaldo programático de `/api/admin/*` y de `/api/live?debug=` (el panel usa el rol de sesión) |
| `NEXT_PUBLIC_SITE_URL` | `https://clusly.com` | opcional; fija el origen de los enlaces de correo (si falta, se resuelve por el host del hook) |

Ya deben existir (no las toques): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

> **Enlace de confirmación**: el correo apunta a `${origin}/auth/confirm?...`, y ese
> `origin` **no** sale de `email_data.site_url` del payload del hook (que es la URL de
> la API de Supabase, `…supabase.co/auth/v1`, y produciría un "No API key found"), sino
> que se resuelve en `send-email/route.ts` por orden de confianza: `NEXT_PUBLIC_SITE_URL`
> → host con el que Supabase llama al hook → origen del `redirect_to` → `site_url`.

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

## 6. Roles (owner / admin / user)

Aplica `supabase/migrations/0002_roles.sql` (columna `profiles.role`, revoca el
`UPDATE` de `role` a los clientes y asigna `owner` a la cuenta inicial).

- El acceso a **`/admin`** es por **rol de sesión**: `owner` y `admin` son staff
  (`isStaff()` en `src/lib/auth.ts`); el resto se redirige. Ya no hay contraseña en la
  página; las rutas `/api/admin/*` autorizan por la cookie de sesión (o `ADMIN_SECRET`
  como respaldo). En la barra aparece el enlace **Admin** solo para staff.
- Para **promover** a alguien (solo el owner/servidor puede): 
  ```sql
  update public.profiles p set role = 'admin'
  from auth.users u where u.id = p.id and u.email = 'correo@ejemplo.com';
  ```

---

### Resumen de piezas de código

- Sesión y roles: `src/lib/supabase/{client,server}.ts`, `src/proxy.ts` (antes
  "middleware", renombrado en Next 16), `src/lib/auth.ts` (`getCurrentUser`+`role`,
  `isStaff`), `src/lib/admin-auth.ts` (`authorizeAdmin`).
- Panel: `src/app/admin/page.tsx` (Server Component gateado por rol) +
  `src/components/admin/AdminDashboard.tsx` y los managers.
- Nav responsive: `src/components/SiteHeader.tsx`, `MobileMenu.tsx` (drawer).
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
