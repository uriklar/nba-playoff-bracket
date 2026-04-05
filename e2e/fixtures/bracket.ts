import { EAST_TEAMS, WEST_TEAMS } from "./teams";

/** A complete bracket where all higher seeds win in 6 games */
export function createCompleteBracket() {
  return {
    // East Round 1 — higher seeds win
    E1v8: { winner: EAST_TEAMS.cavaliers.name, inGames: 6 },
    E4v5: { winner: EAST_TEAMS.pacers.name, inGames: 6 },
    E3v6: { winner: EAST_TEAMS.knicks.name, inGames: 6 },
    E2v7: { winner: EAST_TEAMS.celtics.name, inGames: 6 },
    // West Round 1 — higher seeds win
    W1v8: { winner: WEST_TEAMS.thunder.name, inGames: 6 },
    W4v5: { winner: WEST_TEAMS.nuggets.name, inGames: 6 },
    W3v6: { winner: WEST_TEAMS.lakers.name, inGames: 6 },
    W2v7: { winner: WEST_TEAMS.rockets.name, inGames: 6 },
    // East Round 2
    ESF1: { winner: EAST_TEAMS.cavaliers.name, inGames: 5 },
    ESF2: { winner: EAST_TEAMS.celtics.name, inGames: 7 },
    // West Round 2
    WSF1: { winner: WEST_TEAMS.thunder.name, inGames: 5 },
    WSF2: { winner: WEST_TEAMS.rockets.name, inGames: 7 },
    // Conference Finals
    ECF: { winner: EAST_TEAMS.celtics.name, inGames: 6 },
    WCF: { winner: WEST_TEAMS.thunder.name, inGames: 6 },
    // Finals
    Finals: { winner: WEST_TEAMS.thunder.name, inGames: 7 },
  };
}

/** Official results with a few series completed */
export function createPartialOfficialResults() {
  return {
    E1v8: { winner: EAST_TEAMS.cavaliers.name, inGames: 5 },
    W1v8: { winner: WEST_TEAMS.thunder.name, inGames: 4 },
    E4v5: { winner: EAST_TEAMS.pacers.name, inGames: 7 },
  };
}

/** Empty official results (season just started) */
export function createEmptyOfficialResults() {
  return {};
}

/** Create a mock group */
export function createMockGroup(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-group-id-123",
    name: "Test Group",
    join_code: "ABC123",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

/** Create a mock submission */
export function createMockSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: "submission-id-1",
    user_id: "Test User",
    name: "Test User",
    group_id: "test-group-id-123",
    bracket: createCompleteBracket(),
    created_at: "2026-04-02T00:00:00Z",
    updated_at: "2026-04-02T00:00:00Z",
    ...overrides,
  };
}

/** Create multiple mock submissions for scoreboard tests */
export function createMockSubmissions() {
  return [
    createMockSubmission({
      id: "sub-1",
      user_id: "Alice",
      name: "Alice",
    }),
    createMockSubmission({
      id: "sub-2",
      user_id: "Bob",
      name: "Bob",
      bracket: {
        ...createCompleteBracket(),
        // Bob picks some upsets
        E1v8: { winner: "Miami Heat", inGames: 7 },
        W1v8: { winner: "Memphis Grizzlies", inGames: 7 },
      },
    }),
    createMockSubmission({
      id: "sub-3",
      user_id: "Charlie",
      name: "Charlie",
    }),
  ];
}

/**
 * The order in which to pick winners for a complete bracket.
 * Each entry: [gameId, winnerTeamName, seriesLength]
 * Follows cascade order: R1 first, then R2, CF, Finals.
 */
export function getFullBracketPicks(): [string, string, string][] {
  return [
    // East Round 1
    ["E1v8", EAST_TEAMS.cavaliers.name, "6"],
    ["E4v5", EAST_TEAMS.pacers.name, "6"],
    ["E3v6", EAST_TEAMS.knicks.name, "6"],
    ["E2v7", EAST_TEAMS.celtics.name, "6"],
    // West Round 1
    ["W1v8", WEST_TEAMS.thunder.name, "6"],
    ["W4v5", WEST_TEAMS.nuggets.name, "6"],
    ["W3v6", WEST_TEAMS.lakers.name, "6"],
    ["W2v7", WEST_TEAMS.rockets.name, "6"],
    // East Round 2
    ["ESF1", EAST_TEAMS.cavaliers.name, "5"],
    ["ESF2", EAST_TEAMS.celtics.name, "7"],
    // West Round 2
    ["WSF1", WEST_TEAMS.thunder.name, "5"],
    ["WSF2", WEST_TEAMS.rockets.name, "7"],
    // Conference Finals
    ["ECF", EAST_TEAMS.celtics.name, "6"],
    ["WCF", WEST_TEAMS.thunder.name, "6"],
    // Finals
    ["Finals", WEST_TEAMS.thunder.name, "7"],
  ];
}
