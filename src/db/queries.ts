import {
    getGamesBySeason,
    getGamesBySeasonAndType,
    getGameStats,
    getSeason,
    getSeasonsByProfile
} from './database';

export interface StatAggregate {
  total: number;
  average: number;
  count: number;
  games: number;
}

export interface QBStats {
  pass_cmp: StatAggregate;
  pass_att: StatAggregate;
  pass_yds: StatAggregate;
  pass_td: StatAggregate;
  pass_int: StatAggregate;
  rush_att: StatAggregate;
  rush_yds: StatAggregate;
  rush_td: StatAggregate;
}

export interface SeasonStats {
  season_year: number;
  team_name: string;
  regular_season: QBStats;
  postseason: QBStats;
  combined: QBStats;
}

export interface CareerStats {
  regular_season: QBStats;
  postseason: QBStats;
  combined: QBStats;
}

const QB_STAT_KEYS = [
  'pass_cmp',
  'pass_att',
  'pass_yds',
  'pass_td',
  'pass_int',
  'rush_att',
  'rush_yds',
  'rush_td',
];

export const aggregateStats = (gameIds: string[]): QBStats => {
  if (gameIds.length === 0) {
    return {
      pass_cmp: { total: 0, average: 0, count: 0, games: 0 },
      pass_att: { total: 0, average: 0, count: 0, games: 0 },
      pass_yds: { total: 0, average: 0, count: 0, games: 0 },
      pass_td: { total: 0, average: 0, count: 0, games: 0 },
      pass_int: { total: 0, average: 0, count: 0, games: 0 },
      rush_att: { total: 0, average: 0, count: 0, games: 0 },
      rush_yds: { total: 0, average: 0, count: 0, games: 0 },
      rush_td: { total: 0, average: 0, count: 0, games: 0 },
    };
  }

  const statTotals: Record<string, number[]> = {};
  QB_STAT_KEYS.forEach((key) => {
    statTotals[key] = [];
  });

  gameIds.forEach((gameId) => {
    const stats = getGameStats(gameId);
    stats.forEach((stat) => {
      if (QB_STAT_KEYS.includes(stat.stat_key)) {
        if (!statTotals[stat.stat_key]) {
          statTotals[stat.stat_key] = [];
        }
        statTotals[stat.stat_key].push(stat.stat_value);
      }
    });
  });

  const result: QBStats = {} as QBStats;

  QB_STAT_KEYS.forEach((key) => {
    const values = statTotals[key] || [];
    const total = values.reduce((sum, val) => sum + val, 0);
    const count = values.length;
    const games = gameIds.length;
    const average = games > 0 ? total / games : 0;

    result[key as keyof QBStats] = {
      total: Math.round(total * 100) / 100,
      average: Math.round(average * 100) / 100,
      count,
      games,
    };
  });

  return result;
};

export const getSeasonStats = (seasonId: string): SeasonStats => {
  const season = getSeason(seasonId);
  if (!season) {
    throw new Error(`Season ${seasonId} not found`);
  }

  const allGames = getGamesBySeason(seasonId);
  const regularSeasonGames = getGamesBySeasonAndType(seasonId, false);
  const postseasonGames = getGamesBySeasonAndType(seasonId, true);

  return {
    season_year: season.season_year,
    team_name: season.team_name,
    regular_season: aggregateStats(regularSeasonGames.map((g) => g.id)),
    postseason: aggregateStats(postseasonGames.map((g) => g.id)),
    combined: aggregateStats(allGames.map((g) => g.id)),
  };
};

export const getCareerStats = (profileId: string): CareerStats => {
  const seasons = getSeasonsByProfile(profileId);
  const allGameIds: string[] = [];

  seasons.forEach((season) => {
    const games = getGamesBySeason(season.id);
    allGameIds.push(...games.map((g) => g.id));
  });

  const regularSeasonGameIds: string[] = [];
  const postseasonGameIds: string[] = [];

  seasons.forEach((season) => {
    const regularGames = getGamesBySeasonAndType(season.id, false);
    const postGames = getGamesBySeasonAndType(season.id, true);
    regularSeasonGameIds.push(...regularGames.map((g) => g.id));
    postseasonGameIds.push(...postGames.map((g) => g.id));
  });

  return {
    regular_season: aggregateStats(regularSeasonGameIds),
    postseason: aggregateStats(postseasonGameIds),
    combined: aggregateStats(allGameIds),
  };
};

// Milestones - auto-detect when stats hit thresholds
export interface Milestone {
  id: string;
  type: string; // e.g., "pass_yds_1000", "pass_td_30", etc.
  label: string;
  achieved: boolean;
  game_id?: string;
  game_date?: string;
}

export const getMilestones = (profileId: string): Milestone[] => {
  const career = getCareerStats(profileId);
  const milestones: Milestone[] = [];
  const seasons = getSeasonsByProfile(profileId);
  const seasonStats = seasons.map((season) => ({
    season,
    stats: getSeasonStats(season.id),
  }));

  // Passing yards milestones
  const passYdsThresholds = [1000, 2000, 4000, 8000, 16000, 32000];
  passYdsThresholds.forEach((threshold) => {
    milestones.push({
      id: `pass_yds_${threshold}`,
      type: `pass_yds_${threshold}`,
      label: `${threshold} Career Passing Yards`,
      achieved: career.combined.pass_yds.total >= threshold,
    });
  });

  // Passing TD milestones
  const passTDThresholds = [1, 10, 30, 50, 100, 200];
  passTDThresholds.forEach((threshold) => {
    milestones.push({
      id: `pass_td_${threshold}`,
      type: `pass_td_${threshold}`,
      label: `${threshold} Career Passing TDs`,
      achieved: career.combined.pass_td.total >= threshold,
    });
  });

  // Season passing yards
  const seasonPassYdsThresholds = [1500, 3000, 4000, 5000];
  seasonPassYdsThresholds.forEach((threshold) => {
    const achievedSeason = seasonStats.find(
      (entry) => entry.stats.combined.pass_yds.total >= threshold
    );
    milestones.push({
      id: `season_pass_yds_${threshold}`,
      type: `season_pass_yds_${threshold}`,
      label: `${threshold} Passing Yards (Single Season)`,
      achieved: Boolean(achievedSeason),
    });
  });

  return milestones;
};

// Streaks - consecutive games meeting criteria
export interface Streak {
  type: string;
  label: string;
  currentStreak: number;
  longestStreak: number;
  lastBroken?: string;
}

export const getStreaks = (seasonId: string): Streak[] => {
  const games = getGamesBySeason(seasonId);
  const streaks: Streak[] = [];

  // 2+ pass TD streak
  let currentPassTDStreak = 0;
  let longestPassTDStreak = 0;
  let lastPassTDBroken: string | undefined;

  games.reverse(); // Chronological order (oldest first)

  games.forEach((game) => {
    const stats = getGameStats(game.id);
    const passTD =
      stats.find((s) => s.stat_key === 'pass_td')?.stat_value || 0;

    if (passTD >= 2) {
      currentPassTDStreak++;
      if (currentPassTDStreak > longestPassTDStreak) {
        longestPassTDStreak = currentPassTDStreak;
      }
    } else {
      if (currentPassTDStreak > 0) {
        lastPassTDBroken = game.game_date;
      }
      currentPassTDStreak = 0;
    }
  });

  streaks.push({
    type: 'pass_td_2plus',
    label: '2+ Pass TD Streak',
    currentStreak: currentPassTDStreak,
    longestStreak: longestPassTDStreak,
    lastBroken: lastPassTDBroken,
  });

  // No-INT streak
  let currentNoINTStreak = 0;
  let longestNoINTStreak = 0;
  let lastNoINTBroken: string | undefined;

  games.forEach((game) => {
    const stats = getGameStats(game.id);
    const passINT =
      stats.find((s) => s.stat_key === 'pass_int')?.stat_value || 0;

    if (passINT === 0) {
      currentNoINTStreak++;
      if (currentNoINTStreak > longestNoINTStreak) {
        longestNoINTStreak = currentNoINTStreak;
      }
    } else {
      if (currentNoINTStreak > 0) {
        lastNoINTBroken = game.game_date;
      }
      currentNoINTStreak = 0;
    }
  });

  streaks.push({
    type: 'no_int',
    label: 'No-INT Streak',
    currentStreak: currentNoINTStreak,
    longestStreak: longestNoINTStreak,
    lastBroken: lastNoINTBroken,
  });

  // 300+ passing yards streak
  let current300PlusStreak = 0;
  let longest300PlusStreak = 0;
  let last300PlusBroken: string | undefined;

  games.forEach((game) => {
    const stats = getGameStats(game.id);
    const passYds =
      stats.find((s) => s.stat_key === 'pass_yds')?.stat_value || 0;

    if (passYds >= 300) {
      current300PlusStreak++;
      if (current300PlusStreak > longest300PlusStreak) {
        longest300PlusStreak = current300PlusStreak;
      }
    } else {
      if (current300PlusStreak > 0) {
        last300PlusBroken = game.game_date;
      }
      current300PlusStreak = 0;
    }
  });

  streaks.push({
    type: '300_plus_yards',
    label: '300+ Passing Yards Streak',
    currentStreak: current300PlusStreak,
    longestStreak: longest300PlusStreak,
    lastBroken: last300PlusBroken,
  });

  return streaks;
};
