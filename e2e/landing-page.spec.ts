import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/mock-supabase";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.goto("/");
  });

  test("renders the landing page with title and both forms", async ({ page }) => {
    await expect(page.getByText("NBA Playoff")).toBeVisible();
    await expect(page.getByText("Bracket Challenge")).toBeVisible();

    // Create group form
    await expect(page.getByRole("heading", { name: "Create a Group" })).toBeVisible();
    await expect(page.locator("#groupName")).toBeVisible();

    // Join group form
    await expect(page.getByRole("heading", { name: "Join a Group" })).toBeVisible();
    await expect(page.locator("#joinCode")).toBeVisible();
  });

  test("create group button is disabled when group name is empty", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: "Create Group" });
    await expect(createBtn).toBeDisabled();
  });

  test("join group button is disabled when join code is empty", async ({ page }) => {
    const joinBtn = page.getByRole("button", { name: "Join Group" });
    await expect(joinBtn).toBeDisabled();
  });

  test("create group button becomes enabled when name is entered", async ({ page }) => {
    await page.locator("#groupName").fill("My Team");
    const createBtn = page.getByRole("button", { name: "Create Group" });
    await expect(createBtn).toBeEnabled();
  });

  test("join code input converts to uppercase", async ({ page }) => {
    await page.locator("#joinCode").fill("abc123");
    await expect(page.locator("#joinCode")).toHaveValue("ABC123");
  });
});
