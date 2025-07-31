import type { NostrEvent } from "nostr-tools";
import { z } from "zod";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export type ZapReceipt = {
  event: NostrEvent;
  amount: number; // in satoshis
  comment?: string;
  zapRequest?: NostrEvent;
};

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
function validateZapReceipt(zapReceipt: NostrEvent): ZapReceipt | null {
  try {
    // Find bolt11 tag
    const bolt11Tag = zapReceipt.tags.find((tag) => tag[0] === "bolt11");
    if (!bolt11Tag || !bolt11Tag[1]) {
      return null;
    }

    // Find description tag (contains the zap request)
    const descriptionTag = zapReceipt.tags.find(
      (tag) => tag[0] === "description",
    );
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

    // Extract amount from bolt11
    const amount = extractAmountFromBolt11(bolt11Tag[1]);

    // Extract comment from zap request
    const comment = zapRequest.content?.trim() || undefined;

    return {
      event: zapReceipt,
      amount,
      comment,
      zapRequest,
    };
  } catch (error) {
    console.warn("Failed to validate zap receipt:", error);

    return null;
  }
}

export function getZaps(
  event: NostrEvent,
  relays: string[],
  onUpdate: (zaps: Map<string, ZapReceipt>) => void,
) {
  const cachedZaps = cache.getNip57Zaps(event.id) || new Map();

  if (cachedZaps && cachedZaps.size > 0) {
    onUpdate(cachedZaps);
  }

  let fetched = false;

  pool.subscribeEose(
    relays,
    {
      kinds: [9735], // kind 9735 (zap receipt)
      "#e": [event.id],
    },
    {
      onevent: (evt) => {
        if (cachedZaps.has(evt.id)) {
          return;
        }

        const validZap = validateZapReceipt(evt);

        if (validZap) {
          cachedZaps.set(evt.id, validZap);
          fetched = true;
        } else {
          console.warn("Invalid zap receipt:", evt.id);
        }
      },
      onclose: () => {
        if (fetched) {
          cache.setNip57Zaps(event.id, cachedZaps);
          onUpdate(cachedZaps);
        }
      },
    },
  );
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

export async function getLnurlData(
  lud16: string,
): Promise<LnUrlpResponse | null> {
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
