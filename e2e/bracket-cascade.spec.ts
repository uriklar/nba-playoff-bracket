import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";

test.describe("Bracket Cascade Logic", () => {
  const GROUP_ID = "test-group-id-123";

  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`/g/${GROUP_ID}/submit`);
  });

  test("known first-round series can be picked", async ({ page }) => {
    const cavaliersRadio = page.locator(
      'input[name="winner-E4v5"][value="Cleveland Cavaliers"]'
    );
    const lakersRadio = page.locator(
      'input[name="winner-W4v5"][value="Los Angeles Lakers"]'
    );

    await cavaliersRadio.click();
    await page.locator("#games-E4v5").selectOption("6");
    await lakersRadio.click();
    await page.locator("#games-W4v5").selectOption("7");

    await expect(cavaliersRadio).toBeChecked();
    await expect(lakersRadio).toBeChecked();
  });

  test("unresolved play-in series keep first-round radios disabled", async ({
    page,
  }) => {
    await expect(
      page.locator('input[name="winner-E1v8"][value="Detroit Pistons"]')
    ).toBeDisabled();
    await expect(
      page.locator('input[name="winner-E2v7"][value="Boston Celtics"]')
    ).toBeDisabled();
    await expect(
      page.locator('input[name="winner-W1v8"][value="Oklahoma City Thunder"]')
    ).toBeDisabled();
    await expect(
      page.locator('input[name="winner-W2v7"][value="San Antonio Spurs"]')
    ).toBeDisabled();
  });

  test("conference semifinals stay hidden while first-round TBD slots remain", async ({
    page,
  }) => {
    await page
      .locator('input[name="winner-E4v5"][value="Cleveland Cavaliers"]')
      .click();
    await page.locator("#games-E4v5").selectOption("6");

    await page
      .locator('input[name="winner-E3v6"][value="New York Knicks"]')
      .click();
    await page.locator("#games-E3v6").selectOption("5");

    await page
      .locator('input[name="winner-W4v5"][value="Los Angeles Lakers"]')
      .click();
    await page.locator("#games-W4v5").selectOption("6");

    await page
      .locator('input[name="winner-W3v6"][value="Denver Nuggets"]')
      .click();
    await page.locator("#games-W3v6").selectOption("5");

    await expect(page.getByText("East R2")).not.toBeVisible();
    await expect(page.getByText("West R2")).not.toBeVisible();
  });

  test("finals are hidden on initial load", async ({ page }) => {
    const bracketSection = page
      .locator("section")
      .filter({ hasText: "Tournament Bracket" });

    await expect(
      bracketSection.getByRole("heading", { name: "NBA Finals" })
    ).not.toBeVisible();
  });
});
