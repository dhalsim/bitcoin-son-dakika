import type { RedisClient } from "../../common.js";

import type { ZeronoiseEmail } from "./types.js";

const LAST_FETCH_KEY = "zeronoise:last-fetch";
const EMAILS_KEY = "zeronoise:emails";
const GMAIL_ACCESS_TOKEN_KEY = "zeronoise:gmail-access-token";
const GMAIL_TOKEN_TTL = 60 * 60; // 1 hour in seconds

export async function shouldFetchFresh(redis: RedisClient, noCache: boolean): Promise<boolean> {
  if (noCache) {
    return true;
  }

  const lastFetch = await redis.get(LAST_FETCH_KEY);
  if (!lastFetch) {
    return true;
  }

  const today = new Date().toISOString().split("T")[0];
  const fetchDate = new Date(lastFetch).toISOString().split("T")[0];

  return today !== fetchDate;
}

export async function getCachedEmails(redis: RedisClient): Promise<ZeronoiseEmail[] | null> {
  try {
    const cached = await redis.get(EMAILS_KEY);

    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function cacheEmails(redis: RedisClient, emails: ZeronoiseEmail[]): Promise<void> {
  try {
    await redis.set(EMAILS_KEY, JSON.stringify(emails));
    await redis.set(LAST_FETCH_KEY, new Date().toISOString());
  } catch {
    // Ignore cache errors
  }
}

export async function getCachedGmailAccessToken(redis: RedisClient): Promise<string | null> {
  try {
    return await redis.get(GMAIL_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function cacheGmailAccessToken(
  redis: RedisClient,
  accessToken: string,
): Promise<void> {
  try {
    await redis.set(GMAIL_ACCESS_TOKEN_KEY, accessToken, {
      expiration: { type: "EX", value: GMAIL_TOKEN_TTL },
    });
  } catch {
    // Ignore cache errors
  }
}

export async function refreshGmailAccessToken(): Promise<string> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_REFRESH_TOKEN in environment variables");
  }

  const payload = {
    client_id: GOOGLE_CLIENT_ID,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  };

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(payload).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("No access token in refresh response");
  }

  return data.access_token;
}
