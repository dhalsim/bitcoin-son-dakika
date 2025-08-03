import type { NostrEvent } from "nostr-tools";

import type { EventStatistics } from "@/lib/event-statistics";
import type { ProfileItem } from "@/lib/nip01";
import type { ReplyNode } from "@/lib/nip10";

export interface EventStatisticsProps {
  event: NostrEvent;
  eventRelayHint: string;
  author: ProfileItem;
  className: string;
}

export interface ReactionGroup {
  type: "zap" | "repost" | "like" | "dislike" | "emoji";
  key: string;
  icon: React.ReactNode;
  count: number;
  events: NostrEvent[];
  color: string;
}

export interface ActionButtonsProps {
  repliesCount: number;
  quotesCount: number;
  repostsCount: number;
  totalReactions: number;
  zapCount: number;
  zapAmount: number;
  hasUserReposted: boolean;
  hasZapped: boolean;
  isExpanded: boolean;
  showReplies: boolean;
  showQuotes: boolean;
  event: NostrEvent;
  onToggleExpanded: () => void;
  onShowRepliesClick: () => void;
  onReactionClick: (emoji: string) => void;
  onRepostClick: () => void;
  onQuoteClick: () => void;
  onZapClick: () => void;
}

export interface ExpandedReactionsProps {
  reactionGroups: ReactionGroup[];
  profiles: { [pubkey: string]: ProfileItem | null };
  author?: ProfileItem;
}

export interface ReplyComposerProps {
  replyContent: string;
  showPreview: boolean;
  showOnlyCompose: boolean;
  onReplyContentChange: (content: string) => void;
  onShowPreviewToggle: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onPostReply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export interface QuotesSectionProps {
  quotesCount: number;
  quoteContent: string;
  showQuotePreview: boolean;
  isQuotesAtBottom: boolean;
  statistics: EventStatistics | null;
  profiles: { [pubkey: string]: ProfileItem | null };
  onQuoteContentChange: (content: string) => void;
  onShowQuotePreviewToggle: () => void;
  onPostQuote: () => void;
  onQuoteKeyDown: (e: React.KeyboardEvent) => void;
  onQuotesScroll: () => void;
}

export interface RichTextPreviewProps {
  content: string;
}

export interface ThreadViewProps {
  thread: ReplyNode[];
  loadingThread: boolean;
  isAtBottom: boolean;
  showOnlyCompose: boolean;
  profiles: { [pubkey: string]: ProfileItem | null };
  onThreadReply: (replyEvent: NostrEvent) => void;
  onThreadScroll: () => void;
}
