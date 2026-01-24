import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';

export type { Achievement, Game, GameStat, Profile, Season } from './database';

import type { Achievement, Game, GameStat, Profile, Season } from './database';
import * as localDb from './database';

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function requireSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Not signed in');
  return data.session;
}

// Meta (used only for active_profile_id)
export const setActiveProfileId = async (
  profileId: string | null
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.setActiveProfileId(profileId);
  }

  const supabase = getSupabase();
  await requireSession();

  if (profileId === null) {
    const { error } = await supabase
      .from('meta')
      .delete()
      .eq('key', 'active_profile_id');
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('meta').upsert({
    key: 'active_profile_id',
    value: profileId,
  });

  if (error) throw error;
};

export const getActiveProfileId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getActiveProfileId();
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('meta')
    .select('value')
    .eq('key', 'active_profile_id')
    .maybeSingle();

  if (error) throw error;
  return data?.value ?? null;
};

export const getActiveProfile = async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getActiveProfile();
  }

  const activeId = await getActiveProfileId();
  if (!activeId) return null;
  return getProfile(activeId);
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
  if (!isSupabaseConfigured()) {
    return localDb.createProfile(
      sport,
      position,
      playerName,
      draftRound,
      draftPick,
      teamName
    );
  }

  const supabase = getSupabase();
  await requireSession();

  const id = makeId('profile');
  const created_at = nowIso();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      sport,
      position,
      player_name: playerName,
      draft_round: draftRound ?? null,
      draft_pick: draftPick ?? null,
      team_name: teamName ?? null,
      created_at,
    })
    .select('*')
    .single();

  if (error) throw error;
  await setActiveProfileId(id);
  return data as Profile;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getProfile(id);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getAllProfiles();
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Profile[]) ?? [];
};

export const getOrCreateDefaultProfile = async (): Promise<Profile> => {
  if (!isSupabaseConfigured()) {
    return localDb.getOrCreateDefaultProfile();
  }

  const activeProfile = await getActiveProfile();
  if (activeProfile) return activeProfile;

  const profiles = await getAllProfiles();
  if (profiles.length > 0) {
    await setActiveProfileId(profiles[0].id);
    return profiles[0];
  }

  return createProfile('madden', 'QB', 'You');
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.deleteProfile(profileId);
  }

  const supabase = getSupabase();
  await requireSession();

  const activeId = await getActiveProfileId();

  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw error;

  if (activeId === profileId) {
    await setActiveProfileId(null);
  }
};

// Season operations
export const createSeason = async (
  profileId: string,
  seasonYear: number,
  teamName: string
): Promise<Season> => {
  if (!isSupabaseConfigured()) {
    return localDb.createSeason(profileId, seasonYear, teamName);
  }

  const supabase = getSupabase();
  await requireSession();

  const id = makeId('season');
  const created_at = nowIso();

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      id,
      profile_id: profileId,
      season_year: seasonYear,
      team_name: teamName,
      created_at,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Season;
};

export const getSeason = async (id: string): Promise<Season | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getSeason(id);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Season | null) ?? null;
};

export const getSeasonsByProfile = async (
  profileId: string
): Promise<Season[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getSeasonsByProfile(profileId);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('profile_id', profileId)
    .order('season_year', { ascending: false });
  if (error) throw error;
  return (data as Season[]) ?? [];
};

export const updateSeason = async (
  seasonId: string,
  updates: Partial<Season>
): Promise<Season | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.updateSeason(seasonId, updates);
  }

  const supabase = getSupabase();
  await requireSession();

  const payload: Partial<Season> = {};
  if (updates.season_year !== undefined) payload.season_year = updates.season_year;
  if (updates.team_name !== undefined) payload.team_name = updates.team_name;

  if (Object.keys(payload).length === 0) return getSeason(seasonId);

  const { data, error } = await supabase
    .from('seasons')
    .update(payload)
    .eq('id', seasonId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return (data as Season | null) ?? null;
};

export const getOrCreateCurrentSeason = async (
  profileId: string
): Promise<Season> => {
  if (!isSupabaseConfigured()) {
    return localDb.getOrCreateCurrentSeason(profileId);
  }

  const currentYear = new Date().getFullYear();
  const seasons = await getSeasonsByProfile(profileId);
  const currentSeason = seasons.find((s) => s.season_year === currentYear);
  if (currentSeason) return currentSeason;

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
  result?: string,
  teamScore?: number,
  opponentScore?: number,
  note?: string,
  isHome?: boolean,
  isStarter?: boolean
): Promise<Game> => {
  if (!isSupabaseConfigured()) {
    return localDb.createGame(
      seasonId,
      gameDate,
      opponent,
      isPostseason,
      week,
      result,
      teamScore,
      opponentScore,
      note,
      isHome,
      isStarter
    );
  }

  const supabase = getSupabase();
  await requireSession();

  const id = makeId('game');
  const created_at = nowIso();

  const trimmedOpponent = opponent.trim();
  const trimmedNote = note?.trim() ? note.trim() : null;
  const homeFlag = isHome === undefined ? 1 : isHome ? 1 : 0;
  const starterFlag = isStarter === undefined ? 1 : isStarter ? 1 : 0;

  const { data, error } = await supabase
    .from('games')
    .insert({
      id,
      season_id: seasonId,
      game_date: gameDate,
      opponent: trimmedOpponent,
      week: week ?? null,
      is_postseason: isPostseason ? 1 : 0,
      is_home: homeFlag,
      is_starter: starterFlag,
      result: result ?? null,
      team_score: teamScore ?? null,
      opponent_score: opponentScore ?? null,
      note: trimmedNote,
      created_at,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Game;
};

export const getGame = async (id: string): Promise<Game | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getGame(id);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Game | null) ?? null;
};

export const getGamesBySeason = async (seasonId: string): Promise<Game[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getGamesBySeason(seasonId);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('season_id', seasonId)
    .order('game_date', { ascending: false });
  if (error) throw error;
  return (data as Game[]) ?? [];
};

export const getGamesBySeasonAndType = async (
  seasonId: string,
  isPostseason: boolean
): Promise<Game[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getGamesBySeasonAndType(seasonId, isPostseason);
  }

  const supabase = getSupabase();
  await requireSession();

  const postseasonFlag = isPostseason ? 1 : 0;
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('season_id', seasonId)
    .eq('is_postseason', postseasonFlag)
    .order('game_date', { ascending: false });
  if (error) throw error;
  return (data as Game[]) ?? [];
};

export const updateGame = async (
  gameId: string,
  updates: Partial<Game>
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.updateGame(gameId, updates);
  }

  const supabase = getSupabase();
  await requireSession();

  const allowedFields: (keyof Game)[] = [
    'opponent',
    'week',
    'result',
    'game_date',
    'is_postseason',
    'is_home',
    'is_starter',
    'team_score',
    'opponent_score',
    'note',
  ];

  const payload: Partial<Game> = {};
  for (const [key, value] of Object.entries(updates) as [keyof Game, any][]) {
    if (!allowedFields.includes(key)) continue;
    if (value === undefined) continue;
    (payload as any)[key] = value;
  }

  if (Object.keys(payload).length === 0) return;

  if (typeof payload.opponent === 'string') {
    payload.opponent = payload.opponent.trim();
  }

  if (typeof payload.note === 'string') {
    payload.note = payload.note.trim() ? payload.note.trim() : null;
  }

  if (typeof payload.is_postseason === 'boolean') {
    payload.is_postseason = payload.is_postseason ? 1 : 0;
  }

  if (typeof payload.is_home === 'boolean') {
    payload.is_home = payload.is_home ? 1 : 0;
  }

  if (typeof payload.is_starter === 'boolean') {
    payload.is_starter = payload.is_starter ? 1 : 0;
  }

  const { error } = await supabase.from('games').update(payload).eq('id', gameId);
  if (error) throw error;
};

export const deleteGame = async (gameId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.deleteGame(gameId);
  }

  const supabase = getSupabase();
  await requireSession();

  const { error } = await supabase.from('games').delete().eq('id', gameId);
  if (error) throw error;
};

// GameStat operations
export const setGameStat = async (
  gameId: string,
  statKey: string,
  statValue: number
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.setGameStat(gameId, statKey, statValue);
  }

  const supabase = getSupabase();
  await requireSession();

  // Keep behavior aligned with the SQLite version (so we don't accumulate duplicates if
  // there's already data in Supabase with different ids).
  const { error: deleteError } = await supabase
    .from('game_stats')
    .delete()
    .eq('game_id', gameId)
    .eq('stat_key', statKey);
  if (deleteError) throw deleteError;

  const id = makeId('stat');
  const { error: insertError } = await supabase.from('game_stats').insert({
    id,
    game_id: gameId,
    stat_key: statKey,
    stat_value: statValue,
  });

  if (insertError) throw insertError;
};

export const getGameStats = async (gameId: string): Promise<GameStat[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getGameStats(gameId);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('game_id', gameId);
  if (error) throw error;
  return (data as GameStat[]) ?? [];
};

export const getGameStatByKey = async (
  gameId: string,
  statKey: string
): Promise<GameStat | null> => {
  if (!isSupabaseConfigured()) {
    return localDb.getGameStatByKey(gameId, statKey);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('game_id', gameId)
    .eq('stat_key', statKey)
    .maybeSingle();
  if (error) throw error;
  return (data as GameStat | null) ?? null;
};

export const deleteGameStat = async (
  gameId: string,
  statKey: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.deleteGameStat(gameId, statKey);
  }

  const supabase = getSupabase();
  await requireSession();

  const { error } = await supabase
    .from('game_stats')
    .delete()
    .eq('game_id', gameId)
    .eq('stat_key', statKey);
  if (error) throw error;
};

export const getStatsForSeason = async (
  seasonId: string,
  statKey: string
): Promise<GameStat[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getStatsForSeason(seasonId, statKey);
  }

  const games = await getGamesBySeason(seasonId);
  const ids = games.map((g) => g.id);
  if (ids.length === 0) return [];

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .in('game_id', ids)
    .eq('stat_key', statKey);
  if (error) throw error;
  return (data as GameStat[]) ?? [];
};

// Achievement operations
export const createAchievement = async (
  profileId: string,
  type: string,
  year: number
): Promise<Achievement> => {
  if (!isSupabaseConfigured()) {
    return localDb.createAchievement(profileId, type, year);
  }

  const supabase = getSupabase();
  await requireSession();

  const id = makeId('ach');
  const created_at = nowIso();

  const { error } = await supabase.from('achievements').upsert(
    {
      id,
      profile_id: profileId,
      type,
      year,
      created_at,
    },
    {
      onConflict: 'profile_id,type,year',
      ignoreDuplicates: true,
    }
  );

  if (error) throw error;

  const { data, error: selectError } = await supabase
    .from('achievements')
    .select('*')
    .eq('profile_id', profileId)
    .eq('type', type)
    .eq('year', year)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!data) {
    throw new Error('Failed to create achievement');
  }
  return data as Achievement;
};

export const getAchievementsByProfile = async (
  profileId: string
): Promise<Achievement[]> => {
  if (!isSupabaseConfigured()) {
    return localDb.getAchievementsByProfile(profileId);
  }

  const supabase = getSupabase();
  await requireSession();

  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('profile_id', profileId)
    .order('year', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as Achievement[]) ?? [];
};

export const deleteAchievement = async (
  profileId: string,
  type: string,
  year: number
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localDb.deleteAchievement(profileId, type, year);
  }

  const supabase = getSupabase();
  await requireSession();

  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('profile_id', profileId)
    .eq('type', type)
    .eq('year', year);
  if (error) throw error;
};
