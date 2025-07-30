import type { NostrEvent } from "nostr-tools";

import { getCache } from "./cache";

type RelayEntry = {
  read: boolean;
  write: boolean;
};

type RelaysEntries = Record<string, RelayEntry>;

export type Nip07Relays = {
  readRelays: string[];
  writeRelays: string[];
};

export function toReadWriteRelays(relaysEntries: RelaysEntries): Nip07Relays {
  const readRelays: string[] = [];
  const writeRelays: string[] = [];

  for (const [relayUrl, relay] of Object.entries(relaysEntries)) {
    if (relay.read) {
      readRelays.push(relayUrl);
    }

    if (relay.write) {
      writeRelays.push(relayUrl);
    }
  }

  return { readRelays, writeRelays };
}

const cache = getCache();

export async function getNip07Relays(
  pubkey: string,
  onUpdate: (relays: Nip07Relays) => void,
) {
  const cachedFromStorage = cache.getNip07(pubkey);

  if (cachedFromStorage) {
    onUpdate(cachedFromStorage);
  }

  const relays: RelaysEntries = await window.nostr.getRelays();
  const result = toReadWriteRelays(relays);

  const sortedReadRelays = result.readRelays.sort();
  const sortedWriteRelays = result.writeRelays.sort();

  const sortedHash = `${sortedReadRelays.join(",")},${sortedWriteRelays.join(",")}`;

  const sortedCacheReadRelays = cachedFromStorage?.readRelays.sort();
  const sortedCacheWriteRelays = cachedFromStorage?.writeRelays.sort();

  const sortedCacheHash = `${sortedCacheReadRelays.join(",")},${sortedCacheWriteRelays.join(",")}`;

  if (sortedHash === sortedCacheHash) {
    // nothing to update
    return;
  }

  cache.setNip07(pubkey, result);

  onUpdate(result);
}

export async function getUserPubkey(): Promise<string | null> {
  if (!window.nostr) {
    return null;
  }

  return window.nostr.getPublicKey();
}

export async function signEventByNip07(
  event: Omit<NostrEvent, "id" | "sig" | "pubkey">,
): Promise<NostrEvent | null> {
  if (!window.nostr) {
    return null;
  }

  return window.nostr.signEvent(event);
}
