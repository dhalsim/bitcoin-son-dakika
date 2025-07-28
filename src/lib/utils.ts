import { clsx, type ClassValue } from "clsx";
import type { NostrEvent } from "nostr-tools";
import { Relay, SimplePool } from "nostr-tools";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pool = new SimplePool();

export type PublishToRelaysResult =
  | { success: true; relay: string }
  | { success: false; relay: string; error: string };

export function publishToRelays(
  event: NostrEvent,
  relayStrings: string[],
): Promise<PublishToRelaysResult[]> {
  return Promise.all(
    relayStrings.map(async (r) => {
      try {
        const relay = new Relay(r);

        await relay.connect();
        await relay.publish(event);

        return { success: true, relay: r };
      } catch (error) {
        return { success: false, relay: r, error: error.message };
      }
    }),
  );
}
