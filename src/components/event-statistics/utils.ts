import { getCache } from "@/lib/cache";
import { DEFAULT_EMOJI_USAGE } from "@/lib/constants";
import type { EmojiUsage } from "@/types/emoji";

const cache = getCache();

// Helper function to clean quote content by removing nostr: links
export function cleanQuoteContent(content: string): string {
  // Remove nostr: links (nostr:note1... or nostr:nevent1... etc.)
  return content.replace(/\s*nostr:[a-zA-Z0-9]+\s*$/g, "").trim();
}

// Save draft to localStorage
export const saveDraft = (eventId: string, content: string) => {
  if (content.trim()) {
    cache.setDraft(eventId, content);
  } else {
    cache.deleteDraft(eventId);
  }
};

// Load draft from localStorage
export const loadDraft = (eventId: string): string => {
  return cache.getDraft(eventId) || "";
};

// Get most used emojis from localStorage
export const getMostUsedEmojis = (): EmojiUsage => {
  const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

  return Object.entries(usage)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 7)
    .reduce((acc, [emoji, usage]) => {
      acc[emoji] = usage;

      return acc;
    }, {});
};

// Save emoji usage
export const saveEmojiUsage = (emoji: string, emojiUrl: string | null) => {
  try {
    const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

    // increase usage count
    usage[emoji] = {
      count: (usage[emoji]?.count || 0) + 1,
      emojiUrl: emojiUrl || usage[emoji]?.emojiUrl,
    };

    cache.setEmojiUsage(usage);
  } catch {
    // Ignore errors
  }
};

// Scroll detection helper
export const isContainerAtBottom = (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef.current) {
    return true;
  }

  const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

  return scrollTop + clientHeight >= scrollHeight - 1; // 1px tolerance
};
