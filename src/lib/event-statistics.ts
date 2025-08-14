import { getCache } from "./cache";
import type { EventItem } from "./nip01";
import { getKind1Replies } from "./nip10";
import { getReposts, getKind1Quotes } from "./nip18";
import { getArticleReplies } from "./nip22";
import { type CustomEmoji, getReactions } from "./nip25";
import { type ZapReceipt, getZaps } from "./nip57";
import { extractEmojiInfo } from "./utils";

export type EventStatistics = {
  zaps: Map<string, ZapReceipt>;
  replies: Map<string, EventItem>;
  nip22Replies: Map<string, EventItem>;
  quotes: Map<string, EventItem>;
  reposts: Map<string, EventItem>;
  reactions: Map<string, EventItem>;
  likes: Map<string, EventItem>;
  dislikes: Map<string, EventItem>;
  emojis: Map<string, CustomEmoji>;
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

const likeFilter = (reaction: EventItem) => reaction.content === "+" || reaction.content === "";
const dislikeFilter = (reaction: EventItem) => reaction.content === "-";

type ReactionsTransformed = {
  likes: Map<string, EventItem>;
  dislikes: Map<string, EventItem>;
  emojis: Map<string, CustomEmoji>;
};

function reactionsToMap(reactions: EventItem[]): ReactionsTransformed {
  const likes = new Map<string, EventItem>();
  const dislikes = new Map<string, EventItem>();
  const emojis = new Map<string, { events: EventItem[]; urls: string[] }>();

  for (const reaction of reactions) {
    if (likeFilter(reaction)) {
      likes.set(reaction.id, reaction);
    } else if (dislikeFilter(reaction)) {
      dislikes.set(reaction.id, reaction);
    } else {
      const { name, url } = extractEmojiInfo(reaction);

      if (!emojis.has(name)) {
        emojis.set(name, { events: [], urls: [] });
      }

      emojis.get(name).events.push(reaction);

      if (url) {
        emojis.get(name).urls.push(url);
      }
    }
  }

  const finalEmojis = new Map<string, CustomEmoji>();

  for (const [name, group] of emojis) {
    const bestUrl = group.urls.length > 0 ? chooseBestUrl(group.urls) : null;

    finalEmojis.set(name, { name, url: bestUrl, events: group.events });
  }

  return {
    likes,
    dislikes,
    emojis: finalEmojis,
  };
}

const cache = getCache();

// Updated reaction processing
export function getEventStatistics(
  event: EventItem,
  onUpdate: (statistics: EventStatistics) => void,
) {
  // Initialize statistics object with the cache directly
  const cachedReactions = cache.getNip25Reactions(event.id);
  const cachedReactionsArray = Array.from(cachedReactions.values());

  const { likes, dislikes, emojis } = reactionsToMap(cachedReactionsArray);

  let nip22Replies = new Map<string, EventItem>();

  if (event.kind === 30023) {
    const d = event.tags.find((tag) => tag[0] === "d")?.[1];

    if (!d) {
      throw new Error("Cannot find d tag in kind 30023 event");
    }

    const aTag = `30023:${event.pubkey}:${d}`;

    nip22Replies = cache.getNip22ArticleReplies(aTag);
  }

  const stats: EventStatistics = {
    zaps: cache.getNip57Zaps(event.id),
    replies: cache.getNip10Replies(event.id),
    nip22Replies,
    quotes: cache.getNip18Quotes(event.id),
    reposts: cache.getNip18Reposts(event.id),
    reactions: cachedReactions,
    likes,
    dislikes,
    emojis,
  };

  onUpdate({ ...stats });

  const cleanupFunctions: (() => void)[] = [];

  // Get reposts (NIP-18) - only for kind 1 events
  if (event.kind === 1) {
    const repostCleanup = getReposts(event, STATISTICS_RELAYS, stats.reposts, (reposts) => {
      // merge the reposts with the cache
      stats.reposts = new Map([...stats.reposts, ...reposts]);

      onUpdate({ ...stats });
    });

    if (repostCleanup) {
      cleanupFunctions.push(repostCleanup);
    }
  }

  // Get reactions (NIP-25) - works for all event types
  const reactionCleanup = getReactions(event, STATISTICS_RELAYS, stats.reactions, (reactions) => {
    // merge the reactions with the cache
    stats.reactions = new Map([...stats.reactions, ...reactions]);

    const { likes, dislikes, emojis } = reactionsToMap(Array.from(stats.reactions.values()));

    stats.likes = likes;
    stats.dislikes = dislikes;
    stats.emojis = emojis;

    onUpdate({ ...stats });
  });

  if (reactionCleanup) {
    cleanupFunctions.push(reactionCleanup);
  }

  // Get zaps (NIP-57) - works for all event types
  const zapsCleanup = getZaps(event, STATISTICS_RELAYS, stats.zaps, (zaps) => {
    // merge the zaps with the cache
    stats.zaps = new Map([...stats.zaps, ...zaps]);

    onUpdate({ ...stats });
  });

  if (zapsCleanup) {
    cleanupFunctions.push(zapsCleanup);
  }

  const quotesCleanup = getKind1Quotes(event, STATISTICS_RELAYS, stats.quotes, (quotes) => {
    // merge the quotes with the cache
    stats.quotes = new Map([...stats.quotes, ...quotes]);

    onUpdate({ ...stats });
  });

  if (quotesCleanup) {
    cleanupFunctions.push(quotesCleanup);
  }

  // Handle different event types
  if (event.kind === 1) {
    // Kind 1 (notes) - use NIP-10
    const repliesCleanup = getKind1Replies(event, STATISTICS_RELAYS, stats.replies, (replies) => {
      // merge the replies with the cache
      stats.replies = new Map([...stats.replies, ...replies]);

      onUpdate({ ...stats });
    });

    if (repliesCleanup) {
      cleanupFunctions.push(repliesCleanup);
    }
  } else if (event.kind === 30023) {
    // Kind 30023 (articles) - use NIP-22
    const d = event.tags.find((tag) => tag[0] === "d")?.[1];

    if (!d) {
      throw new Error("Cannot find d tag in kind 30023 event");
    }

    const aTag = `30023:${event.pubkey}:${d}`;

    const cachedReplies = cache.getNip22ArticleReplies(aTag);

    if (cachedReplies) {
      stats.replies = new Map([...stats.replies, ...cachedReplies]);
    }

    const repliesCleanup = getArticleReplies(
      event,
      aTag,
      STATISTICS_RELAYS,
      stats.nip22Replies,
      (replies) => {
        // merge the replies with the cache
        stats.nip22Replies = new Map([...stats.nip22Replies, ...replies]);

        onUpdate({ ...stats });
      },
    );

    if (repliesCleanup) {
      cleanupFunctions.push(repliesCleanup);
    }
  } else {
    throw new Error("Event type not supported");
  }

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}
