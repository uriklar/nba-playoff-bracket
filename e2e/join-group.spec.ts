import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import { createMockGroup } from "./fixtures/bracket";

test.describe("Join Group", () => {
  test("joins a group with a valid code and redirects to scoreboard", async ({ page }) => {
    const mockGroup = createMockGroup({ id: "joined-group-id", join_code: "XYZ789" });

    await mockSupabase(page, {
      groupByJoinCode: mockGroup,
      submissions: [],
      officialResults: [{ results: {} }],
    });

    await page.goto("/");

    await page.locator("#joinCode").fill("XYZ789");
    await page.getByRole("button", { name: "Join Group" }).click();

    // Should redirect to the submit page
    await page.waitForURL(`**/g/${mockGroup.id}/submit`);
    await expect(page).toHaveURL(`/g/${mockGroup.id}/submit`);
  });

  test("shows error for invalid join code", async ({ page }) => {
    await mockSupabase(page, {
      groupByJoinCode: null, // triggers 406 not-found
    });

    await page.goto("/");

    await page.locator("#joinCode").fill("BADCOD");
    await page.getByRole("button", { name: "Join Group" }).click();

    await expect(page.getByText("Group not found")).toBeVisible();
  });

  test("shows 'Joining...' while the request is in flight", async ({ page }) => {
    await page.route("**/rest/v1/groups**", async (route) => {
      if (route.request().url().includes("join_code=ilike.")) {
        await new Promise((r) => setTimeout(r, 500));
        const mockGroup = createMockGroup();
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockGroup),
        });
      }
      return route.fulfill({ status: 200, body: "[]" });
    });

    // Also mock the subsequent scoreboard data load
    await page.route("**/rest/v1/submissions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    await page.route("**/rest/v1/official_results**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ results: {} }]),
      })
    );

    await page.goto("/");

    await page.locator("#joinCode").fill("ABC123");
    await page.getByRole("button", { name: "Join Group" }).click();

    await expect(page.getByRole("button", { name: "Joining..." })).toBeVisible();
  });
});
