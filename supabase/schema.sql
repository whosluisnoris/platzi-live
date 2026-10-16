-- Esquema completo de Platzi Live para un proyecto Supabase nuevo y propio.
-- Ejecutar una vez en el SQL Editor. Es idempotente.

-- Histórico de lives -----------------------------------------------------------
create table if not exists public.streams (
  id               uuid primary key default gen_random_uuid(),
  video_id         text unique not null,
  title            text not null,
  channel_title    text not null default 'Platzi',
  added_at         timestamptz not null default now(),
  published_at     timestamptz,
  live_started_at  timestamptz,
  live_ended_at    timestamptz,
  is_live          boolean not null default false,
  thumbnail_url    text,
  enriched_at      timestamptz,
  duration_seconds integer
);

alter table public.streams enable row level security;
drop policy if exists "streams_select_public" on public.streams;
create policy "streams_select_public" on public.streams for select using (true);

-- Analítica anónima ------------------------------------------------------------
create table if not exists public.watch_events (
  id          uuid primary key default gen_random_uuid(),
  video_id    text not null,
  event_type  text not null check (event_type in ('play', 'open_youtube', 'autoplay_default')),
  session_id  text,
  created_at  timestamptz not null default now()
);
create index if not exists watch_events_video_created_idx
  on public.watch_events (video_id, created_at);
alter table public.watch_events enable row level security; -- sin políticas: solo service role

create or replace view public.watch_stats with (security_invoker = true) as
select
  video_id,
  count(*) filter (where event_type = 'play')             as plays,
  count(*) filter (where event_type = 'autoplay_default') as autoplays,
  count(*) filter (where event_type = 'open_youtube')     as youtube_opens,
  count(distinct session_id)                              as unique_sessions,
  max(created_at)                                         as last_activity
from public.watch_events
group by video_id;

-- Encuesta de la plataforma ----------------------------------------------------
create table if not exists public.feedback_votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  text not null,
  answer       text not null check (answer in ('si', 'puede_mejorar', 'no')),
  session_id   text,
  comment      text check (comment is null or char_length(comment) <= 500),
  created_at   timestamptz not null default now(),
  unique (question_id, session_id)
);
create index if not exists feedback_votes_question_idx on public.feedback_votes (question_id);
alter table public.feedback_votes enable row level security; -- sin políticas: solo service role
