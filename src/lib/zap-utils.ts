import type { EventTemplate } from "nostr-tools";
import { type NostrEvent } from "nostr-tools";

import { getCache } from "./cache";
import { getUserPubkey, signEventByNip07 } from "./nip07";
import { validateZapReceipt, type LnUrlpResponse, type ZapReceipt } from "./nip57";
import { pool } from "./utils";

export interface ZapRequest {
  event: NostrEvent;
  callback: string;
  lnurl: string;
}

// Default relays for zap receipts
export const DEFAULT_ZAP_RELAYS = [
  "wss://relay.nostr.band/",
  "wss://relay.damus.io/",
  "wss://nos.lol/",
  "wss://relay.primal.net/",
  "wss://relay.snort.social/",
  "wss://nostr.bitcoiner.social/",
  "wss://nostr.mom/",
  "wss://nostr-pub.wellorder.net/",
  "wss://relay.nos.social/",
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
    const amountInMilliSats = amountInSats * 1000;

    const zapRequestEvent: EventTemplate = {
      kind: 9734,
      created_at: Math.round(Date.now() / 1000),
      content: comment || "",
      tags: [
        ["e", zappedEvent.id],
        ["p", zappedEvent.pubkey],
        ["amount", amountInMilliSats.toString()],
        ["relays", ...relays],
      ],
    };

    const signedZapRequestEvent = await signEventByNip07(zapRequestEvent);

    // GET request to zap endpoint
    const zapEndpoint = lnurlData.callback;

    const url = `${zapEndpoint}?amount=${amountInMilliSats}&nostr=${encodeURIComponent(
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

const cache = getCache();

// Listen for zap receipt for a specific invoice
export async function listenForZapReceipt(
  event: NostrEvent,
  invoice: string,
  lnurlData: LnUrlpResponse,
  relays: string[],
  onReceipt: (zapReceipt: ZapReceipt | null) => void,
) {
  const userPubkey = await getUserPubkey();

  if (!userPubkey) {
    onReceipt(null);

    return;
  }

  let received = false;

  const receivedEventRelayMap = new Map<string, string>();

  const subCloser = pool.subscribe(
    relays,
    {
      authors: [lnurlData.nostrPubkey],
      kinds: [9735], // zap receipt
      "#e": [event.id], // for this specific event
      "#p": [event.pubkey], // for this specific author
      since: Math.floor(Date.now() / 1000) - 30, // now - 30 seconds
    },
    {
      receivedEvent(relay, id) {
        receivedEventRelayMap.set(id, relay.url);
      },
      onevent: (zapReceiptEvent: NostrEvent) => {
        if (received) {
          console.warn("Zap receipt already received");

          return;
        }

        const relay = receivedEventRelayMap.get(zapReceiptEvent.id);

        if (!relay) {
          console.warn("Received event from unknown relay", zapReceiptEvent);

          return;
        }

        const zapReceipt = validateZapReceipt({ ...zapReceiptEvent, relay }, invoice);

        if (!zapReceipt) {
          return;
        }

        const zapRequest = zapReceipt.zapRequest;

        if (zapRequest.pubkey !== userPubkey) {
          console.warn("Zap request author should match with the user pubkey");

          return;
        }

        // Validate the receipt author matches the LNURL provider
        if (zapReceiptEvent.pubkey !== lnurlData.nostrPubkey) {
          console.warn("Zap receipt author doesn't match LNURL provider");

          return;
        }

        const bolt11Tag = zapReceiptEvent.tags.find((tag: string[]) => tag[0] === "bolt11")?.[1];

        if (!bolt11Tag) {
          console.warn("Zap receipt bolt11 tag is missing");

          return;
        }

        if (bolt11Tag !== invoice) {
          console.warn("Zap receipt bolt11 tag doesn't match the invoice");

          return;
        }

        received = true;

        onReceipt(zapReceipt);

        const cachedZaps = cache.getNip57Zaps(event.id) || new Map();

        if (cachedZaps.has(zapReceiptEvent.id)) {
          return;
        }

        // add to cache
        cachedZaps.set(zapReceiptEvent.id, zapReceipt);
        cache.setNip57Zaps(event.id, cachedZaps);

        subCloser.close();
      },
    },
  );
}
