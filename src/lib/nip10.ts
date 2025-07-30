import { type NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export type ReplyNode = {
  event: NostrEvent;
  children: ReplyNode[];
  depth: number;
};

export function getEventIdentifier(event: NostrEvent) {
  if (event.kind === 1) {
    return event.id;
  }

  if (event.kind === 30023) {
    const d = event.tags.find((tag) => tag[0] === "d")?.[1];

    if (!d) {
      throw new Error("Cannot find d tag in kind 30023 event");
    }

    return `30023:${event.pubkey}:${d}`;
  }

  throw new Error("Invalid event kind");
}

export function getKind1Quotes(
  event: NostrEvent,
  relays: string[],
  onUpdate: (quotes: NostrEvent[]) => void,
) {
  const identifier = getEventIdentifier(event);
  const cachedQuotes = cache.getNip10Quotes(identifier);

  if (cachedQuotes) {
    onUpdate(cachedQuotes);
  }

  const quotes = [];

  pool.subscribeEose(
    relays,
    {
      kinds: [1],
      "#q": identifier === event.id ? [identifier] : [event.id, identifier],
    },
    {
      onevent: (evt) => {
        quotes.push(evt);
      },
      onclose: () => {
        const sortedQuotes = quotes.sort((a, b) => a.created_at - b.created_at);

        if (cachedQuotes && sortedQuotes.length) {
          const sortedQuotesIds = sortedQuotes
            .map((quote) => quote.id)
            .join(",");
          const cachedQuotesIds = cachedQuotes
            .map((quote) => quote.id)
            .join(",");

          if (sortedQuotesIds === cachedQuotesIds) {
            // nothing to update
            return;
          }
        }

        cache.setNip10Quotes(identifier, sortedQuotes);

        onUpdate(sortedQuotes);
      },
    },
  );
}

export function getKind1Replies(
  event: NostrEvent,
  relays: string[],
  onUpdate: (replies: NostrEvent[]) => void,
) {
  const cachedReplies = cache.getNip10Replies(event.id);

  if (cachedReplies) {
    onUpdate(cachedReplies);
  }

  const eventId = event.id;

  const replies = [];

  pool.subscribeEose(
    relays,
    {
      kinds: [1],
      "#e": [eventId],
    },
    {
      onevent: (evt) => {
        // validate event tags that it has to have an e tag with marker root
        if (!evt.tags.some((tag) => tag[0] === "e" && tag[3] === "root")) {
          return;
        }

        replies.push(evt);
      },
      onclose: () => {
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

        cache.setNip10Replies(eventId, sortedReplies);

        onUpdate(sortedReplies);
      },
    },
  );
}

/**
 * Creates a thread structure from NIP-10 reply events
 * @param events Array of reply events
 * @param rootEventId The ID of the root event
 * @returns A tree structure of ReplyNode objects
 */
export function createNip10Thread(
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
    // Find the e tags (event references)
    const eTags = event.tags.filter((tag) => tag[0] === "e");

    let replyToId: string | null = null;

    // Parse NIP-10 markers according to spec
    for (const tag of eTags) {
      const [, eventId, , marker] = tag;

      if (marker === "reply") {
        // This is the direct parent being replied to
        replyToId = eventId;
        break;
      }
    }

    // If no "reply" marker found, this is a direct reply to the root
    if (!replyToId) {
      replyToId = rootEventId;
    }

    // Add to children map (except for root event itself)
    if (replyToId && replyToId !== rootEventId) {
      if (!childrenMap.has(replyToId)) {
        childrenMap.set(replyToId, []);
      }

      childrenMap.get(replyToId)!.push(event);
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
    };
  }

  // Find root-level replies (direct replies to root event)
  const rootLevelReplies = events.filter((event) => {
    const eTags = event.tags.filter((tag) => tag[0] === "e");

    // Check if this event has a "reply" marker
    const hasReplyMarker = eTags.some((tag) => tag[3] === "reply");

    // If no "reply" marker, it's a root-level reply
    return !hasReplyMarker;
  });

  // Build the thread structure
  const thread = rootLevelReplies
    .map((event) => buildNode(event.id, 0))
    .filter((node): node is ReplyNode => node !== null);

  return thread;
}
