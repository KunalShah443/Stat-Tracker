import { SQLiteDatabase, openDatabaseSync } from 'expo-sqlite';

// Database instance - initialized via initDb() in app startup
let db: SQLiteDatabase | null = null;

export const getDatabase = (): SQLiteDatabase => {
  if (db) return db;

  // DB must be initialized via initDb() from _layout.tsx first
  // This lazy getter ensures we have a reference if needed
  db = openDatabaseSync('stat-tracker.db');
  return db;
};

export const setDatabase = (database: SQLiteDatabase): void => {
  db = database;
};

// Types
export interface Profile {
  id: string;
  sport: string;
  position: string;
  player_name: string;
  created_at: string;
}

export interface Season {
  id: string;
  profile_id: string;
  season_year: number;
  team_name: string;
  created_at: string;
}

export interface Game {
  id: string;
  season_id: string;
  game_date: string;
  opponent: string;
  week: number | null;
  is_postseason: number;
  result: string | null;
  created_at: string;
}

export interface GameStat {
  id: string;
  game_id: string;
  stat_key: string;
  stat_value: number;
}

// Profile operations
export const createProfile = (
  sport: string,
  position: string,
  playerName: string
): Profile => {
  const database = getDatabase();
  const id = `profile_${Date.now()}`;
  const now = new Date().toISOString();

  database.runSync(
    'INSERT INTO profiles (id, sport, position, player_name, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, sport, position, playerName, now]
  );

  return {
    id,
    sport,
    position,
    player_name: playerName,
    created_at: now,
  };
};

export const getProfile = (id: string): Profile | null => {
  const database = getDatabase();
  return database.getFirstSync('SELECT * FROM profiles WHERE id = ?', [id]) || null;
};

export const getAllProfiles = (): Profile[] => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM profiles ORDER BY created_at DESC') || [];
};

export const getOrCreateDefaultProfile = (): Profile => {
  const profiles = getAllProfiles();
  if (profiles.length > 0) return profiles[0];

  return createProfile('madden', 'QB', 'You');
};

// Season operations
export const createSeason = (profileId: string, seasonYear: number, teamName: string): Season => {
  const database = getDatabase();
  const id = `season_${Date.now()}`;
  const now = new Date().toISOString();

  database.runSync(
    'INSERT INTO seasons (id, profile_id, season_year, team_name, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, profileId, seasonYear, teamName, now]
  );

  return {
    id,
    profile_id: profileId,
    season_year: seasonYear,
    team_name: teamName,
    created_at: now,
  };
};

export const getSeason = (id: string): Season | null => {
  const database = getDatabase();
  return database.getFirstSync('SELECT * FROM seasons WHERE id = ?', [id]) || null;
};

export const getSeasonsByProfile = (profileId: string): Season[] => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM seasons WHERE profile_id = ? ORDER BY season_year DESC', [profileId]) || [];
};

export const updateSeason = (seasonId: string, updates: Partial<Season>): Season | null => {
  const database = getDatabase();
  const allowedFields = ['season_year', 'team_name'];
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push((value as string | number | null) ?? null);
    }
  });

  if (setClauses.length === 0) return getSeason(seasonId);

  values.push(seasonId);
  const sql = `UPDATE seasons SET ${setClauses.join(', ')} WHERE id = ?`;
  database.runSync(sql, values);

  return getSeason(seasonId);
};

export const getOrCreateCurrentSeason = (profileId: string): Season => {
  const currentYear = new Date().getFullYear();
  const seasons = getSeasonsByProfile(profileId);
  const currentSeason = seasons.find((s) => s.season_year === currentYear);

  if (currentSeason) return currentSeason;

  // Create a new season for current year
  return createSeason(profileId, currentYear, 'TBD');
};

// Game operations
export const createGame = (
  seasonId: string,
  gameDate: string,
  opponent: string,
  isPostseason: boolean = false,
  week?: number,
  result?: string
): Game => {
  const database = getDatabase();
  const id = `game_${Date.now()}`;
  const now = new Date().toISOString();

  database.runSync(
    'INSERT INTO games (id, season_id, game_date, opponent, week, is_postseason, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, seasonId, gameDate, opponent, week || null, isPostseason ? 1 : 0, result || null, now]
  );

  return {
    id,
    season_id: seasonId,
    game_date: gameDate,
    opponent,
    week: week || null,
    is_postseason: isPostseason ? 1 : 0,
    result: result || null,
    created_at: now,
  };
};

export const getGame = (id: string): Game | null => {
  const database = getDatabase();
  return database.getFirstSync('SELECT * FROM games WHERE id = ?', [id]) || null;
};

export const getGamesBySeason = (seasonId: string): Game[] => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM games WHERE season_id = ? ORDER BY game_date DESC', [seasonId]) || [];
};

export const getGamesBySeasonAndType = (
  seasonId: string,
  isPostseason: boolean
): Game[] => {
  const database = getDatabase();
  const postseasonFlag = isPostseason ? 1 : 0;
  return (
    database.getAllSync(
      'SELECT * FROM games WHERE season_id = ? AND is_postseason = ? ORDER BY game_date DESC',
      [seasonId, postseasonFlag]
    ) || []
  );
};

export const updateGame = (gameId: string, updates: Partial<Game>): void => {
  const database = getDatabase();
  const allowedFields = ['opponent', 'week', 'result', 'game_date', 'is_postseason'];
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = ?`);
      if (key === 'is_postseason' && typeof value === 'boolean') {
        values.push(value ? 1 : 0);
      } else {
        values.push((value as string | number | null) ?? null);
      }
    }
  });

  if (setClauses.length === 0) return;

  values.push(gameId);
  const sql = `UPDATE games SET ${setClauses.join(', ')} WHERE id = ?`;
  database.runSync(sql, values);
};

export const deleteGame = (gameId: string): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM games WHERE id = ?', [gameId]);
};

// GameStat operations
export const setGameStat = (gameId: string, statKey: string, statValue: number): void => {
  const database = getDatabase();
  const id = `stat_${Date.now()}_${Math.random()}`;

  // Delete existing stat if it exists
  database.runSync('DELETE FROM game_stats WHERE game_id = ? AND stat_key = ?', [gameId, statKey]);

  // Insert new stat
  database.runSync(
    'INSERT INTO game_stats (id, game_id, stat_key, stat_value) VALUES (?, ?, ?, ?)',
    [id, gameId, statKey, statValue]
  );
};

export const getGameStats = (gameId: string): GameStat[] => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM game_stats WHERE game_id = ?', [gameId]) || [];
};

export const getGameStatByKey = (gameId: string, statKey: string): GameStat | null => {
  const database = getDatabase();
  return database.getFirstSync('SELECT * FROM game_stats WHERE game_id = ? AND stat_key = ?', [gameId, statKey]) || null;
};

export const deleteGameStat = (gameId: string, statKey: string): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM game_stats WHERE game_id = ? AND stat_key = ?', [gameId, statKey]);
};

export const getStatsForSeason = (seasonId: string, statKey: string): GameStat[] => {
  const database = getDatabase();
  return (
    database.getAllSync(
      `SELECT gs.* FROM game_stats gs
       JOIN games g ON gs.game_id = g.id
       WHERE g.season_id = ? AND gs.stat_key = ?`,
      [seasonId, statKey]
    ) || []
  );
};
