export const SCHEMA_VERSION = 6;

/**
 * Notes:
 * - WAL mode improves performance for lots of small writes.
 * - foreign_keys ON ensures cascades work.
 * - We keep stats in a key/value table so adding new positions later is easy.
 */
export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- One profile for now (you), but allow multiple later.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  sport TEXT NOT NULL,          -- "madden"
  position TEXT NOT NULL,       -- "QB" (later RB/WR/LB/EDGE/CB)
  player_name TEXT NOT NULL,
  draft_round INTEGER,          -- e.g. 1
  draft_pick INTEGER,           -- e.g. 12
  team_name TEXT,               -- drafted/current team
  created_at TEXT NOT NULL
);

-- Seasons are by year: 2025, 2026, etc.
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  season_year INTEGER NOT NULL, -- e.g. 2025
  team_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Each game belongs to a season.
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT NOT NULL,
  game_date TEXT NOT NULL,      -- ISO string
  opponent TEXT NOT NULL,
  week INTEGER,                 -- optional
  is_postseason INTEGER NOT NULL DEFAULT 0, -- 0/1
  is_home INTEGER NOT NULL DEFAULT 1, -- 0/1
  is_starter INTEGER NOT NULL DEFAULT 1, -- 0/1 (did you start this game?)
  result TEXT,                  -- "W" | "L" | "T" | null
  team_score INTEGER,           -- optional (your team)
  opponent_score INTEGER,       -- optional
  note TEXT,                    -- optional freeform notes
  created_at TEXT NOT NULL,
  FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

-- Key/value stats per game (QB now, other positions later).
CREATE TABLE IF NOT EXISTS game_stats (
  id TEXT PRIMARY KEY NOT NULL,
  game_id TEXT NOT NULL,
  stat_key TEXT NOT NULL,       -- e.g. "pass_yds"
  stat_value REAL NOT NULL,
  FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- User-entered achievements (awards + league leaders), stored by year.
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- e.g. "award_mvp", "leader_pass_yds"
  year INTEGER NOT NULL,        -- e.g. 2026
  created_at TEXT NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, type, year)
);

CREATE INDEX IF NOT EXISTS idx_seasons_profile_id ON seasons(profile_id);
CREATE INDEX IF NOT EXISTS idx_games_season_id ON games(season_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_stat_key ON game_stats(stat_key);
CREATE INDEX IF NOT EXISTS idx_achievements_profile_id ON achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_achievements_profile_type_year ON achievements(profile_id, type, year);
`;
