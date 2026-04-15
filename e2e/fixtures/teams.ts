/**
 * Team data extracted from playoffBracketTemplate.json for use in tests.
 * Only real first-round teams are listed here; unresolved play-in slots remain TBD in the UI.
 */

export const EAST_TEAMS = {
  pistons: { name: "Detroit Pistons", seed: 1 },
  cavaliers: { name: "Cleveland Cavaliers", seed: 4 },
  hawks: { name: "Atlanta Hawks", seed: 6 },
  knicks: { name: "New York Knicks", seed: 3 },
  raptors: { name: "Toronto Raptors", seed: 5 },
  celtics: { name: "Boston Celtics", seed: 2 },
} as const;

export const WEST_TEAMS = {
  thunder: { name: "Oklahoma City Thunder", seed: 1 },
  lakers: { name: "Los Angeles Lakers", seed: 4 },
  rockets: { name: "Houston Rockets", seed: 5 },
  nuggets: { name: "Denver Nuggets", seed: 3 },
  timberwolves: { name: "Minnesota Timberwolves", seed: 6 },
  spurs: { name: "San Antonio Spurs", seed: 2 },
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
