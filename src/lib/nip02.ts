import type { NostrEvent } from "nostr-tools";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { getNip07Relays } from "./nip07";
import { fetchNip65Relays } from "./nip65";
import { pool } from "./utils";

type FollowsData = {
  event: NostrEvent;
  followRelays: string[];
};

const cache = getCache();

export async function getFollowsEvent(
  pubkey: string,
  onUpdate: (data: FollowsData | null) => void,
) {
  const cachedFollowsData = cache.getNip02(pubkey);

  if (cachedFollowsData) {
    onUpdate(cachedFollowsData);
  }

  getNip07Relays(pubkey, (nip07Relays) => {
    fetchNip65Relays(PROFILE_RELAYS, pubkey, async (nip65Relays) => {
      let relays = PROFILE_RELAYS;

      if (nip65Relays) {
        const userOutboxRelays = new Set([
          ...nip07Relays.writeRelays,
          ...nip65Relays.writeRelays,
        ]);

        relays = Array.from(userOutboxRelays);
      }

      const userFollowListEvent = await pool.get(relays, {
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
        followRelays: relays,
      });

      onUpdate({
        event: userFollowListEvent,
        followRelays: relays,
      });
    });
  });
}
