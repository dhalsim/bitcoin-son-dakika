import { nip19, type EventTemplate, type NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { getUserPubkey, signEventByNip07 } from "./nip07";
import { pool, publishToRelays } from "./utils";

const cache = getCache();

export function getReposts(
  event: NostrEvent,
  relays: string[],
  onUpdate: (reposts: NostrEvent[]) => void,
) {
  const cachedReposts = cache.getNip18Reposts(event.id);

  if (cachedReposts) {
    onUpdate(cachedReposts);
  }

  const reposts = [];

  pool.subscribeEose(
    relays,
    {
      kinds: [6], // kind 6 (repost)
      "#e": [event.id],
    },
    {
      onevent: (evt) => {
        reposts.push(evt);
      },
      onclose: () => {
        const sortedReposts = reposts.sort(
          (a, b) => a.created_at - b.created_at,
        );

        if (cachedReposts && sortedReposts.length) {
          const sortedRepostsIds = sortedReposts
            .map((repost) => repost.id)
            .join(",");
          const cachedRepostsIds = cachedReposts
            .map((repost) => repost.id)
            .join(",");

          if (sortedRepostsIds === cachedRepostsIds) {
            // nothing to update
            return;
          }
        }

        cache.setNip18Reposts(event.id, sortedReposts);

        onUpdate(sortedReposts);
      },
    },
  );
}

export async function postRepost(
  event: NostrEvent,
  relays: string[],
  onSuccess: () => void,
  onError: (reason: string) => void,
) {
  if (relays.length === 0) {
    return onError("Relayler bulunamadı");
  }

  const userPubkey = await getUserPubkey();

  if (!userPubkey) {
    console.error("User pubkey not found");

    return onError("Kullanıcı anahtarı alınamadı");
  }

  const content = nip19.neventEncode({
    id: event.id,
    author: event.pubkey,
    kind: event.kind,
    relays,
  });

  const repostEvent: EventTemplate = {
    kind: 6,
    content,
    created_at: Math.floor(Date.now() / 1000),
    // TODO: add relay hint
    tags: [["q", event.id, relays[0], event.pubkey]],
  };

  const signedRepostEvent = await signEventByNip07(repostEvent);

  if (!signedRepostEvent) {
    return onError("Repost imzası alınamadı");
  }

  const publishResult = await publishToRelays(signedRepostEvent, relays);

  if (publishResult.some((result) => result.success)) {
    onSuccess();
  } else {
    onError("Repost gönderimi başarısız");
  }
}
