import { Page } from "@playwright/test";
import {
  createMockGroup,
  createEmptyOfficialResults,
} from "../fixtures/bracket";

interface MockSupabaseOptions {
  groups?: Record<string, unknown>[];
  groupById?: Record<string, unknown> | null;
  groupByJoinCode?: Record<string, unknown> | null;
  submissions?: Record<string, unknown>[];
  officialResults?: Record<string, unknown>[];
  upsertResponse?: Record<string, unknown> | null;
  createGroupResponse?: Record<string, unknown> | null;
}

/**
 * Intercept all Supabase REST API calls with mock responses.
 *
 * Supabase client makes requests to:
 *   {VITE_SUPABASE_URL}/rest/v1/{table}?{query_params}
 *
 * We intercept based on the URL path and query parameters.
 */
export async function mockSupabase(page: Page, options: MockSupabaseOptions = {}) {
  const defaultGroup = createMockGroup();

  // Intercept all Supabase REST API calls
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // --- groups table ---
    if (url.includes("/rest/v1/groups")) {
      if (method === "POST") {
        // createGroup — insert
        const response = options.createGroupResponse ?? defaultGroup;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      }

      if (url.includes("id=eq.")) {
        // getGroupById
        const response = options.groupById ?? defaultGroup;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      }

      if (url.includes("join_code=ilike.")) {
        // getGroupByJoinCode
        if (options.groupByJoinCode === null) {
          // Simulate "not found" — Supabase returns 406 for .single() with no rows
          return route.fulfill({
            status: 406,
            contentType: "application/json",
            body: JSON.stringify({
              message: "JSON object requested, multiple (or no) rows returned",
              details: "Results contain 0 rows",
            }),
          });
        }
        const response = options.groupByJoinCode ?? defaultGroup;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      }

      // Fallback for groups
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.groups ?? [defaultGroup]),
      });
    }

    // --- submissions table ---
    if (url.includes("/rest/v1/submissions")) {
      if (method === "POST") {
        // upsertSubmission
        const response = options.upsertResponse ?? {
          id: "new-submission-id",
          user_id: "Test User",
          name: "Test User",
          group_id: defaultGroup.id,
          bracket: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      }

      // GET submissions
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.submissions ?? []),
      });
    }

    // --- group_payments table ---
    if (url.includes("/rest/v1/group_payments")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }

    // --- official_results table ---
    if (url.includes("/rest/v1/official_results")) {
      const results = options.officialResults ?? [
        { results: createEmptyOfficialResults() },
      ];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(results),
      });
    }

    // --- RPC calls ---
    if (url.includes("/rest/v1/rpc/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(true),
      });
    }

    // Fallback — let other requests pass through or return 404
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not mocked" }),
    });
  });
}

/**
 * Mock Supabase to simulate a failed API call for a specific table.
 */
export async function mockSupabaseError(page: Page, table: string) {
  await page.route(`**/rest/v1/${table}**`, async (route) => {
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });
}
