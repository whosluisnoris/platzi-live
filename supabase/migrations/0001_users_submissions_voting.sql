-- Clusly — cuentas de usuario, envíos de la comunidad y votación
-- Migración aditiva y reversible. Segura de correr sobre datos existentes:
-- las filas actuales de `resources` quedan con status='published' por defecto.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

-- 1. Nuevas columnas en resources -------------------------------------------
alter table public.resources
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'published' check (status in ('published','hidden')),
  add column if not exists vote_count integer not null default 0;

create index if not exists idx_resources_vote_count on public.resources (vote_count desc);
create index if not exists idx_resources_submitted_by on public.resources (submitted_by);

-- 2. profiles (se crea automáticamente al registrarse) ----------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. resource_votes (un voto por usuario por recurso; +1 / -1) --------------
create table if not exists public.resource_votes (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);
alter table public.resource_votes enable row level security;
-- Sin políticas públicas: todo el acceso pasa por el cliente service-role
-- después de verificar la sesión en el servidor.

-- 4. Mantener resources.vote_count sincronizado con la suma de votos --------
create or replace function public.sync_resource_vote_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.resources set vote_count = vote_count + new.value where id = new.resource_id;
  elsif (tg_op = 'DELETE') then
    update public.resources set vote_count = vote_count - old.value where id = old.resource_id;
  elsif (tg_op = 'UPDATE') then
    update public.resources set vote_count = vote_count - old.value + new.value where id = new.resource_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_vote_count on public.resource_votes;
create trigger trg_sync_vote_count after insert or update or delete on public.resource_votes
  for each row execute function public.sync_resource_vote_count();

-- 5. El catálogo público solo ve recursos publicados ------------------------
-- (los ocultos siguen visibles para el admin vía service role)
alter policy "public read" on public.resources using (status = 'published');

-- 6. Categorías de tecnología ----------------------------------------------
-- Upsert por slug: crea las nuevas y reordena/recolorea IA, Agentes y Datos.
insert into public.categories (slug, name, description, sort_order, is_active, color) values
  ('tecnologia',     'Tecnología',     'Fundamentos y novedades de tecnología',            1,  true, '#2563EB'),
  ('programacion',   'Programación',   'Lenguajes, algoritmos y buenas prácticas',         2,  true, '#7C3AED'),
  ('web',            'Web',            'Frontend, backend y todo lo del navegador',        3,  true, '#0EA5E9'),
  ('ia',             'IA',             'Inteligencia artificial y machine learning',       4,  true, '#EC4899'),
  ('agentes',        'Agentes',        'Agentes autónomos y orquestación de LLMs',         5,  true, '#F97316'),
  ('datos',          'Datos',          'Ingeniería y análisis de datos',                   6,  true, '#10B981'),
  ('diseno',         'Diseño',         'UI, UX y diseño de producto',                      7,  true, '#F43F5E'),
  ('producto',       'Producto',       'Gestión y estrategia de producto',                 8,  true, '#EAB308'),
  ('devops',         'DevOps',         'Infraestructura, CI/CD y nube',                    9,  true, '#64748B'),
  ('ciberseguridad', 'Ciberseguridad', 'Seguridad ofensiva y defensiva',                  10,  true, '#DC2626'),
  ('movil',          'Móvil',          'Desarrollo iOS, Android y multiplataforma',       11,  true, '#14B8A6'),
  ('carrera',        'Carrera',        'Empleo, soft skills y crecimiento profesional',   12,  true, '#8B5CF6')
on conflict (slug) do update set
  name       = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active  = true,
  color      = excluded.color;

-- 7. Endurecer las funciones de trigger --------------------------------------
-- Por defecto Postgres concede EXECUTE a PUBLIC. Las funciones de trigger no
-- deben ser invocables por RPC; revocarlo no afecta su ejecución vía trigger
-- (corren como el owner).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.sync_resource_vote_count() from public;
