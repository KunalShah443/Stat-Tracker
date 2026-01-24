import {
  createGame,
  createProfile,
  createSeason,
  deleteGame,
  deleteGameStat,
  Game,
  GameStat,
  getAllProfiles,
  getGame,
  getGameStats,
  getOrCreateCurrentSeason,
  getOrCreateDefaultProfile,
  getSeasonsByProfile,
  Profile,
  Season,
  setGameStat,
  updateGame,
} from '@/src/db/supabaseDatabase';
import {
  CareerStats,
  getCareerStats,
  getMilestones,
  getSeasonStats,
  getStreaks,
  Milestone,
  SeasonStats,
  Streak,
} from '@/src/db/queries';
import { useCallback, useState } from 'react';

/**
 * Hook for profile management
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const loadProfiles = useCallback(async () => {
    const loaded = await getAllProfiles();
    setProfiles(loaded);
    if (loaded.length > 0) {
      setProfile(loaded[0]);
    }
    return loaded;
  }, []);

  const getOrCreateDefault = useCallback(async () => {
    const p = await getOrCreateDefaultProfile();
    setProfile(p);
    setProfiles((prev) => [p, ...prev.filter((existing) => existing.id !== p.id)]);
    return p;
  }, []);

  const createNewProfile = useCallback(
    async (
      sport: string,
      position: string,
      name: string,
      draftRound?: number | null,
      draftPick?: number | null,
      teamName?: string | null
    ) => {
      const p = await createProfile(
        sport,
        position,
        name,
        draftRound,
        draftPick,
        teamName
      );
      setProfile(p);
      setProfiles((prev) => [p, ...prev]);
      return p;
    },
    []
  );

  return {
    profile,
    profiles,
    loadProfiles,
    getOrCreateDefault,
    createNewProfile,
  };
};

/**
 * Hook for season management
 */
export const useSeason = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);

  const loadSeasons = useCallback(async (profileId: string) => {
    const loaded = await getSeasonsByProfile(profileId);
    setSeasons(loaded);
    if (loaded.length > 0) {
      setCurrentSeason(loaded[0]);
    }
    return loaded;
  }, []);

  const getOrCreateCurrent = useCallback(async (profileId: string) => {
    const season = await getOrCreateCurrentSeason(profileId);
    setCurrentSeason(season);
    setSeasons((prev) => [season, ...prev.filter((s) => s.id !== season.id)]);
    return season;
  }, []);

  const createNewSeason = useCallback(
    async (profileId: string, year: number, team: string) => {
      const season = await createSeason(profileId, year, team);
      setCurrentSeason(season);
      setSeasons((prev) => [season, ...prev]);
      return season;
    },
    []
  );

  const selectSeason = useCallback((season: Season) => {
    setCurrentSeason(season);
    setSeasons((prev) => [season, ...prev.filter((s) => s.id !== season.id)]);
  }, []);

  return {
    seasons,
    currentSeason,
    loadSeasons,
    getOrCreateCurrent,
    createNewSeason,
    selectSeason,
  };
};

/**
 * Hook for game management
 */
export const useGame = () => {
  const [game, setGame] = useState<Game | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);

  const loadGame = useCallback(async (gameId: string) => {
    const g = await getGame(gameId);
    setGame(g);
    if (g) {
      const stats = await getGameStats(gameId);
      setGameStats(stats);
    } else {
      setGameStats([]);
    }
  }, []);

  const createNewGame = useCallback(
    async (
      seasonId: string,
      gameDate: string,
      opponent: string,
      isPostseason?: boolean,
      week?: number,
      result?: string,
      teamScore?: number,
      opponentScore?: number,
      note?: string,
      isHome?: boolean,
      isStarter?: boolean
    ) => {
      const g = await createGame(
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
      setGame(g);
      setGameStats([]);
      return g;
    },
    []
  );

  const updateGameInfo = useCallback(async (gameId: string, updates: Partial<Game>) => {
    await updateGame(gameId, updates);
    setGame((prev) => (prev && prev.id === gameId ? { ...prev, ...updates } : prev));
  }, []);

  const setStat = useCallback(
    async (gameId: string, statKey: string, statValue: number) => {
      await setGameStat(gameId, statKey, statValue);
      if (game && game.id === gameId) {
        const stats = await getGameStats(gameId);
        setGameStats(stats);
      }
    },
    [game]
  );

  const deleteStat = useCallback(async (gameId: string, statKey: string) => {
    await deleteGameStat(gameId, statKey);
    if (game && game.id === gameId) {
      setGameStats((prev) => prev.filter((s) => s.stat_key !== statKey));
    }
  }, [game]);

  const deleteCurrentGame = useCallback(async () => {
    if (game) {
      await deleteGame(game.id);
      setGame(null);
      setGameStats([]);
    }
  }, [game]);

  return {
    game,
    gameStats,
    loadGame,
    createNewGame,
    updateGameInfo,
    setStat,
    deleteStat,
    deleteCurrentGame,
  };
};

/**
 * Hook for stats calculation and milestones
 */
export const useStats = () => {
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);

  const loadSeasonStats = useCallback(async (seasonId: string) => {
    const stats = await getSeasonStats(seasonId);
    setSeasonStats(stats);
  }, []);

  const loadCareerStats = useCallback(async (profileId: string) => {
    const stats = await getCareerStats(profileId);
    setCareerStats(stats);
  }, []);

  const loadMilestones = useCallback(async (profileId: string) => {
    const ms = await getMilestones(profileId);
    setMilestones(ms);
  }, []);

  const loadStreaks = useCallback(async (seasonId: string) => {
    const s = await getStreaks(seasonId);
    setStreaks(s);
  }, []);

  return {
    seasonStats,
    careerStats,
    milestones,
    streaks,
    loadSeasonStats,
    loadCareerStats,
    loadMilestones,
    loadStreaks,
  };
};
