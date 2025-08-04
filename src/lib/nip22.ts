import { getCache } from "./cache";
import type { EventItem } from "./nip01";
import { pool } from "./utils";

const cache = getCache();

export type ReplyNode = {
  event: EventItem;
  children: ReplyNode[];
  depth: number;
  isRoot: boolean;
};

export function getArticleReplies(
  rootEvent: EventItem,
  aTag: string,
  relays: string[],
  cachedReplies: Map<string, EventItem>,
  onUpdate: (replies: Map<string, EventItem>) => void,
) {
  const newReplies = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  const sub = pool.subscribe(
    relays,
    {
      kinds: [1111],
      "#A": [aTag],
      "#K": [rootEvent.kind.toString()],
      "#P": [rootEvent.pubkey],
    },
    {
      receivedEvent(relay, id) {
        receivedEventRelayMap.set(id, relay.url);
      },
      alreadyHaveEvent(id) {
        return cachedReplies.has(id);
      },
      onevent: (evt) => {
        const relay = receivedEventRelayMap.get(evt.id);

        if (!relay) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        if (cachedReplies.has(evt.id)) {
          return;
        }

        newReplies.set(evt.id, { ...evt, relay });
        cachedReplies.set(evt.id, { ...evt, relay });
      },
      oneose: () => {
        if (newReplies.size) {
          onUpdate(new Map(newReplies));
          newReplies.clear();

          cache.setNip22ArticleReplies(aTag, cachedReplies);
        }
      },
    },
  );

  return () => {
    sub.close();
  };
}

/**
 * Creates a thread structure from NIP-22 article reply events
 * @param events Array of reply events
 * @param rootEventId The ID of the root event
 * @returns A tree structure of ReplyNode objects
 */
export function createNip22Thread(
  events: Map<string, EventItem>,
  rootEventId: string,
): ReplyNode[] {
  if (!events || events.size === 0) {
    return [];
  }

  // Create a map of parent ID to children
  const childrenMap = new Map<string, EventItem[]>();

  events.forEach((event) => {
    // Find the A tags (article references) - NIP-22 uses A tags instead of e tags
    const aTags = event.tags.filter((tag) => tag[0] === "A");

    if (aTags.length > 0) {
      // The last A tag is the direct parent
      const parentId = aTags[aTags.length - 1][1];

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }

      childrenMap.get(parentId)!.push(event);
    }
  });

  // Recursive function to build the tree
  function buildNode(eventId: string, depth: number): ReplyNode | null {
    const event = events.get(eventId);
    if (!event) {
      return null;
    }

    const children = childrenMap.get(eventId) || [];
    const childNodes = children
      .map((child) => buildNode(child.id, depth + 1))
      .filter((node): node is ReplyNode => node !== null);

    return {
      event,
      children: childNodes,
      depth,
      isRoot: eventId === rootEventId,
    };
  }

  // Find root-level replies (those that directly reference the root event)
  const rootLevelReplies = Array.from(events.values()).filter((event) => {
    const aTags = event.tags.filter((tag) => tag[0] === "A");

    return aTags.length === 1 && aTags[0][1] === rootEventId;
  });

  // Build the thread structure
  const thread = rootLevelReplies
    .map((event) => buildNode(event.id, 0))
    .filter((node): node is ReplyNode => node !== null);

  return thread;
}
