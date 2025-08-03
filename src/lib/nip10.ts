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

// TODO: deletion of replies is not supported yet
export function getKind1Replies(
  event: NostrEvent,
  relays: string[],
  onUpdate: (replies: Map<string, NostrEvent>) => void,
) {
  const cachedReplies = cache.getNip10Replies(event.id) || new Map();

  if (cachedReplies.size) {
    onUpdate(cachedReplies);
  }

  const eventId = event.id;
  let fetched = false;

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

        if (cachedReplies.has(evt.id)) {
          return;
        }

        cachedReplies.set(evt.id, evt);
        fetched = true;
      },
      onclose: () => {
        if (fetched) {
          console.log("onclose", eventId, cachedReplies.size);

          cache.setNip10Replies(eventId, cachedReplies);

          onUpdate(cachedReplies);
        }
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
  events: Map<string, NostrEvent>,
  rootEventId: string,
): ReplyNode[] {
  if (!events || events.size === 0) {
    return [];
  }

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
    };
  }

  // Find root-level replies (direct replies to root event)
  const rootLevelReplies = Array.from(events.values()).filter((event) => {
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
