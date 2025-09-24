import { finalizeEvent, type EventTemplate } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";

import type { RedisClient } from "../../common.js";

// Redis key generators
export const getServerCacheKey = (server: string) => `blossom-blob-list-${server}`;
export const getLastGoodKey = (sha256: string) => `blossom:last-good:${sha256}`;
export const getBlurHashKey = (sha256: string) => `blossom:blurhash:${sha256}`;
export const getBadServerKey = (sha256: string, server: string) =>
  `blossom:bad:${sha256}:${server}`;
export const getCachedServersKey = () => `blossom:cached-servers`;
export const getAggregateListKey = () => `blossom:list:aggregate`;
export const getBlobServersKey = (sha256: string) => `blossom:blob:servers:${sha256}`;
export const getBlobIndexKey = () => `blossom:blob:index`;

// SHA256 hash utility using Web Crypto API (Edge Runtime compatible)
export async function sha256Hex(buffer: Buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(buffer));
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Create MASTER-signed auth for specific action with optional x tags
export function createMasterAuthBase64(
  privateKey: string,
  action: "get" | "upload" | "list" | "delete",
  xTags?: string[],
  expirationSeconds: number = 60 * 60 * 24,
): string {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ["t", action],
    ["expiration", String(nowSeconds + expirationSeconds)],
  ];

  if (xTags && xTags.length) {
    for (const x of xTags) {
      tags.push(["x", x]);
    }
  }

  const authEvent: EventTemplate = {
    kind: 24242,
    created_at: nowSeconds,
    content: `${action} Blob`,
    tags,
  };

  const signedEvent = finalizeEvent(authEvent, hexToBytes(privateKey));

  return Buffer.from(JSON.stringify(signedEvent)).toString("base64");
}

// Create Nostr authorization event for Blossom server access (for list operations)
export function createBlossomAuthEvent(privateKey: string): string {
  const ONE_HOUR_IN_SECONDS = 60 * 60;

  const nowSeconds = Math.floor(Date.now() / 1000);

  const authEvent: EventTemplate = {
    kind: 24242,
    created_at: nowSeconds,
    content: "List Blobs",
    tags: [
      ["t", "list"],
      ["expiration", (nowSeconds + ONE_HOUR_IN_SECONDS).toString()],
    ],
  };

  const signedEvent = finalizeEvent(authEvent, hexToBytes(privateKey));

  const base64Event = Buffer.from(JSON.stringify(signedEvent)).toString("base64");

  console.log("base64Event", base64Event);

  return base64Event;
}

// Cache management functions
export async function markServerGood(
  redis: RedisClient,
  sha256: string,
  server: string,
): Promise<void> {
  const lastGoodKey = getLastGoodKey(sha256);

  await redis.set(lastGoodKey, server); // No TTL - persistent until server fails

  // Clear bad flag
  const badKey = getBadServerKey(sha256, server);
  await redis.del(badKey);
}

export async function markServerBad(
  redis: RedisClient,
  sha256: string,
  server: string,
): Promise<void> {
  const badKey = getBadServerKey(sha256, server);

  await redis.set(badKey, "1"); // No TTL - persistent until server succeeds
}

export async function isServerBad(
  redis: RedisClient,
  sha256: string,
  server: string,
): Promise<boolean> {
  const badKey = getBadServerKey(sha256, server);

  return !!(await redis.exists(badKey));
}

// Extract sha256 from URL (last 64-char hex string per BUD-03)
export function extractSha256FromUrl(url: string): string | null {
  const matches = url.match(/[a-f0-9]{64}/gi);

  return matches ? matches[matches.length - 1] : null;
}
