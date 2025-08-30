import { type NostrEvent } from "nostr-tools";
import { verifyEvent } from "nostr-tools/pure";
import { z } from "zod";

import { getCache } from "./cache";
import type { EventItem } from "./nip01";
import { pool } from "./utils";

const cache = getCache();

export type ZapRequest = Omit<NostrEvent, "relays"> & {
  relays: string[];
};

export type ZapReceipt = {
  event: EventItem;
  amount: number; // in satoshis
  comment?: string;
  zapRequest: ZapRequest;
};

export function extractZapRequestRelays(zapRequestEvent: NostrEvent): string[] {
  const relaysTag = zapRequestEvent.tags.find((tag) => tag[0] === "relays");

  if (!relaysTag) {
    return [];
  }

  const [, ...relays] = relaysTag;

  return Array.from(new Set(relays));
}

// Helper function to extract amount from bolt11 invoice
export function extractAmountFromBolt11(bolt11: string): number {
  try {
    // Match prefix like lnbc1m or lnbc10.5u
    const match = bolt11.match(/^ln[a-z]+(\d+(\.\d+)?)([munp])?/i);
    if (!match) {
      return 0;
    }

    const amount = parseFloat(match[1]);
    const multiplier = match[3] || ""; // If no multiplier, it's in BTC

    switch (multiplier) {
      case "m":
        return amount * 100_000; // 1 mBTC = 100_000 sats
      case "u":
        return amount * 100; // 1 μBTC = 100 sats
      case "n":
        return amount / 10; // 1 nBTC = 0.1 sats
      case "p":
        return amount / 10_000; // 1 pBTC = 0.0001 sats
      default:
        return amount * 100_000_000; // BTC to sats
    }
  } catch (e) {
    console.warn("Failed to extract amount from BOLT11:", e);

    return 0;
  }
}

// Helper function to validate zap receipt according to NIP-57
export function validateZapReceipt(zapReceipt: EventItem, invoice?: string): ZapReceipt | null {
  try {
    // Find bolt11 tag
    const bolt11Tag = zapReceipt.tags.find((tag) => tag[0] === "bolt11");
    if (!bolt11Tag || !bolt11Tag[1]) {
      return null;
    }

    if (invoice && bolt11Tag[1] !== invoice) {
      return null;
    }

    // Find description tag (contains the zap request)
    const descriptionTag = zapReceipt.tags.find((tag) => tag[0] === "description");

    if (!descriptionTag || !descriptionTag[1]) {
      return null;
    }

    // Parse the zap request from description
    let zapRequest: NostrEvent | undefined;
    try {
      zapRequest = JSON.parse(descriptionTag[1]);
    } catch {
      return null;
    }

    // Validate zap request kind
    if (!zapRequest || zapRequest.kind !== 9734) {
      return null;
    }

    const relays = extractZapRequestRelays(zapRequest);

    if (relays.length === 0) {
      return null;
    }

    if (!verifyEvent(zapRequest)) {
      return null;
    }

    // Extract amount from bolt11
    const amount = extractAmountFromBolt11(bolt11Tag[1]);

    // Extract comment from zap request
    const comment = zapRequest.content?.trim() || undefined;

    return {
      event: zapReceipt,
      amount,
      comment,
      zapRequest: {
        ...zapRequest,
        relays,
      },
    };
  } catch (error) {
    console.warn("Failed to validate zap receipt:", error);

    return null;
  }
}

export function getZaps(
  event: NostrEvent,
  relays: string[],
  cachedZaps: Map<string, ZapReceipt>,
  onUpdate: (zaps: Map<string, ZapReceipt>) => void,
) {
  const newZaps = new Map<string, ZapReceipt>();
  const receivedEventRelayMap = new Map<string, string[]>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      kinds: [9735], // kind 9735 (zap receipt)
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

        const validZap = validateZapReceipt({ ...evt, relays });

        if (!validZap) {
          console.warn("Invalid zap receipt:", evt.id);

          return;
        }

        newZaps.set(evt.id, validZap);
        cachedZaps.set(evt.id, validZap);

        if (eoseCalled) {
          onUpdate(new Map(newZaps));
          newZaps.clear();

          cache.setNip57Zaps(event.id, cachedZaps);
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newZaps.size) {
          onUpdate(new Map(newZaps));
          newZaps.clear();

          cache.setNip57Zaps(event.id, cachedZaps);
        }
      },
    },
  );

  return () => {
    sub.close();
  };
}

const LnUrlpResponse = z.object({
  callback: z.string(),
  nostrPubkey: z.string(),
  allowsNostr: z.boolean(),
  minSendable: z.number(),
  maxSendable: z.number(),
  tag: z.enum(["payRequest"]),
});

export type LnUrlpResponse = z.infer<typeof LnUrlpResponse>;

export async function getLnurlData(lud16: string): Promise<LnUrlpResponse | null> {
  const [username, domain] = lud16.split("@");

  const lnurl = `https://${domain}/.well-known/lnurlp/${username}`;

  try {
    const lnurlPayRequest = await fetch(lnurl);
    const lnurlPayRequestJson = await lnurlPayRequest.json();

    const parsed = LnUrlpResponse.parse(lnurlPayRequestJson);

    return parsed;
  } catch (error) {
    console.error("Failed to get LNURL data:", error);

    return null;
  }
}
