import { nip19, type EventTemplate, type NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { getUserPubkey, signEventByNip07 } from "./nip07";
import { getEventIdentifier } from "./nip10";
import { pool, publishToRelays } from "./utils";

const cache = getCache();

export function getReposts(
  event: NostrEvent,
  relays: string[],
  cachedReposts: Map<string, NostrEvent>,
  onUpdate: (reposts: Map<string, NostrEvent>) => void,
) {
  const newReposts = new Map<string, NostrEvent>();

  const sub = pool.subscribe(
    relays,
    {
      kinds: [6], // kind 6 (repost)
      "#e": [event.id],
    },
    {
      alreadyHaveEvent(id) {
        return cachedReposts.has(id);
      },
      onevent: (evt) => {
        newReposts.set(evt.id, evt);
        cachedReposts.set(evt.id, evt);
      },
      oneose: () => {
        // Got all stored events
        // send the reposts that we didn't send yet
        if (newReposts.size) {
          onUpdate(newReposts);
          newReposts.clear();

          // now we need to update the cache with all the reposts
          // Create a new Map to avoid mutation issues
          const updatedReposts = new Map([...cachedReposts]);
          cache.setNip18Reposts(event.id, updatedReposts);
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
  event: NostrEvent,
  relayHint: string,
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
      ["e", event.id, relayHint], // e tag with event id and relay URL
      ["p", event.pubkey], // p tag with the pubkey of the event being reposted
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
  event: NostrEvent,
  relays: string[],
  onUpdate: (quotes: Map<string, NostrEvent>) => void,
) {
  const identifier = getEventIdentifier(event);
  const cachedQuotes = cache.getNip18Quotes(identifier);

  if (cachedQuotes && cachedQuotes.size) {
    onUpdate(cachedQuotes);
  }

  let fetched = false;

  pool.subscribeEose(
    relays,
    {
      kinds: [1],
      "#q": identifier === event.id ? [identifier] : [event.id, identifier],
    },
    {
      onevent: (evt) => {
        if (cachedQuotes.has(evt.id)) {
          return;
        }

        cachedQuotes.set(evt.id, evt);
        fetched = true;
      },
      onclose: () => {
        if (fetched) {
          cache.setNip18Quotes(identifier, cachedQuotes);

          onUpdate(cachedQuotes);
        }
      },
    },
  );
}

export async function postQuoteRepost(
  event: NostrEvent,
  content: string,
  relayHint: string,
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
    relays: [relayHint],
  });

  // Combine user content with the nevent
  const fullContent = `"${content.trim()}"\n\nnostr:${nevent}`;

  const quoteEvent: EventTemplate = {
    kind: 1,
    content: fullContent,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["q", event.id, relayHint, event.pubkey], // q tag for quote repost
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
