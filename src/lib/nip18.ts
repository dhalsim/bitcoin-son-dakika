import { nip19, type EventTemplate } from "nostr-tools";

import type { GetPublicKey, SignEvent } from "@/contexts/NostrAuthContext";

import { getCache } from "./cache";
import type { EventItem, ProfileItem } from "./nip01";
import { getEventIdentifier } from "./nip10";
import { pool, publishToRelays } from "./utils";

const cache = getCache();

export function getReposts(
  event: EventItem,
  relays: string[],
  cachedReposts: Map<string, EventItem>,
  onUpdate: (reposts: Map<string, EventItem>) => void,
) {
  const newReposts = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string[]>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [6], // kind 6 (repost)
      "#e": [event.id],
    },
    {
      receivedEvent(relay, id) {
        const relays = receivedEventRelayMap.get(id) ?? [];

        receivedEventRelayMap.set(id, [...relays, relay.url]);
      },
      onevent: (evt) => {
        const relays = receivedEventRelayMap.get(evt.id);

        if (!relays || relays.length === 0) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        newReposts.set(evt.id, { ...evt, relays });
        cachedReposts.set(evt.id, { ...evt, relays });

        if (eoseCalled) {
          onUpdate(new Map(newReposts));
          newReposts.clear();

          cache.setNip18Reposts(event.id, cachedReposts);
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newReposts.size) {
          onUpdate(new Map(newReposts));
          newReposts.clear();

          cache.setNip18Reposts(event.id, cachedReposts);
        }
      },
    },
  );

  // Return cleanup function
  return () => {
    sub.close();
  };
}

export type PostRepostParams = {
  event: EventItem;
  author: ProfileItem;
  publishRelays: string[];
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;
  onSuccess: () => void;
  onError: (reason: string) => void;
};

export async function postRepost({
  event,
  author,
  publishRelays,
  getPublicKey,
  signEvent,
  onSuccess,
  onError,
}: PostRepostParams) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getPublicKey({ options: { reason: "Yeniden paylaşma" } });

  if (!userPubkey) {
    console.error("User pubkey not found");

    return onError("Kullanıcı anahtarı alınamadı");
  }

  // Content should be the stringified JSON of the reposted note
  const content = JSON.stringify(event);

  const repostEvent: EventTemplate = {
    kind: 6,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["e", event.id, event.relays[0]], // e tag with event id and relay URL
      ["p", event.pubkey, author.relays[0]], // p tag with the pubkey of the event being reposted
    ],
  };

  try {
    const { signedEvent: signedRepostEvent } = await signEvent({ event: repostEvent });

    if (!signedRepostEvent) {
      return onError("Repost imzası alınamadı");
    }

    const publishResult = await publishToRelays(signedRepostEvent, publishRelays);

    if (publishResult.some((result) => result.success)) {
      onSuccess();
    } else {
      onError("Repost gönderimi başarısız");
    }
  } catch (error) {
    console.error("Failed to sign repost event:", error);

    return onError("Repost imzası alınamadı");
  }
}

// Quote reposts (kind 1 events with q tags)
export function getKind1Quotes(
  event: EventItem,
  relays: string[],
  cachedQuotes: Map<string, EventItem>,
  onUpdate: (quote: Map<string, EventItem>) => void,
) {
  const identifier = getEventIdentifier(event);

  const newQuotes = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string[]>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [1],
      "#q": identifier === event.id ? [identifier] : [event.id, identifier],
    },
    {
      receivedEvent(relay, id) {
        const relays = receivedEventRelayMap.get(id) ?? [];

        receivedEventRelayMap.set(id, [...relays, relay.url]);
      },
      onevent: (evt) => {
        const relays = receivedEventRelayMap.get(evt.id);

        if (!relays || relays.length === 0) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        if (cachedQuotes.has(evt.id)) {
          return;
        }

        newQuotes.set(evt.id, { ...evt, relays });
        cachedQuotes.set(evt.id, { ...evt, relays });

        if (eoseCalled) {
          onUpdate(new Map(newQuotes));
          newQuotes.clear();

          cache.setNip18Quotes(identifier, cachedQuotes);
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newQuotes.size) {
          onUpdate(new Map(newQuotes));
          newQuotes.clear();

          cache.setNip18Quotes(identifier, cachedQuotes);
        }
      },
    },
  );

  return () => {
    sub.close();
  };
}

export type PostQuoteRepostParams = {
  event: EventItem;
  content: string;
  publishRelays: string[];
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;
  onSuccess: () => void;
  onError: (reason: string) => void;
};

export async function postQuoteRepost({
  event,
  content,
  publishRelays,
  getPublicKey,
  signEvent,
  onSuccess,
  onError,
}: PostQuoteRepostParams) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getPublicKey({ options: { reason: "Alıntı gönderimi" } });

  if (!userPubkey) {
    console.error("User pubkey not found");

    return onError("Kullanıcı anahtarı alınamadı");
  }

  // Create NIP-21 nevent for the quoted event
  const nevent = nip19.neventEncode({
    id: event.id,
    author: event.pubkey,
    kind: event.kind,
    relays: event.relays,
  });

  // Combine user content with the nevent
  const fullContent = `"${content.trim()}"\n\nnostr:${nevent}`;

  const quoteEvent: EventTemplate = {
    kind: 1,
    content: fullContent,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["q", event.id, event.relays[0], event.pubkey], // q tag for quote repost
    ],
  };

  try {
    const { signedEvent: signedQuoteEvent } = await signEvent({ event: quoteEvent });

    if (!signedQuoteEvent) {
      return onError("Quote repost imzası alınamadı");
    }

    const publishResult = await publishToRelays(signedQuoteEvent, publishRelays);

    if (publishResult.some((result) => result.success)) {
      onSuccess();
    } else {
      onError("Quote repost gönderimi başarısız");
    }
  } catch (error) {
    console.error("Failed to sign quote repost event:", error);

    return onError("Quote repost imzası alınamadı");
  }
}
