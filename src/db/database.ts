import { SQLiteDatabase } from 'expo-sqlite';

import { getDb, initDb } from './db';

// Database instance override (useful for tests).
let dbOverride: SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbOverride) return dbOverride;

  await initDb();
  return getDb();
};

export const setDatabase = (database: SQLiteDatabase | null): void => {
  dbOverride = database;
};

// Types
export interface Profile {
  id: string;
  sport: string;
  position: string;
  player_name: string;
  draft_round: number | null;
  draft_pick: number | null;
  team_name: string | null;
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

export const setActiveProfileId = async (
  profileId: string | null
): Promise<void> => {
  const database = await getDatabase();
  if (profileId === null) {
    await database.runAsync('DELETE FROM meta WHERE key = ?', [
      'active_profile_id',
    ]);
    return;
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    ['active_profile_id', profileId]
  );
};

export const getActiveProfileId = async (): Promise<string | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['active_profile_id']
  );
  return row?.value ?? null;
};

export const getActiveProfile = async (): Promise<Profile | null> => {
  const activeId = await getActiveProfileId();
  if (!activeId) return null;
  return getProfile(activeId);
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  const database = await getDatabase();
  const activeId = await getActiveProfileId();
  await database.runAsync('DELETE FROM profiles WHERE id = ?', [profileId]);
  if (activeId === profileId) {
    await setActiveProfileId(null);
  }
};

// Profile operations
export const createProfile = async (
  sport: string,
  position: string,
  playerName: string,
  draftRound?: number | null,
  draftPick?: number | null,
  teamName?: string | null
): Promise<Profile> => {
  const database = await getDatabase();
  const id = `profile_${Date.now()}`;
  const now = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO profiles (id, sport, position, player_name, draft_round, draft_pick, team_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      sport,
      position,
      playerName,
      draftRound ?? null,
      draftPick ?? null,
      teamName ?? null,
      now,
    ]
  );

  await setActiveProfileId(id);

  return {
    id,
    sport,
    position,
    player_name: playerName,
    draft_round: draftRound ?? null,
    draft_pick: draftPick ?? null,
    team_name: teamName ?? null,
    created_at: now,
  };
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const database = await getDatabase();
  return (
    (await database.getFirstAsync<Profile>('SELECT * FROM profiles WHERE id = ?', [
      id,
    ])) || null
  );
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const database = await getDatabase();
  return (
    (await database.getAllAsync<Profile>(
      'SELECT * FROM profiles ORDER BY created_at DESC'
    )) || []
  );
};

export const getOrCreateDefaultProfile = async (): Promise<Profile> => {
  const activeProfile = await getActiveProfile();
  if (activeProfile) return activeProfile;

  const profiles = await getAllProfiles();
  if (profiles.length > 0) {
    await setActiveProfileId(profiles[0].id);
    return profiles[0];
  }

  return createProfile('madden', 'QB', 'You');
};

// Season operations
export const createSeason = async (
  profileId: string,
  seasonYear: number,
  teamName: string
): Promise<Season> => {
  const database = await getDatabase();
  const id = `season_${Date.now()}`;
  const now = new Date().toISOString();

  await database.runAsync(
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

export const getSeason = async (id: string): Promise<Season | null> => {
  const database = await getDatabase();
  return (
    (await database.getFirstAsync<Season>('SELECT * FROM seasons WHERE id = ?', [
      id,
    ])) || null
  );
};

export const getSeasonsByProfile = async (
  profileId: string
): Promise<Season[]> => {
  const database = await getDatabase();
  return (
    (await database.getAllAsync<Season>(
      'SELECT * FROM seasons WHERE profile_id = ? ORDER BY season_year DESC',
      [profileId]
    )) || []
  );
};

export const updateSeason = async (
  seasonId: string,
  updates: Partial<Season>
): Promise<Season | null> => {
  const database = await getDatabase();
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
  await database.runAsync(sql, values);

  return getSeason(seasonId);
};

export const getOrCreateCurrentSeason = async (
  profileId: string
): Promise<Season> => {
  const currentYear = new Date().getFullYear();
  const seasons = await getSeasonsByProfile(profileId);
  const currentSeason = seasons.find((s) => s.season_year === currentYear);

  if (currentSeason) return currentSeason;

  // Create a new season for current year
  const profile = await getProfile(profileId);
  const defaultTeam = profile?.team_name ?? 'TBD';
  return createSeason(profileId, currentYear, defaultTeam);
};

// Game operations
export const createGame = async (
  seasonId: string,
  gameDate: string,
  opponent: string,
  isPostseason: boolean = false,
  week?: number,
  result?: string
): Promise<Game> => {
  const database = await getDatabase();
  const id = `game_${Date.now()}`;
  const now = new Date().toISOString();

  await database.runAsync(
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

export const getGame = async (id: string): Promise<Game | null> => {
  const database = await getDatabase();
  return (
    (await database.getFirstAsync<Game>('SELECT * FROM games WHERE id = ?', [
      id,
    ])) || null
  );
};

export const getGamesBySeason = async (seasonId: string): Promise<Game[]> => {
  const database = await getDatabase();
  return (
    (await database.getAllAsync<Game>(
      'SELECT * FROM games WHERE season_id = ? ORDER BY game_date DESC',
      [seasonId]
    )) || []
  );
};

export const getGamesBySeasonAndType = async (
  seasonId: string,
  isPostseason: boolean
): Promise<Game[]> => {
  const database = await getDatabase();
  const postseasonFlag = isPostseason ? 1 : 0;
  return (
    (await database.getAllAsync<Game>(
      'SELECT * FROM games WHERE season_id = ? AND is_postseason = ? ORDER BY game_date DESC',
      [seasonId, postseasonFlag]
    )) || []
  );
};

export const updateGame = async (
  gameId: string,
  updates: Partial<Game>
): Promise<void> => {
  const database = await getDatabase();
  const allowedFields = [
    'opponent',
    'week',
    'result',
    'game_date',
    'is_postseason',
  ];
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
  await database.runAsync(sql, values);
};

export const deleteGame = async (gameId: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM games WHERE id = ?', [gameId]);
};

// GameStat operations
export const setGameStat = async (
  gameId: string,
  statKey: string,
  statValue: number
): Promise<void> => {
  const database = await getDatabase();
  const id = `stat_${Date.now()}_${Math.random()}`;

  // Delete existing stat if it exists
  await database.runAsync(
    'DELETE FROM game_stats WHERE game_id = ? AND stat_key = ?',
    [gameId, statKey]
  );

  // Insert new stat
  await database.runAsync(
    'INSERT INTO game_stats (id, game_id, stat_key, stat_value) VALUES (?, ?, ?, ?)',
    [id, gameId, statKey, statValue]
  );
};

export const getGameStats = async (gameId: string): Promise<GameStat[]> => {
  const database = await getDatabase();
  return (
    (await database.getAllAsync<GameStat>(
      'SELECT * FROM game_stats WHERE game_id = ?',
      [gameId]
    )) || []
  );
};

export const getGameStatByKey = async (
  gameId: string,
  statKey: string
): Promise<GameStat | null> => {
  const database = await getDatabase();
  return (
    (await database.getFirstAsync<GameStat>(
      'SELECT * FROM game_stats WHERE game_id = ? AND stat_key = ?',
      [gameId, statKey]
    )) || null
  );
};

export const deleteGameStat = async (
  gameId: string,
  statKey: string
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM game_stats WHERE game_id = ? AND stat_key = ?',
    [gameId, statKey]
  );
};

export const getStatsForSeason = async (
  seasonId: string,
  statKey: string
): Promise<GameStat[]> => {
  const database = await getDatabase();
  return (
    (await database.getAllAsync<GameStat>(
      `SELECT gs.* FROM game_stats gs
       JOIN games g ON gs.game_id = g.id
       WHERE g.season_id = ? AND gs.stat_key = ?`,
      [seasonId, statKey]
    )) || []
  );
};
