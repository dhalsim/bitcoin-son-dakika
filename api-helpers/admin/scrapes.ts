import type { RedisClient } from "../common.js";
import { ErrorResponseCreator, SuccessResponse } from "../common_with_client.js";
import { fetchAllSources, type ScrapedItem } from "../scrapers/index.js";
import type { AuthResult } from "../types.js";

const SCRAPES_CACHE_KEY = "scrapes:all";
const SCRAPES_CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

async function getCachedScrapes(
  redis: RedisClient,
): Promise<{ items: ScrapedItem[]; lastUpdated?: string } | null> {
  try {
    const json = await redis.get(SCRAPES_CACHE_KEY);

    if (!json) {
      return null;
    }

    const parsed = JSON.parse(json);

    return parsed;
  } catch {
    return null;
  }
}

async function setCachedScrapes(redis: RedisClient, items: ScrapedItem[]) {
  try {
    const payload = JSON.stringify({ items, lastUpdated: new Date().toISOString() });

    await redis.set(SCRAPES_CACHE_KEY, payload, {
      expiration: { type: "EX", value: SCRAPES_CACHE_TTL_SECONDS },
    });
  } catch {
    // ignore cache errors
  }
}

async function fetchAndCacheScrapes(redis: RedisClient) {
  const items = await fetchAllSources();

  await setCachedScrapes(redis, items);

  return items;
}

export async function handleGetScrapes(redis: RedisClient, authResult: AuthResult) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can access scrapes", 403);
  }

  const cached = await getCachedScrapes(redis);

  if (cached) {
    return SuccessResponse({
      message: "Scrapes from cache",
      ...cached,
      total: cached.items.length,
    });
  }

  try {
    const items = await fetchAndCacheScrapes(redis);

    return SuccessResponse({
      message: "Scrapes fetched",
      items,
      lastUpdated: new Date().toISOString(),
      total: items.length,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to get scrapes");

    return ErrorResponseCreator(err, 500);
  }
}

export async function handleRefreshScrapes(redis: RedisClient, authResult: AuthResult) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can refresh scrapes", 403);
  }

  try {
    const items = await fetchAndCacheScrapes(redis);

    return SuccessResponse({
      message: "Scrapes refreshed",
      items,
      lastUpdated: new Date().toISOString(),
      total: items.length,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to refresh scrapes");

    return ErrorResponseCreator(err, 500);
  }
}
