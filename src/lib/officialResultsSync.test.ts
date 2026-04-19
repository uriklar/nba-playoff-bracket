import {
  buildOfficialResultsFromGames,
  buildSeriesSummaries,
  getCurrentPlayoffWindow,
  isFinalGame,
  type BalldontlieGame,
  type SyncBracketGame,
} from "./officialResultsSync";

const sampleBracket: SyncBracketGame[] = [
  {
    gameId: "E4v5",
    round: 1,
    conference: "East",
    matchup: 2,
    nextGameId: "ESF1",
    team1: { name: "Cleveland Cavaliers" },
    team2: { name: "Toronto Raptors" },
  },
  {
    gameId: "E1v8",
    round: 1,
    conference: "East",
    matchup: 1,
    nextGameId: "ESF1",
    team1: { name: "Detroit Pistons" },
    team2: { name: "Boston Celtics" },
  },
  {
    gameId: "ESF1",
    round: 2,
    conference: "East",
    matchup: 5,
    nextGameId: "ECF",
    team1: { name: "Winner E1v8" },
    team2: { name: "Winner E4v5" },
  },
];

function finalGame(
  home: string,
  visitor: string,
  homeScore: number,
  visitorScore: number
): BalldontlieGame {
  return {
    status: "Final",
    postseason: true,
    home_team_score: homeScore,
    visitor_team_score: visitorScore,
    home_team: { full_name: home },
    visitor_team: { full_name: visitor },
  };
}

describe("officialResultsSync", () => {
  test("identifies final games correctly", () => {
    expect(
      isFinalGame(
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99)
      )
    ).toBe(true);

    expect(
      isFinalGame({
        ...finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99),
        status: "3rd Qtr",
      })
    ).toBe(false);
  });

  test("builds series summaries from completed postseason games", () => {
    const summaries = buildSeriesSummaries([
      finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99),
      finalGame("Toronto Raptors", "Cleveland Cavaliers", 110, 97),
      finalGame("Cleveland Cavaliers", "Toronto Raptors", 105, 95),
    ]);

    const summary = summaries.get("Cleveland Cavaliers::Toronto Raptors");
    expect(summary).toEqual({
      totalGames: 3,
      wins: {
        "Cleveland Cavaliers": 2,
        "Toronto Raptors": 1,
      },
    });
  });

  test("resolves completed first-round and downstream series", () => {
    const officialResults = buildOfficialResultsFromGames(
      [
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99),
        finalGame("Toronto Raptors", "Cleveland Cavaliers", 110, 97),
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 105, 95),
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 108, 100),
        finalGame("Toronto Raptors", "Cleveland Cavaliers", 96, 112),
        finalGame("Detroit Pistons", "Boston Celtics", 102, 99),
        finalGame("Boston Celtics", "Detroit Pistons", 111, 109),
        finalGame("Detroit Pistons", "Boston Celtics", 104, 95),
        finalGame("Boston Celtics", "Detroit Pistons", 98, 105),
        finalGame("Detroit Pistons", "Boston Celtics", 107, 94),
        finalGame("Detroit Pistons", "Cleveland Cavaliers", 120, 110),
        finalGame("Cleveland Cavaliers", "Detroit Pistons", 119, 115),
        finalGame("Detroit Pistons", "Cleveland Cavaliers", 102, 99),
        finalGame("Cleveland Cavaliers", "Detroit Pistons", 95, 99),
        finalGame("Detroit Pistons", "Cleveland Cavaliers", 111, 98),
      ],
      sampleBracket
    );

    expect(officialResults).toEqual({
      E1v8: { winner: "Detroit Pistons", inGames: 5 },
      E4v5: { winner: "Cleveland Cavaliers", inGames: 5 },
      ESF1: { winner: "Detroit Pistons", inGames: 5 },
    });
  });

  test("records a provisional winner without inGames while a series is in progress", () => {
    const officialResults = buildOfficialResultsFromGames(
      [finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99)],
      sampleBracket
    );

    expect(officialResults).toEqual({
      E4v5: { winner: "Cleveland Cavaliers", inGames: null },
    });
  });

  test("skips tied series and series with TBD participants", () => {
    const officialResults = buildOfficialResultsFromGames(
      [
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99),
        finalGame("Toronto Raptors", "Cleveland Cavaliers", 110, 97),
      ],
      sampleBracket
    );

    expect(officialResults).toEqual({});
  });

  test("propagates provisional winners to downstream rounds even when no downstream games have been played", () => {
    const officialResults = buildOfficialResultsFromGames(
      [
        finalGame("Cleveland Cavaliers", "Toronto Raptors", 101, 99),
        finalGame("Detroit Pistons", "Boston Celtics", 110, 97),
      ],
      sampleBracket
    );

    expect(officialResults).toEqual({
      E4v5: { winner: "Cleveland Cavaliers", inGames: null },
      E1v8: { winner: "Detroit Pistons", inGames: null },
    });
  });

  test("derives playoff window from the current date", () => {
    expect(
      getCurrentPlayoffWindow(new Date("2026-04-14T12:00:00Z"))
    ).toEqual({
      playoffYear: 2026,
      startDate: "2026-04-01",
      endDate: "2026-04-14",
    });
  });
});
