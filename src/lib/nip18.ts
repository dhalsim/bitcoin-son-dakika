import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export function getReposts(
  event: NostrEvent,
  relays: string[],
  onUpdate: (reposts: NostrEvent[]) => void,
) {
  const cachedReposts = cache.getNip18Reposts(event.id);

  if (cachedReposts) {
    onUpdate(cachedReposts);
  }

  const reposts = [];

  pool.subscribeEose(
    relays,
    {
      kinds: [6], // kind 6 (repost)
      "#e": [event.id],
    },
    {
      onevent: (evt) => {
        reposts.push(evt);
      },
      onclose: () => {
        const sortedReposts = reposts.sort(
          (a, b) => a.created_at - b.created_at,
        );

        if (cachedReposts && sortedReposts.length) {
          const sortedRepostsIds = sortedReposts
            .map((repost) => repost.id)
            .join(",");
          const cachedRepostsIds = cachedReposts
            .map((repost) => repost.id)
            .join(",");

          if (sortedRepostsIds === cachedRepostsIds) {
            // nothing to update
            return;
          }
        }

        cache.setNip18Reposts(event.id, sortedReposts);

        onUpdate(sortedReposts);
      },
    },
  );
}
