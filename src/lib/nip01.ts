import type { NostrEvent } from "nostr-tools";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export function subscribeKind0Event(
  authors: string[],
  onUpdate: (pubkey: string, event: NostrEvent) => void,
) {
  authors.forEach((author) => {
    const cachedEvent = cache.getKind0Event(author);

    if (cachedEvent) {
      onUpdate(author, cachedEvent);
    }
  });

  pool.subscribe(
    PROFILE_RELAYS,
    {
      authors,
      kinds: [0],
    },
    {
      onevent: (event) => {
        const cachedEvent = cache.getKind0Event(event.pubkey);

        if (cachedEvent && event.id === cachedEvent.id) {
          // nothing to update
          return;
        }

        cache.setKind0Event(event.pubkey, event);

        onUpdate(event.pubkey, event);
      },
    },
  );
}
