import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import { createMockGroup, getFullBracketPicks } from "./fixtures/bracket";

test.describe("Bracket Submission Page", () => {
  const GROUP_ID = "test-group-id-123";

  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test("renders the submission form with name input and bracket", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    await expect(page.getByText("Your Information")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your name to submit")).toBeVisible();
    await expect(page.getByText("Tournament Bracket")).toBeVisible();

    // Should see first-round games
    await expect(page.getByText("Cleveland Cavaliers")).toBeVisible();
    await expect(page.getByText("Miami Heat")).toBeVisible();
  });

  test("submit button exists and form can be submitted with a complete bracket", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    // Enter name
    await page.getByPlaceholder("Enter your name to submit").fill("Test Player");

    const picks = getFullBracketPicks();

    // Fill out the entire bracket
    for (const [gameId, winnerName, games] of picks) {
      // Click the radio button for the winner
      const radio = page.locator(`input[name="winner-${gameId}"][value="${winnerName}"]`);
      await radio.click();

      // Select the number of games
      await page.locator(`#games-${gameId}`).selectOption(games);
    }

    // Submit the bracket
    await page.getByRole("button", { name: "Submit Bracket" }).click();

    // Should see success message
    await expect(page.getByText("Bracket Submitted Successfully")).toBeVisible();
    await expect(page.getByText("Your predictions have been recorded")).toBeVisible();
  });

  test("shows success state and locks bracket after submission", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    await page.getByPlaceholder("Enter your name to submit").fill("Lock Test");

    const picks = getFullBracketPicks();
    for (const [gameId, winnerName, games] of picks) {
      await page.locator(`input[name="winner-${gameId}"][value="${winnerName}"]`).click();
      await page.locator(`#games-${gameId}`).selectOption(games);
    }

    await page.getByRole("button", { name: "Submit Bracket" }).click();
    await expect(page.getByText("Bracket Submitted Successfully")).toBeVisible();

    // Name input should be disabled
    await expect(page.getByPlaceholder("Enter your name to submit")).toBeDisabled();

    // Radio buttons should be disabled (check one)
    const radio = page.locator('input[name="winner-E1v8"]').first();
    await expect(radio).toBeDisabled();

    // Submit button should be gone
    await expect(page.getByRole("button", { name: "Submit Bracket" })).not.toBeVisible();
  });

  test("shows error when submission fails", async ({ page }) => {
    // Override the upsert to return an error
    await page.route("**/rest/v1/submissions**", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Server error" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto(`/g/${GROUP_ID}/submit`);

    await page.getByPlaceholder("Enter your name to submit").fill("Error Test");

    const picks = getFullBracketPicks();
    for (const [gameId, winnerName, games] of picks) {
      await page.locator(`input[name="winner-${gameId}"][value="${winnerName}"]`).click();
      await page.locator(`#games-${gameId}`).selectOption(games);
    }

    await page.getByRole("button", { name: "Submit Bracket" }).click();

    await expect(page.getByText("Submission Failed")).toBeVisible();
    // Should show "Try Again" button
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });
});
