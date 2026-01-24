export const QB_STATS = {
  pass_cmp: { label: 'Pass Completions', defaultValue: 0 },
  pass_att: { label: 'Pass Attempts', defaultValue: 0 },
  pass_yds: { label: 'Passing Yards', defaultValue: 0 },
  pass_td: { label: 'Pass TDs', defaultValue: 0 },
  pass_int: { label: 'Interceptions', defaultValue: 0 },
  rush_att: { label: 'Rush Attempts', defaultValue: 0 },
  rush_yds: { label: 'Rushing Yards', defaultValue: 0 },
  rush_td: { label: 'Rush TDs', defaultValue: 0 },
};

export const POSTSEASON_ROUNDS = [
  { value: 1, label: 'Wildcard' },
  { value: 2, label: 'Divisional' },
  { value: 3, label: 'AFC Championship' },
  { value: 4, label: 'NFC Championship' },
  { value: 5, label: 'Super Bowl' },
] as const;

export const getPostseasonRoundLabel = (value?: number | null): string | null =>
  POSTSEASON_ROUNDS.find((round) => round.value === value)?.label ?? null;

export type QBStatKey = keyof typeof QB_STATS;

export interface GameFormData {
  opponent: string;
  gameDate: string;
  week?: number;
  isPostseason: boolean;
  isHome: boolean;
  isStarter: boolean;
  result?: 'W' | 'L' | 'T';
  teamScore?: number;
  opponentScore?: number;
  note: string;
  stats: Record<QBStatKey, number>;
}

export const DEFAULT_GAME_FORM_DATA: GameFormData = {
  opponent: '',
  gameDate: new Date().toISOString().split('T')[0],
  week: undefined,
  isPostseason: false,
  isHome: true,
  isStarter: true,
  result: undefined,
  teamScore: undefined,
  opponentScore: undefined,
  note: '',
  stats: {
    pass_cmp: 0,
    pass_att: 0,
    pass_yds: 0,
    pass_td: 0,
    pass_int: 0,
    rush_att: 0,
    rush_yds: 0,
    rush_td: 0,
  },
};
