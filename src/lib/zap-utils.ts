import { type NostrEvent, nip57 } from "nostr-tools";

import { getCache } from "./cache";
import { getUserPubkey, signEventByNip07 } from "./nip07";
import { validateZapReceipt, type LnUrlpResponse } from "./nip57";
import { pool } from "./utils";

export interface ZapRequest {
  event: NostrEvent;
  callback: string;
  lnurl: string;
}

// Default relays for zap receipts
export const DEFAULT_ZAP_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nos.social",
];

interface CreateZapParams {
  zappedEvent: NostrEvent;
  amountInSats: number;
  lnurlData: LnUrlpResponse;
  relays: string[];
  comment?: string;
}

// Complete zap flow
export async function createZap({
  zappedEvent,
  amountInSats,
  lnurlData,
  comment,
  relays,
}: CreateZapParams): Promise<string> {
  try {
    const zapRequestEvent = nip57.makeZapRequest({
      profile: zappedEvent.pubkey,
      event: zappedEvent,
      amount: amountInSats * 1000,
      comment,
      relays,
    });

    const signedZapRequestEvent = await signEventByNip07(zapRequestEvent);

    // GET request to zap endpoint
    const zapEndpoint = lnurlData.callback;

    const url = `${zapEndpoint}?amount=${amountInSats * 1000}&nostr=${encodeURIComponent(
      JSON.stringify(signedZapRequestEvent),
    )}&comment=${encodeURIComponent(comment)}`;

    let invoice: string | null = null;

    try {
      const zapRequest = await fetch(url);

      const result = await zapRequest.json();

      if (result.status === "ERROR") {
        throw new Error(result.reason || "Unknown error");
      }

      invoice = result.pr;
    } catch (error) {
      console.error("Failed to fetch zap request:", error);

      return null;
    }

    return invoice;
  } catch (error) {
    console.error("Failed to create zap:", error);

    return null;
  }
}

// Check if user has zapped an event
export function hasUserZapped(
  eventId: string,
  userPubkey: string,
  zaps: Map<string, any>,
): boolean {
  for (const zap of zaps.values()) {
    if (
      zap.event.tags.some(
        (tag: string[]) => tag[0] === "e" && tag[1] === eventId,
      )
    ) {
      // Check if this zap was made by the current user
      const pTag = zap.event.tags.find((tag: string[]) => tag[0] === "P");
      if (pTag && pTag[1] === userPubkey) {
        return true;
      }
    }
  }

  return false;
}

const cache = getCache();

// Listen for zap receipt for a specific invoice
export async function listenForZapReceipt(
  event: NostrEvent,
  invoice: string,
  lnurlData: LnUrlpResponse,
  relays: string[],
  onReceipt: (zapReceipt: any | null) => void,
) {
  const userPubkey = await getUserPubkey();

  if (!userPubkey) {
    onReceipt(null);

    return;
  }

  let received = false;

  pool.subscribeEose(
    relays,
    {
      authors: [lnurlData.nostrPubkey],
      kinds: [9735], // zap receipt
      "#e": [event.id], // for this specific event
      "#p": [event.pubkey], // for this specific author
    },
    {
      onevent: (zapReceiptEvent: NostrEvent) => {
        console.log("Zap receipt event", zapReceiptEvent);
      },
    },
  );

  pool.subscribeEose(
    relays,
    {
      authors: [lnurlData.nostrPubkey],
      kinds: [9735], // zap receipt
      "#e": [event.id], // for this specific event
      "#p": [event.pubkey], // for this specific author
      "#P": [userPubkey], // by this specific user
      since: Math.floor(Date.now() / 1000) - 30, // now - 30 seconds
    },
    {
      onevent: (zapReceiptEvent: NostrEvent) => {
        if (received) {
          console.warn("Zap receipt already received");

          return;
        }

        const zapReceipt = validateZapReceipt(zapReceiptEvent, invoice);

        if (!zapReceipt) {
          return;
        }

        // Validate the receipt author matches the LNURL provider
        if (zapReceiptEvent.pubkey !== lnurlData.nostrPubkey) {
          console.warn("Zap receipt author doesn't match LNURL provider");

          return;
        }

        received = true;

        onReceipt(zapReceiptEvent);

        const cachedZaps = cache.getNip57Zaps(event.id) || new Map();

        if (cachedZaps.has(zapReceiptEvent.id)) {
          return;
        }

        // add to cache
        cachedZaps.set(zapReceiptEvent.id, zapReceipt);
        cache.setNip57Zaps(event.id, cachedZaps);
      },
    },
  );
}
