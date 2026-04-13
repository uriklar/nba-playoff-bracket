import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import { EAST_TEAMS, WEST_TEAMS } from "./fixtures/teams";

test.describe("Bracket Cascade Logic", () => {
  const GROUP_ID = "test-group-id-123";

  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`/g/${GROUP_ID}/submit`);
  });

  test("picking all first-round winners in a conference populates them into the semifinals", async ({ page }) => {
    // Must pick ALL 4 East R1 games before R2 column appears (canDisplayRound check)
    await page.locator(`input[name="winner-E1v8"][value="${EAST_TEAMS.cavaliers.name}"]`).click();
    await page.locator("#games-E1v8").selectOption("5");

    await page.locator(`input[name="winner-E4v5"][value="${EAST_TEAMS.pacers.name}"]`).click();
    await page.locator("#games-E4v5").selectOption("6");

    await page.locator(`input[name="winner-E3v6"][value="${EAST_TEAMS.knicks.name}"]`).click();
    await page.locator("#games-E3v6").selectOption("5");

    await page.locator(`input[name="winner-E2v7"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-E2v7").selectOption("6");

    // ESF1 should now show Cavaliers and Pacers
    const esf1CavRadio = page.locator(`input[name="winner-ESF1"][value="${EAST_TEAMS.cavaliers.name}"]`);
    const esf1PacRadio = page.locator(`input[name="winner-ESF1"][value="${EAST_TEAMS.pacers.name}"]`);

    await expect(esf1CavRadio).toBeVisible();
    await expect(esf1PacRadio).toBeVisible();

    // ESF2 should show Knicks and Celtics
    const esf2KniRadio = page.locator(`input[name="winner-ESF2"][value="${EAST_TEAMS.knicks.name}"]`);
    const esf2CelRadio = page.locator(`input[name="winner-ESF2"][value="${EAST_TEAMS.celtics.name}"]`);

    await expect(esf2KniRadio).toBeVisible();
    await expect(esf2CelRadio).toBeVisible();
  });

  test("cascading works through all rounds to the Finals", async ({ page }) => {
    // Fill all East first round
    await page.locator(`input[name="winner-E1v8"][value="${EAST_TEAMS.cavaliers.name}"]`).click();
    await page.locator("#games-E1v8").selectOption("5");

    await page.locator(`input[name="winner-E4v5"][value="${EAST_TEAMS.pacers.name}"]`).click();
    await page.locator("#games-E4v5").selectOption("6");

    await page.locator(`input[name="winner-E3v6"][value="${EAST_TEAMS.knicks.name}"]`).click();
    await page.locator("#games-E3v6").selectOption("5");

    await page.locator(`input[name="winner-E2v7"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-E2v7").selectOption("6");

    // Pick East semifinal winners
    await page.locator(`input[name="winner-ESF1"][value="${EAST_TEAMS.cavaliers.name}"]`).click();
    await page.locator("#games-ESF1").selectOption("7");

    await page.locator(`input[name="winner-ESF2"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-ESF2").selectOption("6");

    // ECF should show Cavaliers vs Celtics
    const ecfCavRadio = page.locator(`input[name="winner-ECF"][value="${EAST_TEAMS.cavaliers.name}"]`);
    const ecfCelRadio = page.locator(`input[name="winner-ECF"][value="${EAST_TEAMS.celtics.name}"]`);
    await expect(ecfCavRadio).toBeVisible();
    await expect(ecfCelRadio).toBeVisible();

    // Pick ECF winner
    await page.locator(`input[name="winner-ECF"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-ECF").selectOption("6");

    // Now fill the entire West
    await page.locator(`input[name="winner-W1v8"][value="${WEST_TEAMS.thunder.name}"]`).click();
    await page.locator("#games-W1v8").selectOption("4");

    await page.locator(`input[name="winner-W4v5"][value="${WEST_TEAMS.nuggets.name}"]`).click();
    await page.locator("#games-W4v5").selectOption("6");

    await page.locator(`input[name="winner-W3v6"][value="${WEST_TEAMS.lakers.name}"]`).click();
    await page.locator("#games-W3v6").selectOption("5");

    await page.locator(`input[name="winner-W2v7"][value="${WEST_TEAMS.rockets.name}"]`).click();
    await page.locator("#games-W2v7").selectOption("6");

    await page.locator(`input[name="winner-WSF1"][value="${WEST_TEAMS.thunder.name}"]`).click();
    await page.locator("#games-WSF1").selectOption("5");

    await page.locator(`input[name="winner-WSF2"][value="${WEST_TEAMS.rockets.name}"]`).click();
    await page.locator("#games-WSF2").selectOption("7");

    await page.locator(`input[name="winner-WCF"][value="${WEST_TEAMS.thunder.name}"]`).click();
    await page.locator("#games-WCF").selectOption("6");

    // Finals should show Celtics (East) vs Thunder (West)
    const finalsCelRadio = page.locator(`input[name="winner-Finals"][value="${EAST_TEAMS.celtics.name}"]`);
    const finalsOkcRadio = page.locator(`input[name="winner-Finals"][value="${WEST_TEAMS.thunder.name}"]`);
    await expect(finalsCelRadio).toBeVisible();
    await expect(finalsOkcRadio).toBeVisible();
  });

  test("semifinal round is not shown until all first-round games in that conference are picked", async ({ page }) => {
    // Pick only 3 out of 4 East first-round games
    await page.locator(`input[name="winner-E1v8"][value="${EAST_TEAMS.cavaliers.name}"]`).click();
    await page.locator("#games-E1v8").selectOption("5");

    await page.locator(`input[name="winner-E4v5"][value="${EAST_TEAMS.pacers.name}"]`).click();
    await page.locator("#games-E4v5").selectOption("6");

    await page.locator(`input[name="winner-E3v6"][value="${EAST_TEAMS.knicks.name}"]`).click();
    await page.locator("#games-E3v6").selectOption("5");

    // ESF1 might appear (E1v8 and E4v5 feed into it, both picked)
    // But ESF2 should not fully appear until E2v7 is also picked
    // The round column itself won't render if canDisplayRound returns false
    // canDisplayRound checks ALL games in the previous round for that conference

    // East R2 column should NOT be visible yet
    const eastR2Heading = page.getByText("East R2");
    await expect(eastR2Heading).not.toBeVisible();

    // Now pick the 4th game
    await page.locator(`input[name="winner-E2v7"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-E2v7").selectOption("6");

    // East R2 should now be visible
    await expect(eastR2Heading).toBeVisible();
  });

  test("Finals only appears after both conference finals are decided", async ({ page }) => {
    // Fill entire East bracket through ECF
    const eastR1 = [
      ["E1v8", EAST_TEAMS.cavaliers.name],
      ["E4v5", EAST_TEAMS.pacers.name],
      ["E3v6", EAST_TEAMS.knicks.name],
      ["E2v7", EAST_TEAMS.celtics.name],
    ] as const;

    for (const [gameId, winner] of eastR1) {
      await page.locator(`input[name="winner-${gameId}"][value="${winner}"]`).click();
      await page.locator(`#games-${gameId}`).selectOption("5");
    }

    await page.locator(`input[name="winner-ESF1"][value="${EAST_TEAMS.cavaliers.name}"]`).click();
    await page.locator("#games-ESF1").selectOption("5");
    await page.locator(`input[name="winner-ESF2"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-ESF2").selectOption("6");
    await page.locator(`input[name="winner-ECF"][value="${EAST_TEAMS.celtics.name}"]`).click();
    await page.locator("#games-ECF").selectOption("6");

    // Finals column should NOT be visible yet in the bracket (West is not decided)
    // Scope to the bracket section to avoid matching "NBA Finals" in the ScoringInfo table
    const bracketSection = page.locator("section").filter({ hasText: "Tournament Bracket" });
    await expect(bracketSection.getByRole("heading", { name: "NBA Finals" })).not.toBeVisible();

    // Fill entire West bracket through WCF
    const westR1 = [
      ["W1v8", WEST_TEAMS.thunder.name],
      ["W4v5", WEST_TEAMS.nuggets.name],
      ["W3v6", WEST_TEAMS.lakers.name],
      ["W2v7", WEST_TEAMS.rockets.name],
    ] as const;

    for (const [gameId, winner] of westR1) {
      await page.locator(`input[name="winner-${gameId}"][value="${winner}"]`).click();
      await page.locator(`#games-${gameId}`).selectOption("5");
    }

    await page.locator(`input[name="winner-WSF1"][value="${WEST_TEAMS.thunder.name}"]`).click();
    await page.locator("#games-WSF1").selectOption("5");
    await page.locator(`input[name="winner-WSF2"][value="${WEST_TEAMS.rockets.name}"]`).click();
    await page.locator("#games-WSF2").selectOption("7");
    await page.locator(`input[name="winner-WCF"][value="${WEST_TEAMS.thunder.name}"]`).click();
    await page.locator("#games-WCF").selectOption("6");

    // Now Finals should be visible in the bracket
    await expect(bracketSection.getByRole("heading", { name: "NBA Finals" })).toBeVisible();
  });
});
