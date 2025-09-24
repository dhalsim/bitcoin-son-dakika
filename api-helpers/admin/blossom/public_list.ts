import type { RedisClient } from "../../common.js";
import { getBlossomServersEvent } from "../../common_with_client.js";

import {
  getCachedServersKey,
  getServerCacheKey,
  getBlobServersKey,
  getBlobIndexKey,
  getBlurHashKey,
} from "./common.js";

export type BlobServersItem = {
  hash: string;
  servers: string[];
  blurhash?: string;
};

export async function getAllCandidateServers(redis: RedisClient): Promise<string[]> {
  try {
    const serverEvent = await getBlossomServersEvent();

    if (serverEvent && serverEvent.tags) {
      const userServers = serverEvent.tags
        .filter((tag) => tag[0] === "server")
        .map((tag) => tag[1])
        .filter(Boolean);

      if (userServers.length > 0) {
        return userServers;
      }
    }
  } catch (error) {
    console.warn("Failed to get user server list:", error);
  }

  const cachedServers = await redis.get(getCachedServersKey());
  if (cachedServers) {
    try {
      const servers = JSON.parse(cachedServers);
      if (Array.isArray(servers) && servers.length > 0) {
        return servers;
      }
    } catch (error) {
      console.warn("Failed to parse cached servers:", error);
    }
  }

  return [];
}

export async function ensureInvertedIndexFromServerCaches(
  redis: RedisClient,
  servers: string[],
): Promise<void> {
  const pipeline = redis.multi();
  const blobIndexKey = getBlobIndexKey();

  for (const server of servers) {
    const cached = await redis.get(getServerCacheKey(server));
    if (!cached) {
      continue;
    }

    try {
      const blobs = JSON.parse(cached) as Array<{ sha256: string }>;
      for (const b of blobs) {
        if (!b?.sha256 || b.sha256.length !== 64) {
          continue;
        }

        const blobServersKey = getBlobServersKey(b.sha256);
        pipeline.sAdd(blobServersKey, server);
        pipeline.sAdd(blobIndexKey, b.sha256);
      }
    } catch (e) {
      console.warn(`Failed to parse cached blob list for ${server}:`, e);
    }
  }

  if ((pipeline as any).length) {
    await pipeline.exec();
  }
}

export async function listFromRedis(redis: RedisClient): Promise<BlobServersItem[]> {
  const blobIndexKey = getBlobIndexKey();
  const hashes = await redis.sMembers(blobIndexKey);
  const results: BlobServersItem[] = [];

  if (!hashes || hashes.length === 0) {
    return results;
  }

  for (const sha256 of hashes) {
    const servers = await redis.sMembers(getBlobServersKey(sha256));
    const meta = await redis.get(getBlurHashKey(sha256));
    let blurhash: string | undefined;
    if (meta) {
      try {
        const parsed = JSON.parse(meta);
        blurhash = parsed?.blurhash;
      } catch (e) {
        // ignore invalid blurhash metadata
        const _ignored = e;
        void _ignored;
      }
    }

    results.push({ hash: sha256, servers, blurhash });
  }

  return results;
}
