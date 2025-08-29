import { clsx, type ClassValue } from "clsx";
import type { NostrEvent } from "nostr-tools";
import { generateSecretKey, getPublicKey, Relay, SimplePool } from "nostr-tools";
import { twMerge } from "tailwind-merge";

import type { PublishToRelayResult } from "../../api-helpers/schemas";

import type { EventItem } from "./nip01";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pool = new SimplePool();

export function publishToRelays(
  event: NostrEvent,
  relayStrings: string[],
): Promise<PublishToRelayResult[]> {
  return Promise.all(
    relayStrings.map(async (r) => {
      try {
        const relay = new Relay(r);

        await relay.connect();
        await relay.publish(event);

        return { success: true, relay: r };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Unknown error";

        return { success: false, relay: r, error: message };
      }
    }),
  );
}

export function logCloseReasons(reasons: string[]): void {
  const normalReasons = ["closed automatically on eose", "closed by client", "closed by caller"];

  const nonNormalReasons = reasons.filter((r) => !normalReasons.includes(r));

  if (nonNormalReasons.length > 0) {
    console.log("Profile subscription closed:", nonNormalReasons);
  }
}

export function extractEmojiInfo(reaction: EventItem): {
  name: string;
  url: string | null;
} {
  const content = reaction.content.trim();

  // Check if it's a custom emoji (starts and ends with :)
  if (content.startsWith(":") && content.endsWith(":") && content.length > 2) {
    const emojiName = content.slice(1, -1); // Remove surrounding colons

    // Look for emoji tag
    const emojiTag = reaction.tags.find(
      (tag) =>
        tag[0] === "emoji" && tag[1] === emojiName && tag[2] && tag[2].startsWith("https://"),
    );

    return {
      name: emojiName,
      url: emojiTag ? emojiTag[2] : null,
    };
  }

  // For unicode emojis or other content
  return {
    name: content,
    url: null,
  };
}

export const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Share content using Web Share API on mobile or copy to clipboard on desktop
 * @param url - The URL to share
 * @param title - The title of the content
 * @param text - The text description
 * @returns Promise<boolean> - true if shared successfully, false otherwise
 */
export async function shareContent(url: string, title: string, text?: string): Promise<boolean> {
  // Check if Web Share API is available AND if it's a mobile device
  if (navigator.share && isMobile()) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });

      return true;
    } catch (error) {
      // User cancelled sharing
      if (error instanceof Error && error.name === "AbortError") {
        return false;
      }
      // Fall back to clipboard copy
    }
  }

  // Desktop or fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);

    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);

    return false;
  }
}

export function formatNostrDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format timestamp for RSS feeds in RFC 2822/RFC 822 format
 * @param timestamp - Unix timestamp in seconds
 * @returns Date string in RFC 2822 format (e.g., "Wed, 15 Dec 2023 00:00:00 +0000")
 */
export function formatRssDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);

  return date.toUTCString();
}

/**
 * Format timestamp for Atom feeds in ISO 8601 format
 * @param timestamp - Unix timestamp in seconds
 * @returns Date string in ISO 8601 format (e.g., "2023-12-15T00:00:00.000Z")
 */
export function formatAtomDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);

  return date.toISOString();
}

export function createKeyPair() {
  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);

  return { secret, pubkey };
}

export function generateRandomHexString(length: number): string {
  const byteLength = Math.ceil(length / 2);
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);

  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable code: ${value}`);
}

export const links = {
  news: "/haberler",
  newsDetail: (slug: string) => `/haber/${slug}`,
  articles: "/makaleler",
  articleDetail: (slug: string) => `/makale/${slug}`,
  podcasts: "/podcast",
  podcastDetail: (slug: string) => `/podcast/${slug}`,
  tag: (slug: string, type?: "news" | "article" | "podcast") => {
    const base = `/tag/${slug}`;

    if (type) {
      return `${base}?type=${type}`;
    }

    return base;
  },
  profile: (slug: string) => `/profile/${slug}`,
  testEvent: (eventId: string) => `/test/${eventId}`,
  latest: "/son-dakika",
  educations: "/egitimler",
  educationDetail: (slug: string) => `/egitim/${slug}`,
};
