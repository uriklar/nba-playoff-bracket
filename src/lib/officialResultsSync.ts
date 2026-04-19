import bracketTemplate from "../data/playoffBracketTemplate.json";

export interface SyncTeam {
  name: string;
}

export interface SyncBracketGame {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: SyncTeam;
  team2: SyncTeam;
}

export interface BalldontlieGame {
  status: string;
  postseason: boolean;
  postponed?: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: { full_name: string };
  visitor_team: { full_name: string };
}

export interface SeriesResult {
  winner: string;
  inGames: number | null;
}

export interface SeriesSummary {
  totalGames: number;
  wins: Record<string, number>;
}

export type OfficialResultsMap = Record<string, SeriesResult>;

function normalizeTeamName(name: string): string {
  return name.trim();
}

function makeSeriesKey(teamA: string, teamB: string): string {
  return [normalizeTeamName(teamA), normalizeTeamName(teamB)].sort().join("::");
}

function isResolvedTeamName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed !== "" && trimmed !== "TBD" && !trimmed.startsWith("Winner ");
}

export function isFinalGame(game: BalldontlieGame): boolean {
  return game.status === "Final" && !game.postponed;
}

export function buildSeriesSummaries(
  games: BalldontlieGame[]
): Map<string, SeriesSummary> {
  const summaries = new Map<string, SeriesSummary>();

  for (const game of games) {
    if (!isFinalGame(game) || !game.postseason) {
      continue;
    }

    const homeTeam = normalizeTeamName(game.home_team.full_name);
    const visitorTeam = normalizeTeamName(game.visitor_team.full_name);

    if (!homeTeam || !visitorTeam || homeTeam === visitorTeam) {
      continue;
    }

    const key = makeSeriesKey(homeTeam, visitorTeam);
    const existing = summaries.get(key) ?? {
      totalGames: 0,
      wins: {
        [homeTeam]: 0,
        [visitorTeam]: 0,
      },
    };

    existing.totalGames += 1;

    if (game.home_team_score > game.visitor_team_score) {
      existing.wins[homeTeam] = (existing.wins[homeTeam] ?? 0) + 1;
      existing.wins[visitorTeam] = existing.wins[visitorTeam] ?? 0;
    } else if (game.visitor_team_score > game.home_team_score) {
      existing.wins[visitorTeam] = (existing.wins[visitorTeam] ?? 0) + 1;
      existing.wins[homeTeam] = existing.wins[homeTeam] ?? 0;
    }

    summaries.set(key, existing);
  }

  return summaries;
}

function getFeederGames(
  games: SyncBracketGame[],
  nextGameId: string
): SyncBracketGame[] {
  return games
    .filter((game) => game.nextGameId === nextGameId)
    .sort((a, b) => a.matchup - b.matchup);
}

function getParticipantsForGame(
  game: SyncBracketGame,
  allGames: SyncBracketGame[],
  winnersByGameId: Record<string, string>
): [string | null, string | null] {
  if (game.round === 1) {
    return [game.team1.name, game.team2.name];
  }

  const feeders = getFeederGames(allGames, game.gameId);
  if (feeders.length !== 2) {
    return [null, null];
  }

  return [
    winnersByGameId[feeders[0].gameId] ?? null,
    winnersByGameId[feeders[1].gameId] ?? null,
  ];
}

export function buildOfficialResultsFromGames(
  games: BalldontlieGame[],
  bracketGames: SyncBracketGame[] = bracketTemplate.games as SyncBracketGame[]
): OfficialResultsMap {
  const officialResults: OfficialResultsMap = {};
  const winnersByGameId: Record<string, string> = {};
  const seriesSummaries = buildSeriesSummaries(games);
  const sortedBracketGames = [...bracketGames].sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }
    return a.matchup - b.matchup;
  });

  for (const game of sortedBracketGames) {
    const [team1, team2] = getParticipantsForGame(
      game,
      sortedBracketGames,
      winnersByGameId
    );

    if (
      !team1 ||
      !team2 ||
      !isResolvedTeamName(team1) ||
      !isResolvedTeamName(team2)
    ) {
      continue;
    }

    const summary = seriesSummaries.get(makeSeriesKey(team1, team2));
    if (!summary) {
      continue;
    }

    const team1Wins = summary.wins[normalizeTeamName(team1)] ?? 0;
    const team2Wins = summary.wins[normalizeTeamName(team2)] ?? 0;

    if (team1Wins === team2Wins) {
      continue;
    }

    const winner = team1Wins > team2Wins ? team1 : team2;
    const isClinched = team1Wins >= 4 || team2Wins >= 4;
    winnersByGameId[game.gameId] = winner;
    officialResults[game.gameId] = {
      winner,
      inGames: isClinched ? summary.totalGames : null,
    };
  }

  return officialResults;
}

export function getCurrentPlayoffWindow(now = new Date()): {
  playoffYear: number;
  startDate: string;
  endDate: string;
} {
  const currentYear = now.getUTCFullYear();
  const playoffYear = now.getUTCMonth() < 3 ? currentYear - 1 : currentYear;
  return {
    playoffYear,
    startDate: `${playoffYear}-04-01`,
    endDate: now.toISOString().slice(0, 10),
  };
}
