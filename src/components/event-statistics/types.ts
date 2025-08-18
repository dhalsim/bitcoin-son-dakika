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
  onRepostClick?: () => void;
  onReactionClick?: (emoji: string, emojiUrl: string | null) => void;
  onZapClick?: () => void;
}

export interface ReplyComposerProps {
  replyContent: string;
  showPreview: boolean;
  onReplyContentChange: (content: string) => void;
  onShowPreviewToggle: () => void;
  onPostReply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export interface QuotesSectionProps {
  quotesCount: number;
  quoteContent: string;
  showQuotePreview: boolean;
  statistics: EventStatistics | null;
  profiles: Map<string, ProfileItem>;
  onQuoteContentChange: (content: string) => void;
  onShowQuotePreviewToggle: () => void;
  onPostQuote: () => void;
  onQuoteKeyDown: (e: React.KeyboardEvent) => void;
}

export interface RichTextPreviewProps {
  content: string;
}

export interface ThreadViewProps {
  thread: ReplyNode[];
  loadingThread: boolean;
  profiles: Map<string, ProfileItem>;
  onThreadReply: (replyEvent: EventItem) => void;
}
