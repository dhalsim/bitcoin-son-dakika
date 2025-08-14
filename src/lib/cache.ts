import type { BaseEndpointResponse } from "@/types/api";
import type { EmojiCategories, EmojiUsage } from "@/types/emoji";

import type { EventItem, ProfileItem } from "./nip01";
import type { Nip07Relays } from "./nip07";
import type { ZapReceipt } from "./nip57";

// Cache version - increment this when you need to invalidate all cached data
const CACHE_VERSION = "0.2";
const CACHE_VERSION_KEY = "bsd-cache-version";

export class LocalStorageCache {
  private static instance: LocalStorageCache;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_PREFIX = "bsd-cache-";

  private constructor() {
    this.validateCacheVersion();
  }

  static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache();
    }

    return LocalStorageCache.instance;
  }

  /**
   * Validates the cache version and clears all cache if version has changed
   */
  private validateCacheVersion(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);

      // If no version is stored, this is a fresh install or cache was cleared

      if (!storedVersion) {
        this.setCacheVersion();

        return;
      }

      // If version has changed, clear all cache
      if (storedVersion !== CACHE_VERSION) {
        console.log(
          `Cache version changed from ${storedVersion} to ${CACHE_VERSION}. Clearing cache...`,
        );
        this.clearAllCache();
        this.setCacheVersion();
      }
    } catch (error) {
      console.warn("Failed to validate cache version:", error);
      // If there's an error, clear cache to be safe
      this.clearAllCache();
      this.setCacheVersion();
    }
  }

  /**
   * Sets the current cache version in localStorage
   */
  private setCacheVersion(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    } catch (error) {
      console.warn("Failed to set cache version:", error);
    }
  }

  /**
   * Clears all cached data from both memory and localStorage
   */
  private clearAllCache(): void {
    // Clear memory cache
    this.cache.clear();

    // Clear localStorage cache
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const keysToRemove: string[] = [];

      // Find all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all cache keys
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("Cache cleared successfully");
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }

  /**
   * Manually clear the cache (useful for debugging or user-initiated cache clearing)
   */
  public clearCache(): void {
    this.clearAllCache();
    this.setCacheVersion();
  }

  /**
   * Get the current cache version
   */
  public getCacheVersion(): string {
    return CACHE_VERSION;
  }

  private getStorageKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getFromStorage(key: string): any {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return undefined;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to load cache key "${key}" from localStorage:`, error);
    }

    return undefined;
  }

  private setToStorage(key: string, value: any): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save cache key "${key}" to localStorage:`, error);
    }
  }

  private deleteFromStorage(key: string): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to delete cache key "${key}" from localStorage:`, error);
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

      return value;
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

  setEmojiUsage(value: EmojiUsage): void {
    this.cache.set("emoji-usage", value);
    this.setToStorage("emoji-usage", value);
  }

  getNip65Event(pubkey: string): EventItem | null {
    return this.getCachedValue(`nip65-${pubkey}`);
  }

  setNip65Event(pubkey: string, value: EventItem | null): void {
    const key = `nip65-${pubkey}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip02(pubkey: string): { event: EventItem; followRelays: string[] } | null {
    return this.getCachedValue(`nip02-${pubkey}`);
  }

  setNip02(pubkey: string, value: { event: EventItem; followRelays: string[] }): void {
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

  getNip10Replies(eventId: string): Map<string, EventItem> {
    const parsedArray = this.getCachedValue<[string, EventItem][]>(`nip10-replies-${eventId}`);

    return new Map(parsedArray);
  }

  setNip10Replies(eventId: string, replies: Map<string, EventItem>): void {
    const key = `nip10-replies-${eventId}`;
    this.cache.set(key, replies);
    this.setToStorage(key, Array.from(replies.entries()));
  }

  getNip18Quotes(identifier: string): Map<string, EventItem> {
    const parsedArray = this.getCachedValue<[string, EventItem][]>(`nip18-quotes-${identifier}`);

    return new Map(parsedArray);
  }

  getNip18Reposts(eventId: string): Map<string, EventItem> {
    const parsedArray = this.getCachedValue<[string, EventItem][]>(`nip18-reposts-${eventId}`);

    return new Map(parsedArray);
  }

  setNip18Reposts(eventId: string, value: Map<string, EventItem>): void {
    const key = `nip18-reposts-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, Array.from(value.entries()));
  }

  setNip18Quotes(identifier: string, value: Map<string, EventItem>): void {
    const key = `nip18-quotes-${identifier}`;
    this.cache.set(key, value);
    this.setToStorage(key, Array.from(value.entries()));
  }

  getNip22NewsReplies(eventId: string): EventItem[] | null {
    return this.getCachedValue(`nip22-news-replies-${eventId}`);
  }

  setNip22NewsReplies(eventId: string, value: EventItem[]): void {
    const key = `nip22-news-replies-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, value);
  }

  getNip22ArticleReplies(aTag: string): Map<string, EventItem> {
    const parsedArray = this.getCachedValue<[string, EventItem][]>(`nip22-article-replies-${aTag}`);

    return new Map(parsedArray);
  }

  setNip22ArticleReplies(aTag: string, value: Map<string, EventItem>): void {
    const key = `nip22-article-replies-${aTag}`;
    this.cache.set(key, value);
    this.setToStorage(key, Array.from(value.entries()));
  }

  getNip25Reactions(eventId: string): Map<string, EventItem> {
    const parsedArray = this.getCachedValue<[string, EventItem][]>(`nip25-reactions-${eventId}`);

    return new Map(parsedArray);
  }

  setNip25Reactions(eventId: string, value: Map<string, EventItem>): void {
    const key = `nip25-reactions-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, Array.from(value.entries()));
  }

  getNip57Zaps(eventId: string): Map<string, ZapReceipt> | null {
    const parsedArray = this.getCachedValue<[string, ZapReceipt][]>(`nip57-zaps-${eventId}`);

    return new Map(parsedArray);
  }

  setNip57Zaps(eventId: string, value: Map<string, ZapReceipt>): void {
    const key = `nip57-zaps-${eventId}`;
    this.cache.set(key, value);
    this.setToStorage(key, Array.from(value.entries()));
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

  getProfileItems(): Map<string, ProfileItem> {
    const parsedArray = this.getCachedValue<[string, ProfileItem][]>(`profile-items`);

    return new Map(parsedArray);
  }

  setProfileItems(value: Map<string, ProfileItem>): void {
    this.cache.set("profile-items", value);
    this.setToStorage("profile-items", Array.from(value.entries()));
  }

  getPriceData(): BaseEndpointResponse | null {
    return this.getCachedValue<BaseEndpointResponse>("price-data");
  }

  setPriceData(value: BaseEndpointResponse): void {
    this.cache.set("price-data", value);
    this.setToStorage("price-data", value);
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
