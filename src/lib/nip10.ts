import type { EventTemplate } from "nostr-tools";

import { getCache } from "./cache";
import type { EventItem, ProfileItem } from "./nip01";
import { getUserPubkey, signEventByNip07 } from "./nip07";
import { pool, publishToRelays } from "./utils";
const cache = getCache();

export type ReplyNode = {
  event: EventItem;
  children: ReplyNode[];
  depth: number;
};

export function getEventIdentifier(event: EventItem) {
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
  event: EventItem,
  relays: string[],
  cachedReplies: Map<string, EventItem>,
  onUpdate: (replies: Map<string, EventItem>) => void,
) {
  const eventId = event.id;

  const newReplies = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [1],
      "#e": [eventId],
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

        // validate event tags that it has to have an e tag with marker root
        if (!evt.tags.some((tag) => tag[0] === "e" && tag[3] === "root")) {
          return;
        }

        if (cachedReplies.has(evt.id)) {
          return;
        }

        newReplies.set(evt.id, { ...evt, relay });
        cachedReplies.set(evt.id, { ...evt, relay });

        if (eoseCalled) {
          onUpdate(new Map(newReplies));
          newReplies.clear();

          cache.setNip10Replies(event.id, cachedReplies);
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newReplies.size) {
          onUpdate(new Map(newReplies));
          newReplies.clear();

          cache.setNip10Replies(event.id, cachedReplies);
        }
      },
    },
  );

  return () => {
    sub.close();
  };
}

export async function postKind1Reply(
  event: EventItem,
  author: ProfileItem,
  content: string,
  publishRelays: string[],
  onSuccess: () => void,
  onError: (reason: string) => void,
) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getUserPubkey();

  if (!userPubkey) {
    return onError("Kullanıcı anahtarı alınamadı");
  }

  const replyEvent: EventTemplate = {
    kind: 1,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["e", event.id, event.relay], // e tag with event id and relay URL
      ["p", event.pubkey, author.relay], // p tag with the pubkey of the event being replied to
    ],
  };

  const signedReplyEvent = await signEventByNip07(replyEvent);

  if (!signedReplyEvent) {
    return onError("Reply imzası alınamadı");
  }

  const publishResult = await publishToRelays(signedReplyEvent, publishRelays);

  if (publishResult.some((result) => result.success)) {
    onSuccess();
  } else {
    onError("Reply gönderimi başarısız");
  }
}

/**
 * Creates a thread structure from NIP-10 reply events
 * @param events Array of reply events
 * @param rootEventId The ID of the root event
 * @returns A tree structure of ReplyNode objects
 */
export function createNip10Thread(
  events: Map<string, EventItem>,
  rootEventId: string,
): ReplyNode[] {
  if (!events || events.size === 0) {
    return [];
  }

  // Create a map of parent ID to children
  const childrenMap = new Map<string, EventItem[]>();

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
