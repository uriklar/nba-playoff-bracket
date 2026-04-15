import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";

test.describe("Bracket Submission Page", () => {
  const GROUP_ID = "test-group-id-123";

  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test("renders the submission form with current bracket data", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    await expect(page.getByText("Your Information")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your name to submit")).toBeVisible();
    await expect(page.getByText("Tournament Bracket")).toBeVisible();

    await expect(page.getByText("Detroit Pistons")).toBeVisible();
    await expect(page.getByText("Cleveland Cavaliers")).toBeVisible();
    await expect(page.getByText("Atlanta Hawks")).toBeVisible();
  });

  test("known first-round matchups remain selectable", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    const cavaliersRadio = page.locator(
      'input[name="winner-E4v5"][value="Cleveland Cavaliers"]'
    );

    await expect(cavaliersRadio).toBeEnabled();
    await cavaliersRadio.click();
    await page.locator("#games-E4v5").selectOption("6");

    await expect(cavaliersRadio).toBeChecked();
    await expect(page.locator("#games-E4v5")).toHaveValue("6");
  });

  test("unresolved play-in matchups are disabled", async ({ page }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

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

  test("submission stays blocked until play-in slots are resolved", async ({
    page,
  }) => {
    await page.goto(`/g/${GROUP_ID}/submit`);

    await page.getByPlaceholder("Enter your name to submit").fill("Test Player");

    await page
      .locator('input[name="winner-E4v5"][value="Cleveland Cavaliers"]')
      .click();
    await page.locator("#games-E4v5").selectOption("6");

    await page
      .locator('input[name="winner-E3v6"][value="New York Knicks"]')
      .click();
    await page.locator("#games-E3v6").selectOption("6");

    await page
      .locator('input[name="winner-W4v5"][value="Los Angeles Lakers"]')
      .click();
    await page.locator("#games-W4v5").selectOption("6");

    await page
      .locator('input[name="winner-W3v6"][value="Denver Nuggets"]')
      .click();
    await page.locator("#games-W3v6").selectOption("6");

    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Submit Bracket" }).click();

    expect(dialogMessage).toContain("complete all 15 matchups");
  });
});
