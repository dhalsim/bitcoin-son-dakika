// Cache utility for localStorage persistence
import type { NostrEvent } from "nostr-tools";

import type { EmojiCategories, EmojiUsage } from "@/types/emoji";

import type { Nip07Relays } from "./nip07";

export class LocalStorageCache {
  private static instance: LocalStorageCache;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_PREFIX = "bsd-cache-";

  private constructor() {
    // No longer loading everything at startup
  }

  static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache();
    }

    return LocalStorageCache.instance;
  }

  private getStorageKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getFromStorage(key: string): any {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(
        `Failed to load cache key "${key}" from localStorage:`,
        error,
      );
    }

    return undefined;
  }

  private setToStorage(key: string, value: any): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save cache key "${key}" to localStorage:`, error);
    }
  }

  private deleteFromStorage(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(
        `Failed to delete cache key "${key}" from localStorage:`,
        error,
      );
    }
  }

  private getCachedValue<T>(key: string): T | null {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Lazy load from localStorage if not in memory
    const value = this.getFromStorage(key);

    if (value !== undefined) {
      this.cache.set(key, value);
    } else {
      return null;
    }
  }

  getEmojiMap(): EmojiCategories | null {
    return this.getCachedValue<EmojiCategories>("emoji-map");
  }

  setEmojiMap(value: EmojiCategories): void {
    this.cache.set("emoji-map", value);
    this.setToStorage("emoji-map", value);
  }

  getEmojiUsage(defaultUsage: EmojiUsage): EmojiUsage {
    const cached = this.getCachedValue<EmojiUsage>("emoji-usage");

    if (cached) {
      return cached;
    }

    // Cache the default values
    this.cache.set("emoji-usage", defaultUsage);
    this.setToStorage("emoji-usage", defaultUsage);

    return defaultUsage;
  }

  setEmojiUsage(value: { [emoji: string]: number }): void {
    this.cache.set("emoji-usage", value);
    this.setToStorage("emoji-usage", value);
  }

  getNip65Event(pubkey: string): NostrEvent | null {
    return this.getCachedValue(`nip65-${pubkey}`);
  }

  setNip65Event(pubkey: string, value: NostrEvent | null): void {
    const key = `nip65-${pubkey}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip02(
    pubkey: string,
  ): { event: NostrEvent; followRelays: string[] } | null {
    return this.getCachedValue(`nip02-${pubkey}`);
  }

  setNip02(
    pubkey: string,
    value: { event: NostrEvent; followRelays: string[] },
  ): void {
    const key = `nip02-${pubkey}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip07(pubkey: string): Nip07Relays | null {
    return this.getCachedValue(`nip07-${pubkey}`);
  }

  setNip07(pubkey: string, value: Nip07Relays): void {
    const key = `nip07-${pubkey}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip10Replies(eventId: string): NostrEvent[] | null {
    return this.getCachedValue(`nip10-replies-${eventId}`);
  }

  setNip10Replies(eventId: string, replies: NostrEvent[]): void {
    const key = `nip10-replies-${eventId}`;
    this.cache.set(key, replies);
    this.setToStorage(key, replies);
  }

  getNip10Quotes(identifier: string): NostrEvent[] | null {
    return this.getCachedValue(`nip10-quotes-${identifier}`);
  }

  setNip10Quotes(identifier: string, value: NostrEvent[]): void {
    const key = `nip10-quotes-${identifier}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip22NewsReplies(eventId: string): NostrEvent[] | null {
    return this.getCachedValue(`nip22-news-replies-${eventId}`);
  }

  setNip22NewsReplies(eventId: string, value: NostrEvent[]): void {
    const key = `nip22-news-replies-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip22ArticleReplies(aTag: string): NostrEvent[] | null {
    return this.getCachedValue(`nip22-article-replies-${aTag}`);
  }

  setNip22ArticleReplies(aTag: string, value: NostrEvent[]): void {
    const key = `nip22-article-replies-${aTag}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip18Reposts(eventId: string): NostrEvent[] | null {
    return this.getCachedValue(`nip18-reposts-${eventId}`);
  }

  setNip18Reposts(eventId: string, value: NostrEvent[]): void {
    const key = `nip18-reposts-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip25Reactions(eventId: string): NostrEvent[] | null {
    return this.getCachedValue(`nip25-reactions-${eventId}`);
  }

  setNip25Reactions(eventId: string, value: NostrEvent[]): void {
    const key = `nip25-reactions-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getDraft(eventId: string): string | null {
    return this.getCachedValue(`draft-${eventId}`);
  }

  setDraft(eventId: string, value: string): void {
    const key = `draft-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  deleteDraft(eventId: string): void {
    const key = `draft-${eventId}`;
    this.cache.delete(key);
    this.deleteFromStorage(key);
  }

  getKind0Event(pubkey: string): NostrEvent | null {
    return this.getCachedValue(`kind0-${pubkey}`);
  }

  setKind0Event(pubkey: string, value: NostrEvent): void {
    const key = `kind0-${pubkey}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key) || this.getFromStorage(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.deleteFromStorage(key);
  }
}

// Helper function to get cache instance
export function getCache(): LocalStorageCache {
  return LocalStorageCache.getInstance();
}
