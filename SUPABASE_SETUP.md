# Supabase Setup (Cloud Game Logs)

This app can use Supabase as the source of truth for profiles/seasons/games/stats.

## 1) Create a Supabase project

- Create a new project in Supabase.
- In **Auth**:
  - Create your user (email + password).
  - Disable public sign-ups (so only you can log in).

## 2) Create tables

Copy/paste this entire SQL script into the Supabase SQL editor. It's safe to run multiple times (it will create missing tables/columns/indexes and re-apply permissions):

```sql
-- Stat-Tracker full schema (safe to re-run)

create table if not exists public.meta (
  key text primary key,
  value text not null
);

create table if not exists public.profiles (
  id text primary key,
  sport text not null,
  position text not null,
  player_name text not null,
  draft_round integer,
  draft_pick integer,
  team_name text,
  created_at text not null
);

create table if not exists public.seasons (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  season_year integer not null,
  team_name text not null,
  created_at text not null
);

create table if not exists public.games (
  id text primary key,
  season_id text not null references public.seasons(id) on delete cascade,
  game_date text not null,
  opponent text not null,
  week integer,
  is_postseason integer not null default 0,
  is_home integer not null default 1,
  is_starter integer not null default 1,
  result text,
  team_score integer,
  opponent_score integer,
  note text,
  created_at text not null
);

create table if not exists public.game_stats (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  stat_key text not null,
  stat_value double precision not null
);

create table if not exists public.achievements (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  type text not null,
  year integer not null,
  created_at text not null,
  unique (profile_id, type, year)
);

-- Catch-up migrations for older installs (idempotent).
alter table public.games
  add column if not exists is_postseason integer not null default 0,
  add column if not exists is_home integer not null default 1,
  add column if not exists is_starter integer not null default 1,
  add column if not exists team_score integer,
  add column if not exists opponent_score integer,
  add column if not exists note text;

create index if not exists idx_seasons_profile_id on public.seasons(profile_id);
create index if not exists idx_games_season_id on public.games(season_id);
create index if not exists idx_game_stats_game_id on public.game_stats(game_id);
create index if not exists idx_game_stats_stat_key on public.game_stats(stat_key);
create index if not exists idx_achievements_profile_id on public.achievements(profile_id);
create unique index if not exists uidx_achievements_profile_type_year
  on public.achievements(profile_id, type, year);

-- Lock down access (recommended for private use)
revoke all on table public.meta from anon;
revoke all on table public.profiles from anon;
revoke all on table public.seasons from anon;
revoke all on table public.games from anon;
revoke all on table public.game_stats from anon;
revoke all on table public.achievements from anon;

grant all on table public.meta to authenticated;
grant all on table public.profiles to authenticated;
grant all on table public.seasons to authenticated;
grant all on table public.games to authenticated;
grant all on table public.game_stats to authenticated;
grant all on table public.achievements to authenticated;

-- Supabase/PostgREST caches schema; reload it so new columns are visible immediately.
notify pgrst, 'reload schema';
```

## 3) Configure environment variables

Create a local `.env` (not committed) and add:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

On Vercel, add the same variables in **Project Settings -> Environment Variables** (Production + Preview).

## 4) Use the app

- Open the site
- Sign in on the home screen
- Create/continue player and add game logs
