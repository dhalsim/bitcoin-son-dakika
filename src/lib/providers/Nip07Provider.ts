import type { NostrEvent } from "nostr-tools";

import type { NostrProvider } from "@/contexts/NostrAuthContext";

export class Nip07Provider implements NostrProvider<"nip07"> {
  method: "nip07";

  constructor() {
    // Validate that NIP-07 is available
    if (typeof window === "undefined" || !window.nostr) {
      throw new Error("NIP-07 extension not available");
    }
  }

  async isReady(): Promise<boolean> {
    try {
      // Test if the extension is responsive
      await window.nostr.getPublicKey();

      return true;
    } catch (error) {
      console.warn("NIP-07 extension not ready:", error);

      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    if (typeof window === "undefined" || !window.nostr) {
      throw new Error("NIP-07 extension not available");
    }

    try {
      return await window.nostr.getPublicKey();
    } catch (error) {
      console.error("Failed to get public key from NIP-07:", error);

      throw new Error("Failed to get public key from extension");
    }
  }

  async signEvent(event: Omit<NostrEvent, "id" | "sig" | "pubkey">): Promise<NostrEvent> {
    if (typeof window === "undefined" || !window.nostr) {
      throw new Error("NIP-07 extension not available");
    }

    try {
      return await window.nostr.signEvent(event as any);
    } catch (error) {
      console.error("Failed to sign event with NIP-07:", error);

      throw new Error("Failed to sign event with extension");
    }
  }

  async getRelays(): Promise<Nip07Relays> {
    if (
      typeof window === "undefined" ||
      !window.nostr ||
      typeof window.nostr.getRelays !== "function"
    ) {
      throw new Error("NIP-07 getRelays capability not available");
    }

    try {
      const relays: RelaysEntries = await window.nostr.getRelays();
      const result = toReadWriteRelays(relays);

      return result;
    } catch (error) {
      console.error("Failed to get relays from NIP-07:", error);

      throw new Error("Failed to get relays from extension");
    }
  }

  hasCapability(cap: "getRelays" | "signEvent"): boolean {
    switch (cap) {
      case "signEvent":
        return (
          typeof window !== "undefined" &&
          !!window.nostr &&
          typeof window.nostr.signEvent === "function"
        );
      case "getRelays":
        return (
          typeof window !== "undefined" &&
          !!window.nostr &&
          typeof window.nostr.getRelays === "function"
        );
      default:
        return false;
    }
  }

  dispose(): void {
    // NIP-07 provider doesn't need cleanup
  }
}

/**
 * Check if NIP-07 extension is available in the browser
 */
export function isNip07Available(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

/**
 * Create a new NIP-07 provider instance
 */
export function createNip07Provider(): Nip07Provider {
  return new Nip07Provider();
}

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
