import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export type ReplyNode = {
  event: NostrEvent;
  children: ReplyNode[];
  depth: number;
  isRoot: boolean;
};

export function getArticleReplies(
  rootEvent: NostrEvent,
  relays: string[],
  onUpdate: (replies: NostrEvent[]) => void,
) {
  const d = rootEvent.tags.find((tag) => tag[0] === "d")?.[1];

  if (!d) {
    throw new Error("Cannot find d tag in kind 30023 event");
  }

  const aTag = `30023:${rootEvent.pubkey}:${d}`;
  const cachedReplies = cache.getNip22ArticleReplies(aTag);

  if (cachedReplies) {
    onUpdate(cachedReplies);
  }

  const replies = [];

  pool.subscribe(
    relays,
    {
      kinds: [1111],
      "#A": [aTag],
      "#K": [rootEvent.kind.toString()],
      "#P": [rootEvent.pubkey],
    },
    {
      onevent: (evt) => {
        replies.push(evt);
      },
      oneose: () => {
        const sortedReplies = replies.sort(
          (a, b) => a.created_at - b.created_at,
        );

        if (cachedReplies && sortedReplies.length) {
          const sortedRepliesIds = sortedReplies
            .map((reply) => reply.id)
            .join(",");
          const cachedRepliesIds = cachedReplies
            .map((reply) => reply.id)
            .join(",");

          if (sortedRepliesIds === cachedRepliesIds) {
            // nothing to update
            return;
          }
        }

        cache.setNip22ArticleReplies(aTag, sortedReplies);

        onUpdate(sortedReplies);
      },
    },
  );
}

/**
 * Creates a thread structure from NIP-22 article reply events
 * @param events Array of reply events
 * @param rootEventId The ID of the root event
 * @returns A tree structure of ReplyNode objects
 */
export function createNip22Thread(
  events: NostrEvent[],
  rootEventId: string,
): ReplyNode[] {
  if (!events || events.length === 0) {
    return [];
  }

  // Create a map of event ID to event for quick lookup
  const eventMap = new Map<string, NostrEvent>();
  events.forEach((event) => {
    eventMap.set(event.id, event);
  });

  // Create a map of parent ID to children
  const childrenMap = new Map<string, NostrEvent[]>();

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
    const event = eventMap.get(eventId);
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
  const rootLevelReplies = events.filter((event) => {
    const aTags = event.tags.filter((tag) => tag[0] === "A");

    return aTags.length === 1 && aTags[0][1] === rootEventId;
  });

  // Build the thread structure
  const thread = rootLevelReplies
    .map((event) => buildNode(event.id, 0))
    .filter((node): node is ReplyNode => node !== null);

  return thread;
}
