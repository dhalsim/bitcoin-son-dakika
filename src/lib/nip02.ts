import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

type FollowsData = {
  event: NostrEvent;
  followRelays: string[];
};

const cache = getCache();

export async function getFollowsEvent(
  pubkey: string,
  userWriteRelays: string[],
  onUpdate: (data: FollowsData | null) => void,
) {
  const cachedFollowsData = cache.getNip02(pubkey);

  if (cachedFollowsData) {
    onUpdate(cachedFollowsData);
  }

  const userFollowListEvent = await pool.get(userWriteRelays, {
    kinds: [3],
    authors: [pubkey],
    limit: 1,
  });

  if (!userFollowListEvent) {
    onUpdate(null);

    return;
  }

  if (
    cachedFollowsData &&
    userFollowListEvent.id === cachedFollowsData.event.id
  ) {
    // nothing to update
    return;
  }

  cache.setNip02(pubkey, {
    event: userFollowListEvent,
    followRelays: userWriteRelays,
  });

  onUpdate({
    event: userFollowListEvent,
    followRelays: userWriteRelays,
  });
}
