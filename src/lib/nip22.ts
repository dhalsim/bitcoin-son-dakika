import type { EventTemplate } from "nostr-tools";

import type { GetPublicKey, SignEvent } from "@/contexts/NostrAuthContext";

import { getCache } from "./cache";
import type { EventItem, ProfileItem } from "./nip01";
import { pool, publishToRelays } from "./utils";

const cache = getCache();

export type ReplyNode = {
  event: EventItem;
  children: ReplyNode[];
  depth: number;
  isRoot: boolean;
};

type GetArticleRepliesParams = {
  rootEvent: EventItem;
  aTag: string;
  relays: string[];
  cachedReplies: Map<string, EventItem>;
  onUpdate: (replies: Map<string, EventItem>) => void;
};

export function getArticleReplies({
  rootEvent,
  aTag,
  relays,
  cachedReplies,
  onUpdate,
}: GetArticleRepliesParams) {
  const newReplies = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [1111],
      "#A": [aTag],
      "#K": [rootEvent.kind.toString()],
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

        if (eoseCalled) {
          onUpdate(new Map(newReplies));
          newReplies.clear();

          cache.setNip22ArticleReplies(aTag, cachedReplies);
        }
      },
      oneose: () => {
        eoseCalled = true;

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
 * @param events Map of reply events
 * @param rootEvent The root article event
 * @returns A tree structure of ReplyNode objects
 */
export function createNip22Thread(
  events: Map<string, EventItem>,
  rootEvent: EventItem,
): ReplyNode[] {
  if (!events || events.size === 0) {
    return [];
  }

  // Verify that the root event is valid
  if (rootEvent.kind !== 30023) {
    console.warn(`Root event must be kind 30023, got ${rootEvent.kind}`);

    return [];
  }

  const rootEventId = rootEvent.id;

  // Create a map of parent ID to children
  const childrenMap = new Map<string, EventItem[]>();

  events.forEach((event) => {
    // Find the A tags (article references) - NIP-22 uses A tags to identify which article this reply belongs to
    const root_aTag = event.tags.find((tag) => tag[0] === "A")?.[1];

    if (!root_aTag) {
      return; // Skip events that don't have an A tag (not article replies)
    }

    // Find the parent event ID from the small letter 'e' tag
    // This indicates which event this is replying to
    const parentEventId = event.tags.find((tag) => tag[0] === "e")?.[1];

    if (!parentEventId) {
      return; // Skip events that don't have a parent reference
    }

    if (!childrenMap.has(parentEventId)) {
      childrenMap.set(parentEventId, []);
    }

    childrenMap.get(parentEventId)!.push(event);
  });

  // Recursive function to build the tree
  function buildNode(eventId: string, depth: number): ReplyNode | null {
    const event = events.get(eventId);
    if (!event) {
      return null;
    }

    const children = childrenMap.get(eventId) || [];

    // Sort children by date (newest first), then by child count (fewer children first)
    const sortedChildren = children.sort((a, b) => {
      // First sort by date (newest first)
      if (a.created_at !== b.created_at) {
        return b.created_at - a.created_at;
      }

      // Then sort by child count (fewer children first) to maintain visual hierarchy
      const aChildren = childrenMap.get(a.id)?.length || 0;
      const bChildren = childrenMap.get(b.id)?.length || 0;

      return aChildren - bChildren;
    });

    const childNodes = sortedChildren
      .map((child) => buildNode(child.id, depth + 1))
      .filter((node): node is ReplyNode => node !== null);

    return {
      event,
      children: childNodes,
      depth,
      isRoot: eventId === rootEventId,
    };
  }

  // Find root-level replies (those that directly reference the root event as parent)
  const rootLevelReplies = Array.from(events.values()).filter((event) => {
    const parentEventId = event.tags.find((tag) => tag[0] === "e")?.[1];

    return parentEventId === rootEventId;
  });

  // Sort root-level replies by date (newest first), then by child count (fewer children first)
  const sortedRootReplies = rootLevelReplies.sort((a, b) => {
    // First sort by date (newest first)
    if (a.created_at !== b.created_at) {
      return b.created_at - a.created_at;
    }

    // Then sort by child count (fewer children first) to maintain visual hierarchy
    const aChildren = childrenMap.get(a.id)?.length || 0;
    const bChildren = childrenMap.get(b.id)?.length || 0;

    return aChildren - bChildren;
  });

  // Build the thread structure
  const thread = sortedRootReplies
    .map((event) => buildNode(event.id, 0))
    .filter((node): node is ReplyNode => node !== null);

  return thread;
}

type Root = {
  event: EventItem;
  author: ProfileItem;
};

type Parent = {
  event: EventItem;
  author: ProfileItem;
};

export type PostNip22ReplyParams = {
  root: Root;
  parent: Parent | null;
  content: string;
  publishRelays: string[];
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;
  onSuccess: () => void;
  onError: (reason: string) => void;
};

export async function postNip22Reply({
  root,
  parent,
  content,
  publishRelays,
  getPublicKey,
  signEvent,
  onSuccess,
  onError,
}: PostNip22ReplyParams) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getPublicKey({ options: { reason: "Yanıt gönderimi" } });

  if (!userPubkey) {
    return onError("Kullanıcı anahtarı alınamadı");
  }

  const root_dTag = root.event.tags.find((tag) => tag[0] === "d")?.[1];

  if (!root_dTag) {
    return onError("root d tag bulunamadı");
  }

  if (root.event.kind !== 30023) {
    return onError("root event kind 30023 değil");
  }

  const root_aTag = `30023:${root.event.pubkey}:${root_dTag}`;

  // first add root tags
  const tags = [
    ["A", root_aTag, root.event.relay], // root a tag with relay hint
    ["K", "30023"], // root kind tag
    ["P", root.author.pubkey, root.author.relay], // root p tag
  ];

  if (parent) {
    if (parent.event.kind !== 1111) {
      return onError("parent event kind 1111 değil");
    }

    // then add parent tags
    tags.push(
      ["e", parent.event.id, parent.event.relay, parent.author.pubkey], // parent e tag
      ["k", "1111"], // parent kind tag
      ["p", parent.author.pubkey, parent.author.relay], // parent p tag
    );
  } else {
    // if no parent, add for root again
    tags.push(
      ["a", root_aTag, root.event.relay],
      ["e", root.event.id, root.event.relay],
      ["k", "30023"],
      ["p", root.author.pubkey, root.author.relay],
    );
  }

  const replyEvent: EventTemplate = {
    kind: 1111,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  };

  try {
    const { signedEvent } = await signEvent({ event: replyEvent });

    if (!signedEvent) {
      return onError("Yanıt imzası alınamadı");
    }

    const publishResult = await publishToRelays(signedEvent, publishRelays);

    if (publishResult.some((result) => result.success)) {
      onSuccess();
    } else {
      onError("Yanıt gönderimi başarısız");
    }
  } catch (error) {
    console.error("Failed to sign reply event:", error);

    return onError("Yanıt imzası alınamadı");
  }
}
