import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";
import { createMockGroup } from "./fixtures/bracket";

test.describe("Create Group", () => {
  test("creates a group and redirects to the submit page", async ({ page }) => {
    const mockGroup = createMockGroup({ id: "new-group-id", name: "Engineering" });

    await mockSupabase(page, {
      createGroupResponse: mockGroup,
    });

    await page.goto("/");

    await page.locator("#groupName").fill("Engineering");
    await page.getByRole("button", { name: "Create Group" }).click();

    // Should redirect to the submit page for the new group
    await page.waitForURL(`**/g/${mockGroup.id}/submit`);
    await expect(page).toHaveURL(`/g/${mockGroup.id}/submit`);
  });

  test("shows error when group creation fails", async ({ page }) => {
    // Mock a failed creation by returning null-like error
    await page.route("**/rest/v1/groups**", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Something went wrong",
            code: "PGRST000",
          }),
        });
      }
      return route.fulfill({ status: 200, body: "[]" });
    });

    await page.goto("/");

    await page.locator("#groupName").fill("Failing Group");
    await page.getByRole("button", { name: "Create Group" }).click();

    await expect(page.getByText("Failed to create group")).toBeVisible();
  });

  test("shows 'Creating...' while the request is in flight", async ({ page }) => {
    // Delay the response to observe the loading state
    await page.route("**/rest/v1/groups**", async (route) => {
      if (route.request().method() === "POST") {
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

    await page.goto("/");

    await page.locator("#groupName").fill("Slow Group");
    await page.getByRole("button", { name: "Create Group" }).click();

    // Should see "Creating..." while waiting
    await expect(page.getByRole("button", { name: "Creating..." })).toBeVisible();
  });
});
