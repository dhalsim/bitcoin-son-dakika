// Cache utility for localStorage persistence
import type { NostrEvent } from "nostr-tools";

import type { Nip07Relays } from "./nip07";
import type { Nip65Relays } from "./nip65";

export class LocalStorageCache {
  private static instance: LocalStorageCache;
  private cache: Map<string, any> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache();
    }

    return LocalStorageCache.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("nostr-cache");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn("Failed to load cache from localStorage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem("nostr-cache", JSON.stringify(obj));
    } catch (error) {
      console.warn("Failed to save cache to localStorage:", error);
    }
  }

  getNip65(pubkey: string): Nip65Relays {
    return this.cache.get(`nip65-${pubkey}`);
  }

  setNip65(pubkey: string, value: Nip65Relays): void {
    this.cache.set(`nip65-${pubkey}`, value);
    this.saveToStorage();
  }

  getNip02(pubkey: string): NostrEvent {
    return this.cache.get(`nip02-${pubkey}`);
  }

  setNip02(pubkey: string, value: NostrEvent): void {
    this.cache.set(`nip02-${pubkey}`, value);
    this.saveToStorage();
  }

  getNip07(pubkey: string): Nip07Relays {
    return this.cache.get(`nip07-${pubkey}`);
  }

  setNip07(pubkey: string, value: Nip07Relays): void {
    this.cache.set(`nip07-${pubkey}`, value);
    this.saveToStorage();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }
}

// Helper function to get cache instance
export function getCache(): LocalStorageCache {
  return LocalStorageCache.getInstance();
}
