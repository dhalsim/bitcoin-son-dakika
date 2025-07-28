import type { NostrEvent } from "nostr-tools";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { getNip07Relays } from "./nip07";
import { fetchNip65Relays } from "./nip65";
import { pool } from "./utils";

const cache = getCache();

export async function getFollowsEvent(
  pubkey: string,
  onUpdate: (event: NostrEvent) => void,
) {
  const cachedFromStorage = cache.getNip02(pubkey);

  if (cachedFromStorage) {
    onUpdate(cachedFromStorage);
  }

  getNip07Relays(pubkey, (nip07Relays) => {
    fetchNip65Relays(PROFILE_RELAYS, pubkey, async (nip65Relays) => {
      const userOutboxRelays = new Set([
        ...nip07Relays.writeRelays,
        ...nip65Relays.writeRelays,
      ]);

      const userFollowListEvent = await pool.get(Array.from(userOutboxRelays), {
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      });

      if (!userFollowListEvent) {
        return;
      }

      cache.setNip02(pubkey, userFollowListEvent);

      onUpdate(userFollowListEvent);
    });
  });
}
