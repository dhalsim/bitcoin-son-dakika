import {
  MessageSquare,
  Repeat2,
  Quote,
  Heart,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  EyeOff,
  ThumbsDown,
  MoreHorizontal,
} from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState, useEffect, useRef, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ProfileAvatar,
  parseProfileEvent,
  type UserProfile,
} from "@/components/ui/ProfileAvatar";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCache } from "@/lib/cache";
import { DEFAULT_EMOJI_USAGE } from "@/lib/constants";
import type { EventStatistics } from "@/lib/event-statistics";
import { getEventStatistics } from "@/lib/event-statistics";
import { subscribeKind0Event } from "@/lib/nip01";
import { getUserPubkey } from "@/lib/nip07";
import { createNip10Thread } from "@/lib/nip10";
import type { ReplyNode } from "@/lib/nip10";
import { createNip22Thread } from "@/lib/nip22";
import { extractAmountFromBolt11 } from "@/lib/nip57";
import type { ProfileItem } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";
import { hasUserZapped } from "@/lib/zap-utils";

import { EmojiBoard } from "./EmojiBoard";
import { ThreadView } from "./ThreadView";
import { ZapDialog } from "./ZapDialog";

// Helper function to clean quote content by removing nostr: links
function cleanQuoteContent(content: string): string {
  // Remove nostr: links (nostr:note1... or nostr:nevent1... etc.)
  return content.replace(/\s*nostr:[a-zA-Z0-9]+\s*$/g, "").trim();
}

interface EventStatisticsProps {
  event: NostrEvent;
  author: ProfileItem;
  className: string;
  onReaction: (event: NostrEvent, reaction: string) => void;
  onRepost: (event: NostrEvent) => void;
  onQuote: (event: NostrEvent) => void;
  onReply: (event: NostrEvent) => void;
}

interface ReactionGroup {
  type: "zap" | "repost" | "like" | "dislike" | "emoji";
  key: string;
  icon: React.ReactNode;
  count: number;
  events: NostrEvent[];
  color: string;
}

const cache = getCache();

// Save draft to localStorage
const saveDraft = (eventId: string, content: string) => {
  if (content.trim()) {
    cache.setDraft(eventId, content);
  } else {
    cache.deleteDraft(eventId);
  }
};

// Get most used emojis from localStorage
const getMostUsedEmojis = (): string[] => {
  const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

  return Object.entries(usage)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 7)
    .map(([emoji]) => emoji);
};

// Load draft from localStorage
const loadDraft = (eventId: string): string => {
  return cache.getDraft(eventId) || "";
};

const saveEmojiUsage = (emoji: string) => {
  try {
    const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

    // increase usage count
    usage[emoji] = (usage[emoji] || 0) + 1;

    cache.setEmojiUsage(usage);
  } catch {
    // Ignore errors
  }
};

// Rich text preview component
function RichTextPreview({ content }: { content: string }) {
  const renderContent = (text: string) => {
    // Simple regex patterns for common Nostr content
    const patterns = [
      // URLs
      {
        pattern: /(https?:\/\/[^\s]+)/g,
        replacement:
          '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>',
      },
      // @mentions (npub or hex)
      {
        pattern: /@(npub[a-zA-Z0-9]+)/g,
        replacement: '<span class="text-purple-600 font-medium">@$1</span>',
      },
      // #tags
      {
        pattern: /#([a-zA-Z0-9_]+)/g,
        replacement: '<span class="text-green-600 font-medium">#$1</span>',
      },
      // Line breaks
      { pattern: /\n/g, replacement: "<br />" },
    ];

    let rendered = text;
    patterns.forEach(({ pattern, replacement }) => {
      rendered = rendered.replace(pattern, replacement);
    });

    return rendered;
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="text-xs text-gray-500 mb-2">Preview:</div>
      <div
        className="text-sm prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: renderContent(content) }}
      />
    </div>
  );
}

export function EventStatistics({
  event,
  author,
  className = "",
  onReaction,
  onRepost,
  onQuote,
  onReply,
}: EventStatisticsProps) {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [thread, setThread] = useState<ReplyNode[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showOnlyCompose, setShowOnlyCompose] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [quoteContent, setQuoteContent] = useState("");
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [profiles, setProfiles] = useState<{ [pubkey: string]: UserProfile }>(
    {},
  );
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [userPubkey, setUserPubkey] = useState<string | null>(null);
  const [hasZapped, setHasZapped] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load draft on mount
  useEffect(() => {
    if (event?.id) {
      const draft = loadDraft(event.id);
      setReplyContent(draft);
    }
  }, [event?.id]);

  // Save draft when content changes
  useEffect(() => {
    if (event?.id && replyContent !== loadDraft(event.id)) {
      saveDraft(event.id, replyContent);
    }
  }, [replyContent, event?.id]);

  // Load quote draft on mount
  useEffect(() => {
    if (event?.id) {
      const quoteDraft = loadDraft(`quote-${event.id}`);
      setQuoteContent(quoteDraft);
    }
  }, [event?.id]);

  // Save quote draft when content changes
  useEffect(() => {
    if (event?.id && quoteContent !== loadDraft(`quote-${event.id}`)) {
      saveDraft(`quote-${event.id}`, quoteContent);
    }
  }, [quoteContent, event?.id]);

  useEffect(() => {
    if (!event) {
      setStatistics(null);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      getEventStatistics(event, (stats) => {
        const statPubkeys = [
          ...Object.values(stats.replies).map((reply) => reply.pubkey),
          ...Object.values(stats.quotes).map((quote) => quote.pubkey),
          ...stats.reposts.map((repost) => repost.pubkey),
          ...stats.likes.map((like) => like.pubkey),
          ...stats.dislikes.map((dislike) => dislike.pubkey),
          ...Object.entries(stats.emojis).flatMap(([_, customEmoji]) =>
            customEmoji.events.map((event) => event.pubkey),
          ),
        ];

        const uniquePubkeys = [...new Set(statPubkeys)];

        subscribeKind0Event(uniquePubkeys, (pubkey, event) => {
          const profile = parseProfileEvent(event);

          if (profile) {
            setProfiles((prev) => ({
              ...prev,
              [pubkey]: profile,
            }));
          }
        });

        setStatistics(stats);
        setLoading(false);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch statistics",
      );
      setLoading(false);
    }
  }, [event]);

  // Check if user has zapped this event
  useEffect(() => {
    const checkUserZap = async () => {
      try {
        const pubkey = await getUserPubkey();

        if (!pubkey) {
          return;
        }

        setUserPubkey(pubkey);

        // TODO
        const userHasZapped = hasUserZapped(event.id, userPubkey, new Map());

        setHasZapped(userHasZapped);
      } catch (error) {
        console.error("Failed to check user zap status:", error);
      }
    };

    checkUserZap();
  }, [event.id]);

  // Memoize expensive calculations
  const {
    repliesCount,
    quotesCount,
    repostsCount,
    reactionGroups,
    totalReactions,
    _zapCount,
    zapAmount,
  } = useMemo(() => {
    const zaps = Array.from(statistics?.zaps?.values() || []);

    // Calculate counts from event arrays with null checks
    const _repliesCount = statistics?.replies?.size || 0;
    const _quotesCount = statistics?.quotes?.size || 0;
    const _repostsCount = statistics?.reposts?.length || 0;
    const _likesCount = statistics?.likes?.length || 0;
    const _dislikesCount = statistics?.dislikes?.length || 0;
    const _zapCount = zaps.length;
    const _zapAmount = zaps.reduce((sum, zap) => sum + zap.amount, 0);

    // Calculate emoji counts with null checks
    const _emojiCounts: { [emoji: string]: number } = {};
    if (statistics?.emojis) {
      Object.entries(statistics.emojis).forEach(([emoji, customEmoji]) => {
        _emojiCounts[emoji] = customEmoji?.events?.length || 0;
      });
    }

    // Create reaction groups for the expanded view
    const _reactionGroups: ReactionGroup[] = [];

    // Add zaps
    if (_zapCount > 0) {
      // Sort zaps by amount (highest first)
      const sortedZaps = zaps.sort((a, b) => b.amount - a.amount);

      _reactionGroups.push({
        type: "zap",
        key: "zap",
        icon: <Zap className="h-4 w-4" />,
        count: sortedZaps.length,
        events: sortedZaps.map((zap) => zap.event),
        color: "text-orange-500",
      });
    }

    // Add reposts
    if (_repostsCount > 0) {
      _reactionGroups.push({
        type: "repost",
        key: "repost",
        icon: <Repeat2 className="h-4 w-4" />,
        count: _repostsCount,
        events: statistics?.reposts || [],
        color: "text-blue-600",
      });
    }

    // Add likes
    if (_likesCount > 0) {
      _reactionGroups.push({
        type: "like",
        key: "like",
        icon: <Heart className="h-4 w-4" />,
        count: _likesCount,
        events: statistics?.likes || [],
        color: "text-red-600",
      });
    }

    // Add dislikes
    if (_dislikesCount > 0) {
      _reactionGroups.push({
        type: "dislike",
        key: "dislike",
        icon: <ThumbsDown className="h-4 w-4" />,
        count: _dislikesCount,
        events: statistics?.dislikes || [],
        color: "text-gray-600",
      });
    }

    // Add emoji reactions
    if (statistics?.emojis) {
      // Sort emojis by count (highest first)
      const sortedEmojis = Object.entries(statistics.emojis).sort(
        ([, a], [, b]) => b.events.length - a.events.length,
      );

      sortedEmojis.forEach(([emojiName, customEmoji]) => {
        if (
          customEmoji &&
          customEmoji.events &&
          customEmoji.events.length > 0
        ) {
          // Determine the icon to display
          let icon: React.ReactNode;

          if (customEmoji.url) {
            // Custom emoji with URL
            icon = (
              <img
                src={customEmoji.url}
                alt={`:${customEmoji.name}:`}
                className="h-4 w-4 object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("span");
                    fallback.className = "text-lg";
                    fallback.textContent = `:${customEmoji.name}:`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            );
          } else {
            // Unicode emoji or text fallback
            icon = <span className="text-lg">{emojiName}</span>;
          }

          _reactionGroups.push({
            type: "emoji",
            key: `emoji-${customEmoji.name}`,
            icon,
            count: customEmoji.events.length,
            events: customEmoji.events,
            color: "text-yellow-600",
          });
        }
      });
    }

    const _totalReactions = _reactionGroups.reduce(
      (sum, group) =>
        sum +
        (["like", "dislike", "emoji"].includes(group.type) ? group.count : 0),
      0,
    );

    return {
      repliesCount: _repliesCount,
      quotesCount: _quotesCount,
      repostsCount: _repostsCount,
      reactionGroups: _reactionGroups,
      totalReactions: _totalReactions,
      _zapCount: _zapCount,
      zapAmount: _zapAmount,
    };
  }, [statistics]);

  const handleRepostClick = () => {
    if (onRepost) {
      onRepost(event);
    }
  };

  const handleQuoteClick = () => {
    setShowQuotes(!showQuotes);

    if (isExpanded) {
      setIsExpanded(false);
    }

    if (showReplies) {
      setShowReplies(false);
    }
  };

  const handleShowRepliesClick = () => {
    setShowReplies(!showReplies);

    if (isExpanded) {
      setIsExpanded(false);
    }

    if (!showReplies && statistics?.replies) {
      setLoadingThread(true);

      // Create thread structure based on event type
      let threadData: ReplyNode[];
      if (event.kind === 1) {
        threadData = createNip10Thread(statistics.replies, event.id);
      } else if (event.kind === 30023) {
        threadData = createNip22Thread(statistics.replies, event.id);
      }

      setThread(threadData);
      setLoadingThread(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);

    if (showReplies) {
      setShowReplies(false);
    }
  };

  const handlePostReply = () => {
    if (replyContent.trim()) {
      // TODO: Implement actual reply posting
      console.log("Posting reply:", replyContent);

      // Clear draft after successful post
      setReplyContent("");
      cache.deleteDraft(event.id);

      // Optionally close replies section
      setShowReplies(false);

      // TODO: Implement actual reply posting,
      // publish and return the reply event
      onReply?.(event);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostReply();
    }
  };

  const handlePostQuote = () => {
    if (quoteContent.trim()) {
      // TODO: Implement actual quote posting
      console.log("Posting quote:", quoteContent);

      // Clear draft after successful post
      setQuoteContent("");
      cache.deleteDraft(`quote-${event.id}`);

      // Optionally close quotes section
      setShowQuotes(false);

      // TODO: Implement actual quote posting,
      // publish and return the quote event
      onQuote?.(event);
    }
  };

  const handleQuoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostQuote();
    }
  };

  const handleThreadReply = (replyEvent: NostrEvent) => {
    console.log("Reply to thread event:", replyEvent.id);
    // TODO: Implement reply to specific thread event
    // - Open reply form/modal
    // - Create kind 1 note with proper e tags for thread
    // - Publish to relays
  };

  const handleReactionClick = (emoji: string) => {
    saveEmojiUsage(emoji);
    if (onReaction) {
      onReaction(event, emoji);
    }

    setShowReactionPopup(false);
  };

  const handleTextareaFocus = () => {
    setShowOnlyCompose(true);
  };

  const handleTextareaBlur = () => {
    setShowOnlyCompose(false);
  };

  const handleEmojiModalSelect = (emoji: string) => {
    handleReactionClick(emoji);
    setShowEmojiModal(false);
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>Hata: {error}</div>;
  }

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        {/* Main action buttons and reaction counts */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {/* Expand/Collapse button */}
          {totalReactions > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className={`h-6 w-6 p-0 hover:text-amber-800 ${
                isExpanded ? "text-amber-700" : ""
              }`}
              title={
                isExpanded ? "Reaksiyonları daralt" : "Reaksiyonları genişlet"
              }
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Show replies button */}
          <button
            onClick={handleShowRepliesClick}
            className={`flex items-center space-x-1 transition-colors cursor-pointer ${
              showReplies ? "text-purple-600" : "hover:text-purple-600"
            }`}
            title={showReplies ? "Yanıtları gizle" : "Yanıtları göster"}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{repliesCount}</span>
          </button>

          {/* Reaction popup */}
          <Popover open={showReactionPopup} onOpenChange={setShowReactionPopup}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center space-x-1 hover:text-red-600 transition-colors cursor-pointer"
                title="Beğen"
              >
                <Heart className="h-4 w-4" />
                <span>{totalReactions}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex items-center space-x-2">
                {getMostUsedEmojis().map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <Dialog open={showEmojiModal} onOpenChange={setShowEmojiModal}>
                  <DialogTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[32rem]">
                    <DialogHeader>
                      <DialogTitle>Emoji seç</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      <EmojiBoard onEmojiSelected={handleEmojiModalSelect} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={handleRepostClick}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors cursor-pointer"
            title="Yeniden paylaş"
          >
            <Repeat2 className="h-4 w-4" />
            <span>{repostsCount}</span>
          </button>

          {/* Quotes */}
          <button
            onClick={handleQuoteClick}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors cursor-pointer"
            title="Alıntı Yap"
          >
            <Quote className="h-4 w-4" />
            <span>{quotesCount}</span>
          </button>

          {/* Zaps */}
          <button
            onClick={() => setShowZapDialog(true)}
            className={`flex items-center space-x-1 transition-colors cursor-pointer ${
              hasZapped ? "text-orange-600" : "hover:text-orange-600"
            }`}
            title={hasZapped ? "Zap Gönderildi" : "Zap Gönder"}
          >
            <Zap className={`h-4 w-4 ${hasZapped ? "fill-current" : ""}`} />
            <span>{zapAmount}</span>
          </button>
        </div>

        {/* Expanded reactions panel */}
        {isExpanded && totalReactions > 0 && (
          <div className="pt-3 space-y-3 border-l-2 border-amber-700 bg-amber-50/30 rounded-r-lg pl-4">
            {reactionGroups.map((group) => (
              <div
                key={group.key}
                className="grid grid-cols-[auto_auto_1fr] gap-3 items-center"
              >
                <span className={`flex items-center ${group.color}`}>
                  {group.icon}
                </span>

                <span className="text-sm font-medium text-right min-w-[1rem] flex items-center">
                  {group.count}
                </span>

                <div className="flex flex-wrap gap-1 items-center">
                  {group.events.slice(0, 10).map((reactionEvent) => {
                    let pubkey = reactionEvent.pubkey;
                    let badge = null;
                    let zapMessage = null;
                    let profile = profiles[pubkey];

                    if (group.type === "zap") {
                      const Ptag = reactionEvent.tags.find(
                        (tag) => tag[0] === "P",
                      )?.[1];

                      const bolt11 = reactionEvent.tags.find(
                        (tag) => tag[0] === "bolt11",
                      )?.[1];

                      const zapRequestTag = reactionEvent.tags.find(
                        (tag) => tag[0] === "description",
                      )?.[1];

                      let zapContent = "";

                      if (zapRequestTag) {
                        try {
                          const parsedZapRequest = JSON.parse(zapRequestTag);

                          zapContent = parsedZapRequest.content;
                        } catch (error) {
                          console.error("Error parsing zap request:", error);
                        }
                      }

                      if (Ptag && bolt11) {
                        pubkey = Ptag;
                        const amount = extractAmountFromBolt11(bolt11);

                        badge = (
                          <Badge
                            variant="secondary"
                            className="text-[8px] flex items-center bg-orange-500/70 text-gray-600 border-0 px-0.5 py-0 h-2 w-8 justify-center leading-none rounded-none"
                          >
                            {amount}
                          </Badge>
                        );

                        // Create zap message for popup
                        profile = profiles[pubkey];
                        const zapperName =
                          profile?.display_name ||
                          profile?.name ||
                          `${pubkey.slice(0, 8)}...`;

                        const zappedName =
                          author.display_name ||
                          `${author.pubkey.slice(0, 8)}...`;

                        zapMessage = (
                          <span>
                            <strong>{zapperName}</strong> {zappedName}'ye{" "}
                            {amount} Sats ⚡️ Gönderdi
                            {zapContent ? `, Mesaj: "${zapContent}"` : ""}
                          </span>
                        );
                      } else {
                        // Skip this zap if we don't have complete information
                        return null;
                      }
                    }

                    return (
                      <ProfileAvatar
                        key={reactionEvent.id}
                        pubkey={pubkey}
                        profile={profile}
                        size="sm"
                        badge={badge}
                        popupContent={zapMessage}
                      />
                    );
                  })}

                  {group.events.length > 10 && (
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center"
                    >
                      +{group.events.length - 10} daha
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expandable replies section */}
        {showReplies && (
          <div className="mt-4 border-l-2 border-purple-600 pl-4 space-y-3">
            {/* Thread view - scrollable with dynamic height */}
            <div
              className={`space-y-2 relative ${
                showOnlyCompose ? "hidden" : ""
              }`}
            >
              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2">
                {loadingThread ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                ) : (
                  <ThreadView
                    thread={thread}
                    onReply={handleThreadReply}
                    profiles={profiles}
                    className="w-full overflow-x-hidden"
                  />
                )}
              </div>

              {/* Fixed gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* Reply composer */}
            <div className="border-t pt-3 space-y-2">
              <Textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onFocus={handleTextareaFocus}
                onBlur={handleTextareaBlur}
                onKeyDown={handleKeyDown}
                placeholder="Yorumunuzu yazın..."
                className="min-h-[80px] resize-none"
              />

              {/* Preview toggle */}
              {replyContent.trim() && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs"
                  >
                    {showPreview ? (
                      <EyeOff className="h-3 w-3 mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>
              )}

              {/* Preview */}
              {showPreview && replyContent.trim() && (
                <RichTextPreview content={replyContent} />
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={handlePostReply}
                  disabled={!replyContent.trim()}
                  size="sm"
                  variant="default"
                  className="w-full cursor-pointer hover:bg-purple-600"
                >
                  Yorum Yap
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable quotes section */}
        {showQuotes && (
          <div className="mt-4 border-l-2 border-blue-600 pl-4 space-y-3">
            {/* Existing quotes display */}
            <div className="space-y-2">
              <div className="max-h-[200px] overflow-y-auto overflow-x-hidden pr-2">
                {quotesCount > 0 ? (
                  <div className="space-y-2">
                    {Array.from(statistics?.quotes?.values() || []).map(
                      (quote) => {
                        const profile = profiles[quote.pubkey];

                        return (
                          <div
                            key={quote.id}
                            className="flex items-start space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md"
                          >
                            <ProfileAvatar
                              pubkey={quote.pubkey}
                              profile={profile}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {profile?.name ||
                                    `${quote.pubkey.slice(0, 8)}...${quote.pubkey.slice(-8)}`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    quote.created_at * 1000,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <RenderedText enableRichPreviews>
                                  {cleanQuoteContent(quote.content)}
                                </RenderedText>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Henüz alıntı yapılmamış
                  </div>
                )}
              </div>
            </div>

            {/* Quote composer */}
            <div className="border-t pt-3 space-y-2">
              <Textarea
                value={quoteContent}
                onChange={(e) => setQuoteContent(e.target.value)}
                onKeyDown={handleQuoteKeyDown}
                placeholder="Alıntı yorumunuzu yazın..."
                className="min-h-[80px] resize-none"
              />

              {/* Preview toggle */}
              {quoteContent.trim() && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuotePreview(!showQuotePreview)}
                    className="text-xs"
                  >
                    {showQuotePreview ? (
                      <EyeOff className="h-3 w-3 mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {showQuotePreview
                      ? "Önizlemeyi gizle"
                      : "Önizlemeyi göster"}
                  </Button>
                </div>
              )}

              {/* Preview */}
              {showQuotePreview && quoteContent.trim() && (
                <RichTextPreview content={quoteContent} />
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={handlePostQuote}
                  disabled={!quoteContent.trim()}
                  size="sm"
                  variant="default"
                  className="w-full cursor-pointer hover:bg-blue-600"
                >
                  Alıntı Yap
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showZapDialog && (
        <ZapDialog
          open={showZapDialog}
          onOpenChange={setShowZapDialog}
          event={event}
          author={author}
        />
      )}
    </TooltipProvider>
  );
}
