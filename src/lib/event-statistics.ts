import type { NostrEvent } from "nostr-tools";

import { getKind1Replies } from "./nip10";
import { getReposts, getKind1Quotes } from "./nip18";
import { getArticleReplies } from "./nip22";
import { type CustomEmoji, getReactions } from "./nip25";
import { type ZapReceipt, getZaps } from "./nip57";

export type EventStatistics = {
  zaps: Map<string, ZapReceipt>;
  replies: Map<string, NostrEvent>;
  quotes: Map<string, NostrEvent>;
  reposts: NostrEvent[];
  likes: NostrEvent[];
  dislikes: NostrEvent[];
  emojis: {
    [emoji: string]: CustomEmoji;
  };
};

/*
  Replies: To get the replies to a note or event, there are several options:
    - NIP-10: https://nips.nostr.com/10, this is only used for kind 1 notes:
      - e tags can be used to define note thread roots and replies. They SHOULD be sorted by the reply stack from root to the direct parent.
      - q tags MAY be used when citing events in the .content with NIP-21. This is a quote, but can be shown as a reply.
    - NIP-22: https://nips.nostr.com/22, this is a generic reply event. Can be used for both news and articles. Should be merged with NIP-10 replies when showing kind 1 replies to the user.
    
  Reposts:
    - NIP-18: https://nips.nostr.com/18

  Reactions:
    - NIP-25: https://nips.nostr.com/25, + (or empty) is used for a like, - is used for a dislike.
      Can be used with https://nips.nostr.com/30 emoji tags to show the reaction.

  Zaps:
    - NIP-57: https://nips.nostr.com/57, Lightning Zaps. Kind 9735 (zap receipt) events.

  Considerations:
    - NIP-45: https://nips.nostr.com/45, Using Count Verb for fast retrieval of number of replies, reposts, etc.
*/

// Default relays for statistics queries
const STATISTICS_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nos.social",
];

// Helper function to extract emoji info from reaction event
function extractEmojiInfo(reaction: NostrEvent): {
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
        tag[0] === "emoji" &&
        tag[1] === emojiName &&
        tag[2] &&
        tag[2].startsWith("https://"),
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

// Helper function to choose the best URL when there are conflicts
function chooseBestUrl(urls: string[]): string {
  // Simple strategy: choose the most frequent URL
  // You could extend this with more sophisticated logic
  const urlCounts = urls.reduce(
    (acc, url) => {
      acc[url] = (acc[url] || 0) + 1;

      return acc;
    },
    {} as { [url: string]: number },
  );

  return Object.entries(urlCounts).sort(([, a], [, b]) => b - a)[0][0];
}

// Updated reaction processing
export function getEventStatistics(
  event: NostrEvent,
  onUpdate: (statistics: EventStatistics) => void,
) {
  // Initialize statistics object
  const stats: EventStatistics = {
    zaps: new Map(),
    replies: new Map(),
    quotes: new Map(),
    reposts: [],
    likes: [],
    dislikes: [],
    emojis: {},
  };

  // Get reposts (NIP-18) - only for kind 1 events
  if (event.kind === 1) {
    getReposts(event, STATISTICS_RELAYS, (reposts) => {
      stats.reposts = reposts || [];

      onUpdate({ ...stats });
    });
  }

  // Get reactions (NIP-25) - works for all event types
  getReactions(event, STATISTICS_RELAYS, (reactions) => {
    const likes: NostrEvent[] = [];
    const dislikes: NostrEvent[] = [];
    const emojiGroups: {
      [key: string]: { events: NostrEvent[]; urls: string[] };
    } = {};

    for (const [, reaction] of reactions) {
      if (reaction.content === "+" || reaction.content === "") {
        likes.push(reaction);
      } else if (reaction.content === "-") {
        dislikes.push(reaction);
      } else {
        const { name, url } = extractEmojiInfo(reaction);

        if (!emojiGroups[name]) {
          emojiGroups[name] = { events: [], urls: [] };
        }

        emojiGroups[name].events.push(reaction);
        if (url) {
          emojiGroups[name].urls.push(url);
        }
      }
    }

    // Convert grouped emojis to final format
    const emojis: { [emoji: string]: CustomEmoji } = {};

    Object.entries(emojiGroups).forEach(([name, group]) => {
      const bestUrl = group.urls.length > 0 ? chooseBestUrl(group.urls) : null;

      emojis[name] = {
        name,
        url: bestUrl,
        events: group.events,
      };
    });

    stats.likes = likes;
    stats.dislikes = dislikes;
    stats.emojis = emojis;

    onUpdate({ ...stats });
  });

  // Get zaps (NIP-57) - works for all event types
  getZaps(event, STATISTICS_RELAYS, (zaps) => {
    stats.zaps = zaps || new Map();

    onUpdate({ ...stats });
  });

  // Handle different event types
  if (event.kind === 1) {
    // Kind 1 (notes) - use NIP-10
    getKind1Replies(event, STATISTICS_RELAYS, (replies) => {
      stats.replies = replies || new Map();

      onUpdate({ ...stats });
    });

    getKind1Quotes(event, STATISTICS_RELAYS, (quotes) => {
      stats.quotes = quotes || new Map();

      onUpdate({ ...stats });
    });

    return;
  } else if (event.kind === 30023) {
    // Kind 30023 (articles) - use NIP-22
    getArticleReplies(event, STATISTICS_RELAYS, (replies) => {
      // Convert array to Map for consistency
      const repliesMap = new Map();
      if (replies) {
        replies.forEach((reply) => repliesMap.set(reply.id, reply));
      }

      stats.replies = repliesMap;

      onUpdate({ ...stats });
    });

    getKind1Quotes(event, STATISTICS_RELAYS, (quotes) => {
      stats.quotes = quotes || new Map();

      onUpdate({ ...stats });
    });

    return;
  }

  throw new Error("Event type not supported");
}
