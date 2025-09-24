import type { RedisClient } from "../../common.js";
import { getBlossomServersEvent, MASTER_ADMIN_PUBKEY } from "../../common_with_client.js";

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

// Anonymous fetch: try to populate per-server cache and inverted index without Authorization
async function fetchBlobListFromServerAnonymous(
  redis: RedisClient,
  server: string,
  pubkey: string,
): Promise<number> {
  try {
    const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

    const response = await fetch(`${serverUrl}/list/${pubkey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return 0;
    }

    const responseData = await response.json();

    let blobs: Array<{
      url: string;
      sha256: string;
      size: number;
      type: string;
      uploaded: number;
    }> = [];
    if (Array.isArray(responseData)) {
      blobs = responseData.map((item: any) => ({
        url: item.url,
        sha256: item.sha256,
        size: item.size,
        type: item.type,
        uploaded: item.uploaded,
      }));
    } else if (responseData && Array.isArray(responseData.blobs)) {
      blobs = responseData.blobs.map((item: any) => ({
        url: item.url,
        sha256: item.sha256,
        size: item.size,
        type: item.type,
        uploaded: item.uploaded,
      }));
    } else if (responseData && responseData.status === "success") {
      blobs = [
        {
          url: responseData.url,
          sha256: responseData.sha256,
          size: responseData.size,
          type: responseData.type,
          uploaded: responseData.uploaded,
        },
      ];
    }

    // Cache per-server list
    await redis.set(getServerCacheKey(server), JSON.stringify(blobs));

    // Update inverted index
    const pipeline = redis.multi();
    const blobIndexKey = getBlobIndexKey();

    for (const b of blobs) {
      if (!b?.sha256 || b.sha256.length !== 64) {
        continue;
      }

      pipeline.sAdd(getBlobServersKey(b.sha256), server);
      pipeline.sAdd(blobIndexKey, b.sha256);
    }

    if ((pipeline as any).length) {
      await pipeline.exec();
    }

    return blobs.length;
  } catch (e) {
    // ignore failures; some servers may require Authorization
    const _ignored = e;
    void _ignored;

    return 0;
  }
}

export async function ensureIndexFromAnonymousFetch(
  redis: RedisClient,
  servers: string[],
): Promise<void> {
  for (const server of servers) {
    // Only fetch if no cache exists
    const cached = await redis.get(getServerCacheKey(server));
    if (cached) {
      continue;
    }

    await fetchBlobListFromServerAnonymous(redis, server, MASTER_ADMIN_PUBKEY);
  }
}
