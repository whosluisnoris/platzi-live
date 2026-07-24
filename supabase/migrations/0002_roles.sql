-- Clusly — roles de usuario (owner / admin / user)
-- Migración aditiva y reversible. Segura sobre datos existentes: las filas
-- actuales de `profiles` quedan con role='user' por defecto.

-- 1. Columna role en profiles ------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('owner', 'admin', 'user'));

-- 2. Evitar auto-escalada de privilegios ------------------------------------
-- La política "profiles self update" deja que un usuario edite su propia fila
-- (p. ej. display_name). Sin esto, también podría cambiarse el role a 'owner'.
-- Se revoca el UPDATE de la columna role a los clientes: solo el service role
-- (servidor, vía getSupabaseAdmin) puede cambiar roles.
revoke update (role) on public.profiles from anon, authenticated;

-- 3. Owner inicial -----------------------------------------------------------
update public.profiles p
set role = 'owner'
from auth.users u
where u.id = p.id
  and u.email = 'norisgarcialuis@gmail.com';
