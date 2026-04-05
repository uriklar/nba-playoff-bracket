/**
 * Team data extracted from playoffBracketTemplate.json for use in tests.
 * Only first-round teams (real teams with seeds) are listed here.
 */

export const EAST_TEAMS = {
  cavaliers: { name: "Cleveland Cavaliers", seed: 1 },
  heat: { name: "Miami Heat", seed: 8 },
  pacers: { name: "Indiana Pacers", seed: 4 },
  bucks: { name: "Milwaukee Bucks", seed: 5 },
  knicks: { name: "New York Knicks", seed: 3 },
  pistons: { name: "Detroit Pistons", seed: 6 },
  celtics: { name: "Boston Celtics", seed: 2 },
  magic: { name: "Orlando Magic", seed: 7 },
} as const;

export const WEST_TEAMS = {
  thunder: { name: "Oklahoma City Thunder", seed: 1 },
  grizzlies: { name: "Memphis Grizzlies", seed: 8 },
  nuggets: { name: "Denver Nuggets", seed: 4 },
  clippers: { name: "Los Angeles Clippers", seed: 5 },
  lakers: { name: "Los Angeles Lakers", seed: 3 },
  timberwolves: { name: "Minnesota Timberwolves", seed: 6 },
  rockets: { name: "Houston Rockets", seed: 2 },
  warriors: { name: "Golden State Warriors", seed: 7 },
} as const;

/** Game IDs mapped to their round and conference */
export const GAME_IDS = {
  // East Round 1
  E1v8: "E1v8",
  E4v5: "E4v5",
  E3v6: "E3v6",
  E2v7: "E2v7",
  // West Round 1
  W1v8: "W1v8",
  W4v5: "W4v5",
  W3v6: "W3v6",
  W2v7: "W2v7",
  // Round 2
  ESF1: "ESF1",
  ESF2: "ESF2",
  WSF1: "WSF1",
  WSF2: "WSF2",
  // Conference Finals
  ECF: "ECF",
  WCF: "WCF",
  // Finals
  Finals: "Finals",
} as const;
