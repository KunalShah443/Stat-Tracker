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
    updateGame
} from '@/src/db/database';
import {
    getCareerStats,
    getMilestones,
    getSeasonStats,
    getStreaks,
    Milestone,
    Streak,
} from '@/src/db/queries';
import { useCallback, useState } from 'react';

/**
 * Hook for profile management
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const loadProfiles = useCallback(() => {
    const loaded = getAllProfiles();
    setProfiles(loaded);
    if (loaded.length > 0) {
      setProfile(loaded[0]);
    }
  }, []);

  const getOrCreateDefault = useCallback(() => {
    const p = getOrCreateDefaultProfile();
    setProfile(p);
    setProfiles([p, ...profiles]);
    return p;
  }, [profiles]);

  const createNewProfile = useCallback(
    (sport: string, position: string, name: string) => {
      const p = createProfile(sport, position, name);
      setProfile(p);
      setProfiles([p, ...profiles]);
      return p;
    },
    [profiles]
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

  const loadSeasons = useCallback((profileId: string) => {
    const loaded = getSeasonsByProfile(profileId);
    setSeasons(loaded);
    if (loaded.length > 0) {
      setCurrentSeason(loaded[0]);
    }
  }, []);

  const getOrCreateCurrent = useCallback((profileId: string) => {
    const season = getOrCreateCurrentSeason(profileId);
    setCurrentSeason(season);
    setSeasons((prev) => [season, ...prev.filter((s) => s.id !== season.id)]);
    return season;
  }, []);

  const createNewSeason = useCallback((profileId: string, year: number, team: string) => {
    const season = createSeason(profileId, year, team);
    setCurrentSeason(season);
    setSeasons((prev) => [season, ...prev]);
    return season;
  }, []);

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

  const loadGame = useCallback((gameId: string) => {
    const g = getGame(gameId);
    setGame(g);
    if (g) {
      const stats = getGameStats(gameId);
      setGameStats(stats);
    }
  }, []);

  const createNewGame = useCallback(
    (
      seasonId: string,
      gameDate: string,
      opponent: string,
      isPostseason?: boolean,
      week?: number,
      result?: string
    ) => {
      const g = createGame(seasonId, gameDate, opponent, isPostseason, week, result);
      setGame(g);
      setGameStats([]);
      return g;
    },
    []
  );

  const updateGameInfo = useCallback(
    (gameId: string, updates: Partial<Game>) => {
      updateGame(gameId, updates);
      if (game && game.id === gameId) {
        setGame({ ...game, ...updates });
      }
    },
    [game]
  );

  const setStat = useCallback((gameId: string, statKey: string, statValue: number) => {
    setGameStat(gameId, statKey, statValue);
    if (game && game.id === gameId) {
      const stats = getGameStats(gameId);
      setGameStats(stats);
    }
  }, [game]);

  const deleteStat = useCallback((gameId: string, statKey: string) => {
    deleteGameStat(gameId, statKey);
    if (game && game.id === gameId) {
      setGameStats((prev) => prev.filter((s) => s.stat_key !== statKey));
    }
  }, [game]);

  const deleteCurrentGame = useCallback(() => {
    if (game) {
      deleteGame(game.id);
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
  const [seasonStats, setSeasonStats] = useState<ReturnType<typeof getSeasonStats> | null>(null);
  const [careerStats, setCareerStats] = useState<ReturnType<typeof getCareerStats> | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);

  const loadSeasonStats = useCallback((seasonId: string) => {
    const stats = getSeasonStats(seasonId);
    setSeasonStats(stats);
  }, []);

  const loadCareerStats = useCallback((profileId: string) => {
    const stats = getCareerStats(profileId);
    setCareerStats(stats);
  }, []);

  const loadMilestones = useCallback((profileId: string) => {
    const ms = getMilestones(profileId);
    setMilestones(ms);
  }, []);

  const loadStreaks = useCallback((seasonId: string) => {
    const s = getStreaks(seasonId);
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
