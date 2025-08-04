import { getCache } from "./cache";
import type { EventItem } from "./nip01";
import { pool } from "./utils";

const cache = getCache();

export type CustomEmoji = {
  name: string;
  url: string | null;
  events: EventItem[];
};

export function getReactions(
  event: EventItem,
  relays: string[],
  cachedReactions: Map<string, EventItem>,
  onUpdate: (reactions: Map<string, EventItem>) => void,
) {
  const newReactions = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  const sub = pool.subscribe(
    relays,
    {
      kinds: [7], // kind 7 (reaction)
      "#e": [event.id],
    },
    {
      receivedEvent(relay, id) {
        receivedEventRelayMap.set(id, relay.url);
      },
      alreadyHaveEvent(id) {
        return cachedReactions.has(id);
      },
      onevent: (evt) => {
        const relay = receivedEventRelayMap.get(evt.id);

        if (!relay) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        if (cachedReactions.has(evt.id)) {
          return;
        }

        newReactions.set(evt.id, { ...evt, relay });
        cachedReactions.set(evt.id, { ...evt, relay });
      },
      oneose: () => {
        // Got all stored events
        // send the reposts that we didn't send yet
        if (newReactions.size) {
          onUpdate(new Map(newReactions));
          newReactions.clear();

          cache.setNip25Reactions(event.id, cachedReactions);
        }
      },
    },
  );

  return () => {
    sub.close();
  };
}
