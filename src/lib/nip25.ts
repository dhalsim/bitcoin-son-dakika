import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export type EmojiMap = {
  [emoji: string]: NostrEvent[];
};

export type Reactions = {
  likes: NostrEvent[];
  dislikes: NostrEvent[];
  emojis: EmojiMap;
};

export function getReactions(
  event: NostrEvent,
  relays: string[],
  onUpdate: (reactions: NostrEvent[]) => void,
) {
  const cachedReactions = cache.getNip25Reactions(event.id);

  if (cachedReactions) {
    onUpdate(cachedReactions);
  }

  const allReactions: NostrEvent[] = [];

  pool.subscribeEose(
    relays,
    {
      kinds: [7], // kind 7 (reaction)
      "#e": [event.id],
    },
    {
      onevent: (evt) => {
        allReactions.push(evt);
      },
      onclose: () => {
        const sortedReactions = allReactions.sort(
          (a, b) => a.created_at - b.created_at,
        );

        if (cachedReactions && sortedReactions.length) {
          const sortedReactionsIds = sortedReactions
            .map((reaction) => reaction.id)
            .join(",");
          const cachedReactionsIds = cachedReactions
            .map((reaction) => reaction.id)
            .join(",");

          if (sortedReactionsIds === cachedReactionsIds) {
            // nothing to update
            return;
          }
        }

        cache.setNip25Reactions(event.id, sortedReactions);

        onUpdate(sortedReactions);
      },
    },
  );
}
