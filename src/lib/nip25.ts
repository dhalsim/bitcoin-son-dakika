import type { EventTemplate, NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import type { EventItem, ProfileItem } from "./nip01";
import { pool, publishToRelays } from "./utils";

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

  let eoseCalled = false;

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

        if (eoseCalled) {
          onUpdate(new Map(newReactions));
          newReactions.clear();

          cache.setNip25Reactions(event.id, cachedReactions);
        }
      },
      oneose: () => {
        eoseCalled = true;

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

export async function postReaction(
  event: EventItem,
  author: ProfileItem,
  content: string,
  emojiUrl: string | null,
  publishRelays: string[],
  getPublicKey: () => Promise<string | null>,
  signEvent: (event: Omit<NostrEvent, "id" | "sig" | "pubkey">) => Promise<NostrEvent>,
  onSuccess: () => void,
  onError: (reason: string) => void,
) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getPublicKey();

  if (!userPubkey) {
    return onError("Kullanıcı anahtarı alınamadı");
  }

  let aTag: string | null = null;

  if (event.kind === 30023) {
    const dTag = event.tags.find((tag) => tag[0] === "d");

    if (!dTag) {
      return onError("d tag bulunamadı");
    }

    aTag = `30023:${event.pubkey}:${dTag[1]}`;
  }

  const tags = [
    ["e", event.id, event.relay, event.pubkey],
    ["p", event.pubkey, author.relay],
    ["k", String(event.kind)],
  ];

  if (aTag) {
    tags.push(["a", aTag]);
  }

  if (emojiUrl) {
    tags.push(["emoji", content, emojiUrl]);
  }

  const finalContent = emojiUrl ? `:${content}:` : content;

  const reactionEvent: EventTemplate = {
    kind: 7,
    content: finalContent,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  };

  try {
    const signedReactionEvent = await signEvent(reactionEvent);

    if (!signedReactionEvent) {
      return onError("Reaction imzası alınamadı");
    }

    const publishResult = await publishToRelays(signedReactionEvent, publishRelays);

    if (publishResult.some((result) => result.success)) {
      onSuccess();
    } else {
      onError("Reaction gönderimi başarısız");
    }
  } catch (error) {
    console.error("Failed to sign reaction event:", error);

    return onError("Reaction imzası alınamadı");
  }
}
