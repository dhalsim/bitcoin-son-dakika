import { nip19, type EventTemplate } from "nostr-tools";

import { getCache } from "./cache";
import type { EventItem, ProfileItem } from "./nip01";
import { getUserPubkey, signEventByNip07 } from "./nip07";
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
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [6], // kind 6 (repost)
      "#e": [event.id],
    },
    {
      receivedEvent(relay, id) {
        receivedEventRelayMap.set(id, relay.url);
      },
      alreadyHaveEvent(id) {
        return cachedReposts.has(id);
      },
      onevent: (evt) => {
        const relay = receivedEventRelayMap.get(evt.id);

        if (!relay) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        newReposts.set(evt.id, { ...evt, relay });
        cachedReposts.set(evt.id, { ...evt, relay });

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

export async function postRepost(
  event: EventItem,
  author: ProfileItem,
  publishRelays: string[],
  onSuccess: () => void,
  onError: (reason: string) => void,
) {
  if (publishRelays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getUserPubkey();

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
      ["e", event.id, event.relay], // e tag with event id and relay URL
      ["p", event.pubkey, author.relay], // p tag with the pubkey of the event being reposted
    ],
  };

  const signedRepostEvent = await signEventByNip07(repostEvent);

  if (!signedRepostEvent) {
    return onError("Repost imzası alınamadı");
  }

  const publishResult = await publishToRelays(signedRepostEvent, publishRelays);

  if (publishResult.some((result) => result.success)) {
    onSuccess();
  } else {
    onError("Repost gönderimi başarısız");
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
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [1],
      "#q": identifier === event.id ? [identifier] : [event.id, identifier],
    },
    {
      receivedEvent(relay, id) {
        receivedEventRelayMap.set(id, relay.url);
      },
      alreadyHaveEvent(id) {
        return cachedQuotes.has(id);
      },
      onevent: (evt) => {
        const relay = receivedEventRelayMap.get(evt.id);

        if (!relay) {
          console.error("Received event from unknown relay", evt);

          return;
        }

        if (cachedQuotes.has(evt.id)) {
          return;
        }

        newQuotes.set(evt.id, { ...evt, relay });
        cachedQuotes.set(evt.id, { ...evt, relay });

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

export async function postQuoteRepost(
  event: EventItem,
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
    console.error("User pubkey not found");

    return onError("Kullanıcı anahtarı alınamadı");
  }

  // Create NIP-21 nevent for the quoted event
  const nevent = nip19.neventEncode({
    id: event.id,
    author: event.pubkey,
    kind: event.kind,
    relays: [event.relay],
  });

  // Combine user content with the nevent
  const fullContent = `"${content.trim()}"\n\nnostr:${nevent}`;

  const quoteEvent: EventTemplate = {
    kind: 1,
    content: fullContent,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["q", event.id, event.relay, event.pubkey], // q tag for quote repost
    ],
  };

  const signedQuoteEvent = await signEventByNip07(quoteEvent);

  if (!signedQuoteEvent) {
    return onError("Quote repost imzası alınamadı");
  }

  const publishResult = await publishToRelays(signedQuoteEvent, publishRelays);

  if (publishResult.some((result) => result.success)) {
    onSuccess();
  } else {
    onError("Quote repost gönderimi başarısız");
  }
}
