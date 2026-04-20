import { GameResult, PlayoffRound, PlayoffData } from "./types";
import { SCORING_CONFIG, GAME_ID_PATTERNS } from "./constants";

export const determineRound = (gameId: string): PlayoffRound | null => {
  for (const [round, pattern] of Object.entries(GAME_ID_PATTERNS)) {
    if (pattern.test(gameId)) {
      return round as PlayoffRound;
    }
  }
  return null;
};

// A series is "clinched" only when inGames is a concrete number. When inGames
// is null the winner field is just the current leader — the series is still
// live and no points should be awarded yet.
function isClinched(
  result: GameResult | undefined
): result is GameResult & { inGames: number } {
  return (
    !!result &&
    result.winner !== "TBD" &&
    typeof result.inGames === "number"
  );
}

export const calculateScore = (
  userGuessData: PlayoffData,
  officialResultsData: PlayoffData
): number => {
  if (!userGuessData || !officialResultsData) return 0;

  let score = 0;

  for (const gameId in officialResultsData) {
    const officialResult = officialResultsData[gameId];
    const userGuess = userGuessData[gameId];
    const round = determineRound(gameId);

    if (!round || !userGuess || !isClinched(officialResult)) continue;

    const { basePoints, bonusPoints } = SCORING_CONFIG[round];

    if (
      userGuess.winner?.toLowerCase() === officialResult.winner.toLowerCase()
    ) {
      score += basePoints;
      if (userGuess.inGames === officialResult.inGames) {
        score += bonusPoints;
      }
    }
  }

  return score;
};

// Whether the user's predicted series length is still reachable given the
// current state of the series.
//
// Predicted end state: predictedWinner reaches 4 wins, opponent reaches N-4.
// Still reachable iff predictedWinner has ≤ 4 current wins AND opponent has
// ≤ N-4 current wins.
function isSeriesLengthAchievable(
  userGuess: GameResult,
  seriesResult: GameResult | undefined
): boolean {
  if (!seriesResult || seriesResult.winner === "TBD") return true;

  if (typeof seriesResult.inGames === "number") {
    return userGuess.inGames === seriesResult.inGames;
  }

  const wins = seriesResult.wins;
  if (!wins || typeof userGuess.inGames !== "number") return true;

  const predicted = userGuess.winner?.toLowerCase();
  if (!predicted) return false;

  let predictedWins = 0;
  let opponentWins = 0;
  let foundPredicted = false;
  for (const [team, w] of Object.entries(wins)) {
    if (team.toLowerCase() === predicted) {
      predictedWins = w;
      foundPredicted = true;
    } else {
      opponentWins += w;
    }
  }

  if (!foundPredicted) return false;

  const N = userGuess.inGames;
  if (N < 4 || N > 7) return false;

  return predictedWins <= 4 && opponentWins <= N - 4;
}

export const calculatePotentialPoints = (
  userGuessData: PlayoffData,
  officialResultsData: PlayoffData
): number => {
  const currentScore = calculateScore(userGuessData, officialResultsData);

  // A team is eliminated only when the series against them is clinched.
  // Mid-series trailers can still come back.
  const eliminatedTeams = new Set<string>();
  const clinchedSeries = new Set<string>();

  for (const gameId in officialResultsData) {
    const officialResult = officialResultsData[gameId];
    if (!isClinched(officialResult)) continue;

    clinchedSeries.add(gameId);

    const userGuess = userGuessData[gameId];
    if (
      userGuess?.winner &&
      userGuess.winner.toLowerCase() !== officialResult.winner.toLowerCase()
    ) {
      eliminatedTeams.add(userGuess.winner.toLowerCase());
    }
  }

  let potentialAdditional = 0;

  for (const gameId in userGuessData) {
    if (clinchedSeries.has(gameId)) continue;

    const userGuess = userGuessData[gameId];
    const round = determineRound(gameId);

    if (!round || !userGuess?.winner) continue;
    if (eliminatedTeams.has(userGuess.winner.toLowerCase())) continue;

    const { basePoints, bonusPoints } = SCORING_CONFIG[round];

    potentialAdditional += basePoints;

    if (isSeriesLengthAchievable(userGuess, officialResultsData[gameId])) {
      potentialAdditional += bonusPoints;
    }
  }

  return currentScore + potentialAdditional;
};
