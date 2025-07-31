import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export type CustomEmoji = {
  name: string;
  url: string | null;
  events: NostrEvent[];
};

export type EmojiMap = {
  [emoji: string]: NostrEvent[];
};

export function getReactions(
  event: NostrEvent,
  relays: string[],
  onUpdate: (reactions: Map<string, NostrEvent>) => void,
) {
  const cachedReactions = cache.getNip25Reactions(event.id) || new Map();

  if (cachedReactions.size) {
    onUpdate(cachedReactions);
  }

  let fetched = false;

  pool.subscribeEose(
    relays,
    {
      kinds: [7], // kind 7 (reaction)
      "#e": [event.id],
    },
    {
      onevent: (evt) => {
        if (cachedReactions.has(evt.id)) {
          return;
        }

        cachedReactions.set(evt.id, evt);
        fetched = true;
      },
      onclose: () => {
        if (fetched) {
          cache.setNip25Reactions(event.id, cachedReactions);

          onUpdate(cachedReactions);
        }
      },
    },
  );
}
