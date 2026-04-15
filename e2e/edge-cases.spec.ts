import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import { createMockGroup } from "./fixtures/bracket";

test.describe("Edge Cases", () => {
  const GROUP_ID = "test-group-id-123";

  test("navigation between group pages works correctly", async ({ page }) => {
    await mockSupabase(page, {
      submissions: [],
      officialResults: [{ results: {} }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    // Navigate to Submit Bracket
    await page.getByRole("link", { name: "Submit Bracket" }).click();
    await expect(page).toHaveURL(`/g/${GROUP_ID}/submit`);

    // Navigate to View Brackets
    await page.getByRole("link", { name: "View Brackets" }).click();
    await expect(page).toHaveURL(`/g/${GROUP_ID}/view-bracket`);

    // Navigate back to Scoreboard
    await page.getByRole("link", { name: "Scoreboard" }).click();
    await expect(page).toHaveURL(`/g/${GROUP_ID}`);
  });

  test("clicking logo navigates to home", async ({ page }) => {
    await mockSupabase(page, {
      submissions: [],
      officialResults: [{ results: {} }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    // Click the logo link
    await page.getByRole("link").filter({ has: page.locator('img[alt="NBA Bracket Challenge Logo"]') }).click();
    await expect(page).toHaveURL("/");
  });

  test("incomplete bracket cannot be submitted (alerts)", async ({ page }) => {
    await mockSupabase(page);

    await page.goto(`/g/${GROUP_ID}/submit`);

    await page.getByPlaceholder("Enter your name to submit").fill("Incomplete Test");

    // Pick only one fully known game
    await page.locator('input[name="winner-E4v5"][value="Cleveland Cavaliers"]').click();
    await page.locator("#games-E4v5").selectOption("5");

    // Set up dialog handler to capture the alert
    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Submit Bracket" }).click();

    // The alert should fire about incomplete matchups
    expect(dialogMessage).toContain("complete all");
  });

  test("bracket without a name cannot be submitted (alerts)", async ({ page }) => {
    await mockSupabase(page);

    await page.goto(`/g/${GROUP_ID}/submit`);

    // Don't fill in a name, just try to submit
    // The form has required on the input, so it won't submit
    // But if somehow triggered, the handler checks for empty name

    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    // Click submit - HTML5 validation should prevent submission
    await page.getByRole("button", { name: "Submit Bracket" }).click();

    // The name input should show validation (required attribute)
    const nameInput = page.getByPlaceholder("Enter your name to submit");
    const isValid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test("group nav bar shows correct links for the current group", async ({ page }) => {
    await mockSupabase(page, {
      submissions: [],
      officialResults: [{ results: {} }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    // Check that nav links point to the correct group
    const scoreboardLink = page.getByRole("link", { name: "Scoreboard" });
    const submitLink = page.getByRole("link", { name: "Submit Bracket" });
    const viewLink = page.getByRole("link", { name: "View Brackets" });

    await expect(scoreboardLink).toHaveAttribute("href", `/g/${GROUP_ID}`);
    await expect(submitLink).toHaveAttribute("href", `/g/${GROUP_ID}/submit`);
    await expect(viewLink).toHaveAttribute("href", `/g/${GROUP_ID}/view-bracket`);
  });
});
