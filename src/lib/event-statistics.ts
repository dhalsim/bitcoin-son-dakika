import type { NostrEvent } from "nostr-tools";

import { getKind1Quotes, getKind1Replies } from "./nip10";
import { getReposts } from "./nip18";
import { getArticleReplies } from "./nip22";
import { type EmojiMap, getReactions } from "./nip25";

export type EventStatistics = {
  replies: NostrEvent[];
  quotes: NostrEvent[];
  reposts: NostrEvent[];
  likes: NostrEvent[];
  dislikes: NostrEvent[];
  emojis: {
    [emoji: string]: NostrEvent[];
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

export function getEventStatistics(
  event: NostrEvent,
  relays: string[] = STATISTICS_RELAYS,
  onUpdate: (statistics: EventStatistics) => void,
) {
  // Initialize statistics object
  const stats: EventStatistics = {
    replies: [],
    quotes: [],
    reposts: [],
    likes: [],
    dislikes: [],
    emojis: {},
  };

  // Get reposts (NIP-18) - works for all event types
  getReposts(event, relays, (reposts) => {
    stats.reposts = reposts || [];

    onUpdate({ ...stats });
  });

  // Get reactions (NIP-25) - works for all event types
  getReactions(event, relays, (reactions) => {
    const likes: NostrEvent[] = [];
    const dislikes: NostrEvent[] = [];
    const emojis: EmojiMap = {};

    for (const reaction of reactions) {
      if (reaction.content === "+" || reaction.content === "") {
        likes.push(reaction);
      } else if (reaction.content === "-") {
        dislikes.push(reaction);
      } else {
        if (!emojis[reaction.content]) {
          emojis[reaction.content] = [reaction];
        } else {
          emojis[reaction.content].push(reaction);
        }
      }
    }

    stats.likes = likes;
    stats.dislikes = dislikes;
    stats.emojis = emojis;

    onUpdate({ ...stats });
  });

  // Handle different event types
  if (event.kind === 1) {
    // Kind 1 (notes) - use NIP-10
    getKind1Replies(event, relays, (replies) => {
      stats.replies = replies || [];

      onUpdate({ ...stats });
    });

    getKind1Quotes(event, relays, (quotes) => {
      stats.quotes = quotes || [];

      onUpdate({ ...stats });
    });

    return;
  } else if (event.kind === 30023) {
    // Kind 30023 (articles) - use NIP-22
    getKind1Quotes(event, relays, (quotes) => {
      stats.quotes = quotes || [];

      onUpdate({ ...stats });
    });

    getArticleReplies(event, relays, (replies) => {
      stats.replies = replies || [];

      onUpdate({ ...stats });
    });

    return;
  }

  throw new Error("Event type not supported");
}
