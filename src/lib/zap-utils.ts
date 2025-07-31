import { type NostrEvent, nip57 } from "nostr-tools";

import { signEventByNip07 } from "./nip07";
import type { LnUrlpResponse } from "./nip57";

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
  event: NostrEvent;
  amountInSats: number;
  lnurlData: LnUrlpResponse;
  relays: string[];
  comment?: string;
}

// Complete zap flow
export async function createZap({
  event,
  amountInSats,
  lnurlData,
  comment,
  relays,
}: CreateZapParams): Promise<string> {
  try {
    const zapRequestEvent = await nip57.makeZapRequest({
      profile: event.pubkey,
      event,
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
