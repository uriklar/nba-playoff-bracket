import { getOfficialResults, getSubmissions } from "./db";
import { calculateScore, calculatePotentialPoints } from "./scoring";

// Types
export interface Team {
  name: string;
  seed: number | null;
  logo: string;
}

export interface Game {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: Team;
  team2: Team;
}

export interface Guess {
  winner: Team | null;
  inGames: number | null;
}

export interface ResultItem {
  winner: string;
  inGames: number;
}

export interface OfficialResults {
  [gameId: string]: ResultItem;
}

export interface RawUserGuess {
  [gameId: string]: { winner: string; inGames: number };
}

export interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number | null;
  potentialPoints: number | null;
  bracket: RawUserGuess | null;
  status: "loading" | "loaded" | "error" | "pending";
  error?: string;
}

// Helper function to sort scoreboard entries
export const sortScoreboardEntries = (
  a: ScoreboardEntry,
  b: ScoreboardEntry
) => {
  if (a.status === "loaded" && b.status === "loaded") {
    const scoreA = a.score ?? -Infinity;
    const scoreB = b.score ?? -Infinity;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return (b.potentialPoints ?? -Infinity) - (a.potentialPoints ?? -Infinity);
  } else if (a.status === "loaded") {
    return -1;
  } else if (b.status === "loaded") {
    return 1;
  }
  return a.name.localeCompare(b.name);
};

/**
 * Load the scoreboard for a specific group.
 */
export const loadScoreboard = async (
  groupId: string
): Promise<{
  scoreboard: ScoreboardEntry[];
  results: OfficialResults;
}> => {
  const [results, submissions] = await Promise.all([
    getOfficialResults(),
    getSubmissions(groupId),
  ]);

  if (!results) {
    throw new Error("Could not fetch official results.");
  }

  if (!submissions || submissions.length === 0) {
    return { scoreboard: [], results };
  }

  const scoreboard: ScoreboardEntry[] = submissions.map((submission) => {
    try {
      const bracket = submission.bracket as RawUserGuess;
      const score = calculateScore(bracket, results);
      const potentialPoints = calculatePotentialPoints(bracket, results);
      return {
        userId: submission.user_id,
        name: submission.name,
        score,
        potentialPoints,
        bracket,
        status: "loaded",
      };
    } catch (error) {
      return {
        userId: submission.user_id,
        name: submission.name,
        score: null,
        potentialPoints: null,
        bracket: null,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return {
    scoreboard: scoreboard.sort(sortScoreboardEntries),
    results,
  };
};
