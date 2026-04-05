import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import {
  createMockGroup,
  createMockSubmissions,
  createEmptyOfficialResults,
} from "./fixtures/bracket";

test.describe("View Bracket Page", () => {
  const GROUP_ID = "test-group-id-123";
  const mockGroup = createMockGroup({ id: GROUP_ID });

  test("renders the page with player selector", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: createMockSubmissions(),
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    await expect(page.getByText("View Player Bracket")).toBeVisible();
    await expect(page.locator("#playerSelect")).toBeVisible();
  });

  test("populates player dropdown from submissions", async ({ page }) => {
    const subs = createMockSubmissions();
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: subs,
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    // Wait for players to load
    await expect(page.locator("#playerSelect")).not.toBeDisabled();

    // All players should be in the dropdown
    const options = page.locator("#playerSelect option");
    // Default "Select a Player" + 3 players
    await expect(options).toHaveCount(4);
  });

  test("selecting a player shows their bracket", async ({ page }) => {
    const subs = createMockSubmissions();
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: subs,
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    await expect(page.locator("#playerSelect")).not.toBeDisabled();

    // Select Alice
    await page.locator("#playerSelect").selectOption(subs[0].id);

    // Should show bracket heading for Alice
    await expect(page.getByText("Bracket for Alice")).toBeVisible();

    // Bracket should be in read-only mode — radio buttons should be disabled
    const radios = page.locator('input[type="radio"]');
    const firstRadio = radios.first();
    await expect(firstRadio).toBeDisabled();
  });

  test("selecting a different player updates the bracket", async ({ page }) => {
    const subs = createMockSubmissions();
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: subs,
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    await expect(page.locator("#playerSelect")).not.toBeDisabled();

    // Select Alice first
    await page.locator("#playerSelect").selectOption(subs[0].id);
    await expect(page.getByText("Bracket for Alice")).toBeVisible();

    // Now select Bob
    await page.locator("#playerSelect").selectOption(subs[1].id);
    await expect(page.getByText("Bracket for Bob")).toBeVisible();
  });

  test("shows empty state when no players have submitted", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: [],
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    // Dropdown should show disabled state or "No players found"
    await expect(page.locator("#playerSelect")).toBeDisabled();
  });

  test("shows loading state while fetching players", async ({ page }) => {
    await page.route("**/rest/v1/submissions**", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createMockSubmissions()),
      });
    });

    await page.goto(`/g/${GROUP_ID}/view-bracket`);

    // The select should be disabled while loading
    await expect(page.locator("#playerSelect")).toBeDisabled();
  });
});
