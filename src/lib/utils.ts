import { clsx, type ClassValue } from "clsx";
import type { NostrEvent } from "nostr-tools";
import { Relay, SimplePool } from "nostr-tools";
import { twMerge } from "tailwind-merge";

import type { EventItem } from "./nip01";

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
