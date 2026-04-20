/// <reference types="jest" />
import { calculateScore, calculatePotentialPoints, determineRound } from "./scoring";
import { PlayoffRound, PlayoffData } from "./types";

describe("determineRound", () => {
  test("correctly identifies First Round games", () => {
    expect(determineRound("E1v8")).toBe(PlayoffRound.FIRST_ROUND);
    expect(determineRound("W4v5")).toBe(PlayoffRound.FIRST_ROUND);
  });

  test("correctly identifies Conference Semifinals games", () => {
    expect(determineRound("E1v4")).toBe(PlayoffRound.CONFERENCE_SEMIFINALS);
    expect(determineRound("W2v3")).toBe(PlayoffRound.CONFERENCE_SEMIFINALS);
  });

  test("correctly identifies Conference Finals games", () => {
    expect(determineRound("ECF")).toBe(PlayoffRound.CONFERENCE_FINALS);
    expect(determineRound("WCF")).toBe(PlayoffRound.CONFERENCE_FINALS);
  });

  test("correctly identifies NBA Finals", () => {
    expect(determineRound("Finals")).toBe(PlayoffRound.NBA_FINALS);
  });

  test("returns null for invalid game IDs", () => {
    expect(determineRound("invalid")).toBeNull();
    expect(determineRound("E9v10")).toBeNull();
  });
});

describe("calculateScore", () => {
  test("correctly calculates score for Participant A", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
      E2v7: { winner: "Team2", inGames: 6 },
      E3v6: { winner: "Team3", inGames: 7 },
      E4v5: { winner: "Team4", inGames: 4 },
      W1v8: { winner: "Team9", inGames: 5 },
      W2v7: { winner: "Team10", inGames: 6 },
      W3v6: { winner: "Team11", inGames: 5 },
      W4v5: { winner: "Team12", inGames: 4 },

      E1v4: { winner: "Team1", inGames: 6 },
      E2v3: { winner: "Team2", inGames: 7 },
      W1v4: { winner: "Team9", inGames: 5 },
      W2v3: { winner: "Team10", inGames: 6 },

      ECF: { winner: "Team1", inGames: 7 },
      WCF: { winner: "Team10", inGames: 6 },

      Finals: { winner: "Team1", inGames: 6 },
    };

    const officialResults: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
      E2v7: { winner: "Team2", inGames: 5 },
      E3v6: { winner: "Team3", inGames: 7 },
      E4v5: { winner: "Team4", inGames: 6 },
      W1v8: { winner: "Team9", inGames: 4 },
      W2v7: { winner: "Team10", inGames: 6 },
      W3v6: { winner: "Team11", inGames: 6 },
      W4v5: { winner: "Team13", inGames: 4 },

      E1v4: { winner: "Team1", inGames: 6 },
      E2v3: { winner: "Team2", inGames: 7 },
      W1v4: { winner: "Team9", inGames: 6 },
      W2v3: { winner: "Team12", inGames: 5 },

      ECF: { winner: "Team1", inGames: 7 },
      WCF: { winner: "Team12", inGames: 5 },

      Finals: { winner: "Team12", inGames: 7 },
    };

    // R1 (74) + CSF (52) + CF (26) + Finals (0) = 152
    expect(calculateScore(userGuesses, officialResults)).toBe(152);
  });

  test("handles missing data gracefully", () => {
    expect(calculateScore({}, {})).toBe(0);
    expect(
      calculateScore(
        null as unknown as PlayoffData,
        null as unknown as PlayoffData
      )
    ).toBe(0);
  });

  test("ignores TBD results", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
    };
    const officialResults: PlayoffData = {
      E1v8: { winner: "TBD", inGames: 0 },
    };
    expect(calculateScore(userGuesses, officialResults)).toBe(0);
  });

  test("handles case-insensitive team names", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
    };
    const officialResults: PlayoffData = {
      E1v8: { winner: "TEAM1", inGames: 5 },
    };
    expect(calculateScore(userGuesses, officialResults)).toBe(14);
  });

  test("does NOT award points for in-progress series (inGames=null)", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
    };
    const officialResults: PlayoffData = {
      E1v8: {
        winner: "Team1",
        inGames: null,
        wins: { Team1: 2, Team2: 0 },
      },
    };
    expect(calculateScore(userGuesses, officialResults)).toBe(0);
  });
});

describe("calculatePotentialPoints", () => {
  test("no official results → full potential from all guesses", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
      Finals: { winner: "Nuggets", inGames: 6 },
    };
    // R1: 8+6 = 14. Finals: 24+12 = 36.
    expect(calculatePotentialPoints(guesses, {})).toBe(50);
  });

  test("mid-series trailer is NOT eliminated", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 7 },
      ESF1: { winner: "Pistons", inGames: 6 },
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Magic",
        inGames: null,
        wins: { Magic: 1, Pistons: 0 },
      },
    };
    // E1v8: base 8 + bonus 6 (Pistons in 7 → Magic=3 at end, currently 1 → reachable). = 14
    // ESF1: no data, Pistons not eliminated → 12+8 = 20
    expect(calculatePotentialPoints(guesses, results)).toBe(34);
  });

  test("drops bonus when predicted inGames is no longer reachable", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 4 }, // guessed sweep
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Magic",
        inGames: null,
        wins: { Magic: 1, Pistons: 0 },
      },
    };
    // Sweep impossible (Magic already has 1 win). Base 8 still reachable.
    expect(calculatePotentialPoints(guesses, results)).toBe(8);
  });

  test("in-progress: predicted winner leading, still reachable → full credit", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Pistons",
        inGames: null,
        wins: { Pistons: 2, Magic: 0 },
      },
    };
    // Not clinched → calculateScore = 0.
    // Potential: 8 + 6 = 14 (Pistons in 5 → 4-1 end; currently 2-0 → achievable).
    expect(calculateScore(guesses, results)).toBe(0);
    expect(calculatePotentialPoints(guesses, results)).toBe(14);
  });

  test("clinched loss eliminates the user's downstream picks of that team", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
      ESF1: { winner: "Pistons", inGames: 6 },
      ECF: { winner: "Pistons", inGames: 7 },
    };
    const results: PlayoffData = {
      E1v8: { winner: "Magic", inGames: 5 },
    };
    // Pistons eliminated in R1 → ESF1 + ECF picks worth 0.
    // E1v8 is clinched → not added to potential.
    expect(calculatePotentialPoints(guesses, results)).toBe(0);
  });

  test("mid-series loss does NOT eliminate downstream picks", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 7 },
      ESF1: { winner: "Pistons", inGames: 6 },
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Magic",
        inGames: null,
        wins: { Magic: 1, Pistons: 0 },
      },
    };
    // E1v8: 8 + 6 = 14 (7 games means Magic=3 at end, currently 1 → reachable).
    // ESF1: Pistons not eliminated → 12 + 8 = 20.
    expect(calculatePotentialPoints(guesses, results)).toBe(34);
  });

  test("clinched correct pick is already counted in score; potential equals score", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
    };
    const results: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
    };
    expect(calculateScore(guesses, results)).toBe(14);
    expect(calculatePotentialPoints(guesses, results)).toBe(14);
  });

  test("clinched: correct winner but wrong inGames → base only", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 5 },
    };
    const results: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 6 },
    };
    expect(calculatePotentialPoints(guesses, results)).toBe(8);
  });

  test("sweep still reachable when predicted winner is up 3-0", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 4 },
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Pistons",
        inGames: null,
        wins: { Pistons: 3, Magic: 0 },
      },
    };
    expect(calculatePotentialPoints(guesses, results)).toBe(14);
  });

  test("inGames=6 no longer reachable when opponent already has 3 wins", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 6 },
    };
    const results: PlayoffData = {
      E1v8: {
        winner: "Magic",
        inGames: null,
        wins: { Magic: 3, Pistons: 2 },
      },
    };
    // Pistons in 6 would mean Magic=2 at end; Magic already has 3. Impossible.
    // Base still reachable (Pistons could still win 4-3).
    expect(calculatePotentialPoints(guesses, results)).toBe(8);
  });

  test("no wins data on in-progress series → bonus optimistically assumed reachable", () => {
    const guesses: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: 4 },
    };
    const results: PlayoffData = {
      E1v8: { winner: "Pistons", inGames: null },
    };
    expect(calculatePotentialPoints(guesses, results)).toBe(14);
  });
});
