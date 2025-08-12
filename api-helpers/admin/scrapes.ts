import { createClient } from "redis";

import { fetchAllSources, type ScrapedItem } from "../scrapers/index.js";
import type { AuthResult } from "../types.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

const SCRAPES_CACHE_KEY = "scrapes:all";
const SCRAPES_CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("REDIS_URL not configured");
    }

    redisClient = createClient({ url });
    await redisClient.connect();
  }

  return redisClient;
}

async function getCachedScrapes(): Promise<{ items: ScrapedItem[]; lastUpdated?: string } | null> {
  try {
    const redis = await getRedis();
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

async function setCachedScrapes(items: ScrapedItem[]) {
  try {
    const redis = await getRedis();
    const payload = JSON.stringify({ items, lastUpdated: new Date().toISOString() });
    await redis.set(SCRAPES_CACHE_KEY, payload, { EX: SCRAPES_CACHE_TTL_SECONDS });
  } catch {
    // ignore cache errors
  }
}

async function fetchAndCacheScrapes() {
  const items = await fetchAllSources();
  await setCachedScrapes(items);

  return items;
}

export async function handleGetScrapes(authResult: AuthResult) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse("Only editors can access scrapes", 403);
  }

  const cached = await getCachedScrapes();
  if (cached) {
    return SuccessResponse({
      message: "Scrapes from cache",
      ...cached,
      total: cached.items.length,
    });
  }

  try {
    const items = await fetchAndCacheScrapes();

    return SuccessResponse({
      message: "Scrapes fetched",
      items,
      lastUpdated: new Date().toISOString(),
      total: items.length,
    });
  } catch (error) {
    return ErrorResponse(error || "Failed to get scrapes");
  }
}

export async function handleRefreshScrapes(authResult: AuthResult) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse("Only editors can refresh scrapes", 403);
  }

  try {
    const items = await fetchAndCacheScrapes();

    return SuccessResponse({
      message: "Scrapes refreshed",
      items,
      lastUpdated: new Date().toISOString(),
      total: items.length,
    });
  } catch (error) {
    return ErrorResponse(error || "Failed to refresh scrapes");
  }
}
