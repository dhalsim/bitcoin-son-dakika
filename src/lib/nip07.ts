import type { NostrEvent } from "nostr-tools";

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

export async function getNip07Relays(): Promise<Nip07Relays | null> {
  if (typeof window === "undefined" || !window.nostr) {
    return null;
  }

  try {
    const relays: RelaysEntries = await window.nostr.getRelays();
    const result = toReadWriteRelays(relays);

    return result;
  } catch (error) {
    console.error("Error getting NIP-07 relays", error);

    return null;
  }
}

export async function getUserPubkey(): Promise<string | null> {
  if (typeof window === "undefined" || !window.nostr) {
    return null;
  }

  try {
    return await window.nostr.getPublicKey();
  } catch (error) {
    console.error("Error getting user pubkey", error);

    return null;
  }
}

export async function signEventByNip07(
  event: Omit<NostrEvent, "id" | "sig" | "pubkey">,
): Promise<NostrEvent | null> {
  if (typeof window === "undefined" || !window.nostr) {
    return null;
  }

  try {
    return await window.nostr.signEvent(event);
  } catch (error) {
    console.error("Error signing event", error);

    return null;
  }
}
