import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import {
  createMockGroup,
  createMockSubmissions,
  createPartialOfficialResults,
  createEmptyOfficialResults,
} from "./fixtures/bracket";

test.describe("Scoreboard Page", () => {
  const GROUP_ID = "test-group-id-123";
  const mockGroup = createMockGroup({ id: GROUP_ID, name: "Engineering Team" });

  test("shows group name and join code", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: createMockSubmissions(),
      officialResults: [{ results: createPartialOfficialResults() }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    // Group name appears in both nav and scoreboard heading — use heading role to avoid strict mode violation
    await expect(page.getByRole("heading", { name: "Engineering Team" })).toBeVisible();
    await expect(page.getByText("ABC123")).toBeVisible();
  });

  test("displays leaderboard with all participants", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: createMockSubmissions(),
      officialResults: [{ results: createPartialOfficialResults() }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    // Wait for loading to finish
    await expect(page.getByText("Loading scores...")).not.toBeVisible({ timeout: 5000 });

    // All three mock users should appear
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
    await expect(page.getByText("Charlie")).toBeVisible();
  });

  test("shows 'No brackets submitted yet' when there are no submissions", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: [],
      officialResults: [{ results: createEmptyOfficialResults() }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    await expect(page.getByText("Loading scores...")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("No brackets submitted yet")).toBeVisible();
  });

  test("shows official results section", async ({ page }) => {
    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: createMockSubmissions(),
      officialResults: [{ results: createPartialOfficialResults() }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    await expect(page.getByText("Official Results")).toBeVisible();
  });

  test("team selector dropdown works", async ({ page }) => {
    // Team selector only renders past BRACKETS_VISIBLE_DATE (2026-04-20).
    await page.clock.install({ time: new Date("2026-04-21T00:00:00Z") });

    await mockSupabase(page, {
      groupById: mockGroup,
      submissions: createMockSubmissions(),
      officialResults: [{ results: createPartialOfficialResults() }],
    });

    await page.goto(`/g/${GROUP_ID}`);

    await expect(page.getByText("Loading scores...")).not.toBeVisible({ timeout: 5000 });

    const teamSelector = page.locator("#team-selector");
    await expect(teamSelector).toBeVisible();

    // Select a team
    await teamSelector.selectOption("Cleveland Cavaliers");

    // Should show a "Finish for Cleveland Cavaliers" column
    await expect(page.getByText("Finish for Cleveland Cavaliers")).toBeVisible();
  });

  test("loading state is shown initially", async ({ page }) => {
    // Delay the response to observe loading state
    await page.route("**/rest/v1/**", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (route.request().url().includes("groups")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockGroup),
        });
      }
      if (route.request().url().includes("official_results")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ results: {} }]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto(`/g/${GROUP_ID}`);
    await expect(page.getByText("Loading scores...")).toBeVisible();
  });
});
