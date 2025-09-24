import type { RedisClient } from "../../common.js";
import { MASTER_ADMIN_PUBKEY, getBlossomServersEvent } from "../../common_with_client.js";

import {
  createBlossomAuthEvent,
  getAggregateListKey,
  getBadServerKey,
  getBlurHashKey,
  getCachedServersKey,
  getLastGoodKey,
  getServerCacheKey,
} from "./common.js";

type ServerState = {
  url: string;
  lastGood: boolean;
  bad: boolean;
};

type FileListItem = {
  hash: string;
  blurhash?: string;
  servers: ServerState[];
};

function parseBlobList(value: string | null): Array<{ sha256: string }> | null {
  if (!value) {
    return null;
  }

  if (value === "null") {
    return [];
  }

  try {
    const arr = JSON.parse(value);
    if (Array.isArray(arr)) {
      return arr as Array<{ sha256: string }>;
    }
  } catch (_e) {
    // ignore
  }

  return [];
}

async function ensureServerListCache(
  redis: RedisClient,
  server: string,
  masterAdminPrivateKey: string,
): Promise<void> {
  const existing = await redis.get(getServerCacheKey(server));

  if (existing !== null) {
    return;
  }

  const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

  const auth = createBlossomAuthEvent(masterAdminPrivateKey);

  try {
    const res = await fetch(`${serverUrl}/list/${MASTER_ADMIN_PUBKEY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Nostr ${auth}`,
      },
    });

    if (!res.ok) {
      await redis.set(getServerCacheKey(server), "null");

      return;
    }

    const data = await res.json();

    let blobs: Array<{ sha256: string }> = [];

    if (Array.isArray(data)) {
      blobs = data as Array<{ sha256: string }>;
    } else if (data && Array.isArray(data.blobs)) {
      blobs = data.blobs as Array<{ sha256: string }>;
    } else if (data && data.status === "success" && data.sha256) {
      blobs = [{ sha256: data.sha256 }];
    }

    if (!blobs.length) {
      await redis.set(getServerCacheKey(server), "null");

      return;
    }

    await redis.set(getServerCacheKey(server), JSON.stringify(blobs));
  } catch (_e) {
    await redis.set(getServerCacheKey(server), "null");
  }
}

async function getServersPreferCache(redis: RedisClient): Promise<string[]> {
  const cached = await redis.get(getCachedServersKey());

  if (cached) {
    try {
      const servers = JSON.parse(cached);

      if (Array.isArray(servers) && servers.length) {
        return servers as string[];
      }
    } catch (e) {
      console.warn("Failed to parse cached servers:", e);
    }
  }

  // Fallback: fetch servers from Nostr kind:10063 when cache is empty
  try {
    const evt = await getBlossomServersEvent();

    if (evt && Array.isArray(evt.tags)) {
      const servers = evt.tags
        .filter((t: string[]) => t[0] === "server" && t[1])
        .map((t: string[]) => t[1]);

      if (servers.length > 0) {
        const _7daysInSeconds = 60 * 60 * 24 * 7;

        await redis.set(getCachedServersKey(), JSON.stringify(servers), {
          expiration: { type: "EX", value: _7daysInSeconds },
        });

        return servers as string[];
      }
    }
  } catch (e) {
    console.warn("Failed to fetch servers from Nostr:", e);
  }

  return [];
}

export async function listOfBlobToServers(
  redis: RedisClient,
  masterAdminPrivateKey: string,
): Promise<FileListItem[]> {
  // 0) Aggregate cache fast-path
  const aggregateKey = getAggregateListKey();

  const cachedAggregate = await redis.get(aggregateKey);

  if (cachedAggregate) {
    try {
      return JSON.parse(cachedAggregate) as FileListItem[];
    } catch (e) {
      console.warn("Failed to parse cached aggregate:", e);
    }
  }

  // 1) Resolve servers (cache-first)
  const servers = await getServersPreferCache(redis);

  if (servers.length === 0) {
    console.warn("No servers available");

    return [];
  }

  // 2) Ensure per-server list caches
  for (const server of servers) {
    await ensureServerListCache(redis, server, masterAdminPrivateKey);
  }

  // 3) Merge per-server caches into hash -> Set(servers)
  const hashToServers = new Map<string, Set<string>>();

  for (const server of servers) {
    const list = parseBlobList(await redis.get(getServerCacheKey(server)));

    if (!list || !list.length) {
      console.warn(`No blobs found for server ${server}`);

      continue;
    }

    for (const item of list) {
      if (!item?.sha256 || item.sha256.length !== 64) {
        console.warn(`Invalid blob hash for server ${server}: ${item?.sha256}`);

        continue;
      }

      const set = hashToServers.get(item.sha256) || new Set<string>();

      set.add(server);

      hashToServers.set(item.sha256, set);
    }
  }

  // 4) Assemble response with blurhash and flags
  const result: FileListItem[] = [];

  for (const [hash, serverSet] of hashToServers) {
    const serversArr = Array.from(serverSet);

    const blurMetaStr = await redis.get(getBlurHashKey(hash));

    let blurhash: string | undefined;

    if (blurMetaStr) {
      try {
        const parsed = JSON.parse(blurMetaStr);

        blurhash = parsed?.blurhash;
      } catch (e) {
        console.warn(`Failed to parse blurhash for ${hash}: ${e}`);
      }
    }

    const lastGood = await redis.get(getLastGoodKey(hash));

    const serversWithFlags: ServerState[] = [];

    for (const s of serversArr) {
      const bad = (await redis.exists(getBadServerKey(hash, s))) > 0;

      serversWithFlags.push({ url: s, lastGood: !!lastGood && lastGood === s, bad });
    }

    result.push({ hash, blurhash, servers: serversWithFlags });
  }

  // 5) Cache aggregate result in Redis (no TTL)
  await redis.set(aggregateKey, JSON.stringify(result));

  return result;
}
