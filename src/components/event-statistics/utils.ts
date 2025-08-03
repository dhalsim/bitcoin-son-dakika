import { getCache } from "@/lib/cache";
import { DEFAULT_EMOJI_USAGE } from "@/lib/constants";

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
export const getMostUsedEmojis = (): string[] => {
  const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

  return Object.entries(usage)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 7)
    .map(([emoji]) => emoji);
};

// Save emoji usage
export const saveEmojiUsage = (emoji: string) => {
  try {
    const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);
    
    // increase usage count
    usage[emoji] = (usage[emoji] || 0) + 1;
    
    cache.setEmojiUsage(usage);
  } catch {
    // Ignore errors
  }
};

// Scroll detection helper
export const handleScrollDetection = (
  containerRef: React.RefObject<HTMLDivElement>,
  setIsAtBottom: (isAtBottom: boolean) => void
) => {
  if (containerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 1; // 1px tolerance
    setIsAtBottom(isBottom);
  }
};