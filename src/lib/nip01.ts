import type { NostrEvent } from "nostr-tools";
import type { SubCloser } from "nostr-tools/abstract-pool";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export async function getKind0Event(
  pubkey: string,
  onUpdate: (event: NostrEvent) => void,
) {
  const cachedEvent = cache.getKind0Event(pubkey);

  if (cachedEvent) {
    onUpdate(cachedEvent);
  }

  let fetchedEvent = null;

  pool.subscribeEose(
    PROFILE_RELAYS,
    {
      authors: [pubkey],
      kinds: [0],
    },
    {
      onevent: (event) => {
        if (fetchedEvent && event.created_at < fetchedEvent.created_at) {
          return;
        }

        fetchedEvent = event;
      },
      onclose: () => {
        onUpdate(fetchedEvent);
      },
    },
  );

  const event = await pool.get(PROFILE_RELAYS, {
    authors: [pubkey],
    kinds: [0],
  });

  if (event) {
    if (cachedEvent && event.created_at < cachedEvent.created_at) {
      // nothing to update
      return;
    }

    if (cachedEvent && event.id === cachedEvent.id) {
      // nothing to update
      return;
    }

    cache.setKind0Event(pubkey, event);

    onUpdate(event);
  }
}

export function subscribeKind0Event(
  authors: string[],
  onUpdate: (pubkey: string, event: NostrEvent) => void,
): SubCloser {
  authors.forEach((author) => {
    const cachedEvent = cache.getKind0Event(author);

    if (cachedEvent) {
      onUpdate(author, cachedEvent);
    }
  });

  return pool.subscribe(
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
          onUpdate(event.pubkey, cachedEvent);

          return;
        }

        if (cachedEvent && event.created_at < cachedEvent.created_at) {
          // nothing to update
          onUpdate(event.pubkey, cachedEvent);

          return;
        }

        cache.setKind0Event(event.pubkey, event);

        onUpdate(event.pubkey, event);
      },
    },
  );
}
