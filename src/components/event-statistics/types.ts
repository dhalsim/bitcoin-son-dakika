import type React from "react";

import type { EventStatistics } from "@/lib/event-statistics";
import type { EventItem, ProfileItem } from "@/lib/nip01";
import type { ReplyNode } from "@/lib/nip10";
import type { ZapReceipt } from "@/lib/nip57";

export interface EventStatisticsProps {
  event: EventItem;
  author: ProfileItem;
  className: string;
}

export type ReactionGroup =
  | {
      type: "repost" | "like" | "dislike" | "emoji";
      key: string;
      icon: React.ReactNode;
      count: number;
      events: EventItem[];
      color: string;
    }
  | {
      type: "zap";
      key: string;
      icon: React.ReactNode;
      count: number;
      events: ZapReceipt[];
      color: string;
    };

export interface ActionButtonsProps {
  event: EventItem;
  author: ProfileItem;
  statistics: EventStatistics | null;
  setStatistics: React.Dispatch<React.SetStateAction<EventStatistics | null>>;
  profiles: Map<string, ProfileItem>;
}

export interface ExpandedReactionsProps {
  reactionGroups: ReactionGroup[];
  profiles: Map<string, ProfileItem>;
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
  profiles: Map<string, ProfileItem>;
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
  profiles: Map<string, ProfileItem>;
  onThreadReply: (replyEvent: EventItem) => void;
  onThreadScroll: () => void;
}
