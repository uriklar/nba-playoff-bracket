import { createClient } from "@supabase/supabase-js";
import bracketTemplate from "../src/data/playoffBracketTemplate.json" with { type: "json" };
import {
  buildOfficialResultsFromGames,
  getCurrentPlayoffWindow,
  type BalldontlieGame,
} from "../src/lib/officialResultsSync.js";

type EnvMap = Record<string, string | undefined>;

const env: EnvMap =
  (
    globalThis as {
      process?: {
        env?: EnvMap;
      };
    }
  ).process?.env ?? {};

const BALLDONTLIE_GAMES_URL = "https://api.balldontlie.io/v1/games";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getCooldownSeconds(): number {
  const parsed = Number(env.RESULTS_SYNC_MIN_INTERVAL_SECONDS ?? "21600");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 21600;
}

function isAuthorizedRequest(request: Request): boolean {
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function fetchBalldontlieGames(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<BalldontlieGame[]> {
  const allGames: BalldontlieGame[] = [];
  let cursor: string | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      per_page: "100",
      postseason: "true",
      start_date: startDate,
      end_date: endDate,
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await fetch(`${BALLDONTLIE_GAMES_URL}?${params}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `balldontlie games request failed with ${response.status}`
      );
    }

    const payload = (await response.json()) as {
      data?: BalldontlieGame[];
      meta?: { next_cursor?: string | number | null };
    };

    allGames.push(...(payload.data ?? []));

    const nextCursor = payload.meta?.next_cursor;
    if (nextCursor === null || nextCursor === undefined) {
      break;
    }

    cursor = String(nextCursor);
  }

  return allGames;
}

export default async function handler(request: Request): Promise<Response> {
  if (!["GET", "POST"].includes(request.method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorizedRequest(request)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const balldontlieApiKey = env.BALLDONTLIE_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !balldontlieApiKey) {
    return jsonResponse(
      {
        error:
          "Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BALLDONTLIE_API_KEY",
      },
      500
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error: latestError } = await admin
    .from("official_results")
    .select("id, results, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (latestError) {
    return jsonResponse(
      { error: `Failed to load current official results: ${latestError.message}` },
      500
    );
  }

  const latestRow = rows?.[0] ?? null;
  const cooldownSeconds = getCooldownSeconds();
  const force = new URL(request.url).searchParams.get("force") === "1";

  if (latestRow && !force) {
    const elapsedMs = Date.now() - Date.parse(latestRow.updated_at);
    if (elapsedMs >= 0 && elapsedMs < cooldownSeconds * 1000) {
      return jsonResponse({
        status: "skipped",
        updatedAt: latestRow.updated_at,
        cooldownSeconds,
        results: latestRow.results ?? {},
      });
    }
  }

  try {
    const { playoffYear, startDate, endDate } = getCurrentPlayoffWindow();
    const games = await fetchBalldontlieGames(
      balldontlieApiKey,
      startDate,
      endDate
    );
    const nextResults = buildOfficialResultsFromGames(
      games,
      bracketTemplate.games
    );
    const updatedAt = new Date().toISOString();

    if (latestRow) {
      const { error: updateError } = await admin
        .from("official_results")
        .update({
          results: nextResults,
          updated_at: updatedAt,
        })
        .eq("id", latestRow.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await admin.from("official_results").insert({
        results: nextResults,
        updated_at: updatedAt,
      });

      if (insertError) {
        throw insertError;
      }
    }

    return jsonResponse({
      status: "synced",
      updatedAt,
      playoffYear,
      fetchedGames: games.length,
      completedSeries: Object.keys(nextResults).length,
      results: nextResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500);
  }
}
