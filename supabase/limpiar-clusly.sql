-- Limpia del proyecto Supabase TODO lo que pertenece a Clusly (catálogo, cuentas,
-- votos, guardados, opiniones, blog) y deja intacto Platzi Live:
--   public.streams, public.watch_events, public.watch_stats, public.feedback_votes
--
-- Cómo usarlo: pegarlo en Supabase → SQL Editor. Corre todo dentro de UNA
-- transacción; si algo falla, no se borra nada. Antes de ejecutarlo, haz un
-- respaldo (Database → Backups) o exporta `streams`.

begin;

-- 0. Guardia: aborta si falta la tabla de lives (no debería pasar) -------------
do $$
begin
  if to_regclass('public.streams') is null then
    raise exception 'No existe public.streams: se aborta para no borrar nada';
  end if;
  raise notice 'Lives guardados (se conservan): %', (select count(*) from public.streams);
end $$;

-- 1. Trigger y funciones de cuentas/votos -----------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.sync_resource_vote_count() cascade;

-- 2. Tablas de Clusly (solo las listadas; CASCADE quita sus políticas, índices,
--    triggers y llaves foráneas entre ellas) ----------------------------------------
drop table if exists public.resource_votes     cascade;
drop table if exists public.resource_favorites cascade;
drop table if exists public.resource_categories cascade;
drop table if exists public.playlist_items     cascade;
drop table if exists public.site_feedback      cascade;
drop table if exists public.blog_posts         cascade;
drop table if exists public.resources          cascade;
drop table if exists public.categories         cascade;
drop table if exists public.profiles           cascade;

-- 3. Comprobación: Platzi Live sigue completo --------------------------------------
do $$
begin
  if to_regclass('public.streams') is null
     or to_regclass('public.watch_events') is null
     or to_regclass('public.watch_stats') is null
     or to_regclass('public.feedback_votes') is null then
    raise exception 'Falta una tabla de Platzi Live: se revierte todo';
  end if;
  raise notice 'OK. Lives: %, eventos: %',
    (select count(*) from public.streams), (select count(*) from public.watch_events);
end $$;

commit;

-- ======================= PASOS OPCIONALES (corre aparte) ===========================

-- A. Eventos de analítica que no son de Platzi Live (reproducciones del catálogo).
--    Primero mira cuántos son:
--   select count(*) from public.watch_events
--   where video_id not in (select video_id from public.streams) and video_id <> 'tRsQsTMvPNg';
--    Este script NO borra nada de watch_events: si decides limpiar esos eventos,
--    hazlo a mano y después de respaldar la tabla.

-- B. Cuentas de usuario de Clusly (Auth). Platzi Live no usa cuentas.
--    Mejor bórralas desde Authentication → Users, o:
--   delete from auth.users;
