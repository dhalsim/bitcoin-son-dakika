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
import { useState, useEffect, useRef } from "react";

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
import { createNip10Thread } from "@/lib/nip10";
import type { ReplyNode } from "@/lib/nip10";
import { createNip22Thread } from "@/lib/nip22";

import { EmojiBoard } from "./EmojiBoard";
import { ThreadView } from "./ThreadView";

interface EventStatisticsProps {
  event: NostrEvent;
  className: string;
  onReaction: (event: NostrEvent, reaction: string) => void;
  onRepost: (event: NostrEvent) => void;
  onQuote: (event: NostrEvent) => void;
  onReply: (event: NostrEvent) => void;
}

interface ReactionGroup {
  type: string;
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
  const [profiles, setProfiles] = useState<{ [pubkey: string]: UserProfile }>(
    {},
  );
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

  // Handle mobile keyboard behavior
  const handleTextareaFocus = () => {
    // On mobile, hide replies when keyboard opens
    // TODO: hiding won't work because textarea is in the same div
    if (window.innerWidth <= 768) {
      setShowOnlyCompose(true);
    }
  };

  const handleTextareaBlur = () => {
    setShowOnlyCompose(false);
  };

  if (loading) {
    return (
      <div
        className={`flex items-center space-x-4 text-sm text-muted-foreground ${className}`}
      >
        <div className="animate-pulse">İstatistikler yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-destructive ${className}`}>
        İstatistikler yüklenirken bir hata oluştu: {error}
      </div>
    );
  }

  // Calculate counts from event arrays with null checks
  const repliesCount = statistics?.replies?.size || 0;
  const quotesCount = statistics?.quotes?.size || 0;
  const repostsCount = statistics?.reposts?.length || 0;
  const likesCount = statistics?.likes?.length || 0;
  const dislikesCount = statistics?.dislikes?.length || 0;

  // Calculate emoji counts with null checks
  const emojiCounts: { [emoji: string]: number } = {};
  if (statistics?.emojis) {
    Object.entries(statistics.emojis).forEach(([emoji, customEmoji]) => {
      emojiCounts[emoji] = customEmoji?.events?.length || 0;
    });
  }

  // Create reaction groups for the expanded view
  const reactionGroups: ReactionGroup[] = [];

  // Add reposts
  if (repostsCount > 0) {
    reactionGroups.push({
      type: "repost",
      key: "repost",
      icon: <Repeat2 className="h-4 w-4" />,
      count: repostsCount,
      events: statistics?.reposts || [],
      color: "text-blue-600",
    });
  }

  // Add quotes
  if (quotesCount > 0) {
    reactionGroups.push({
      type: "quote",
      key: "quote",
      icon: <Quote className="h-4 w-4" />,
      count: quotesCount,
      events: Object.values(statistics?.quotes || {}),
      color: "text-gray-600",
    });
  }

  // Add likes
  if (likesCount > 0) {
    reactionGroups.push({
      type: "like",
      key: "like",
      icon: <Heart className="h-4 w-4" />,
      count: likesCount,
      events: statistics?.likes || [],
      color: "text-red-600",
    });
  }

  // Add dislikes
  if (dislikesCount > 0) {
    reactionGroups.push({
      type: "dislike",
      key: "dislike",
      icon: <ThumbsDown className="h-4 w-4" />,
      count: dislikesCount,
      events: statistics?.dislikes || [],
      color: "text-gray-600",
    });
  }

  // Add emoji reactions
  if (statistics?.emojis) {
    Object.entries(statistics.emojis).forEach(([emojiName, customEmoji]) => {
      if (customEmoji && customEmoji.events && customEmoji.events.length > 0) {
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

        reactionGroups.push({
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

  // Add zaps (placeholder - you'll need to implement zap fetching)
  const zapCount = 0; // This would come from zap statistics
  if (zapCount > 0) {
    reactionGroups.push({
      type: "zap",
      key: "zap",
      icon: <Zap className="h-4 w-4" />,
      count: zapCount,
      events: [], // Zaps would be different events
      color: "text-yellow-500",
    });
  }

  const totalReactions = reactionGroups.reduce(
    (sum, group) => sum + group.count,
    0,
  );

  const handleRepostClick = () => {
    if (onRepost) {
      onRepost(event);
    }
  };

  const handleQuoteClick = () => {
    if (onQuote) {
      onQuote(event);
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

  const handleEmojiModalSelect = (emoji: string) => {
    handleReactionClick(emoji);
    setShowEmojiModal(false);
  };

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
        </div>

        {/* Expanded reactions panel */}
        {isExpanded && totalReactions > 0 && (
          <div className="pt-3 space-y-3 border-l-2 border-amber-700 bg-amber-50/30 rounded-r-lg pl-4">
            {reactionGroups.map((group) => (
              <div
                key={group.key}
                className="grid grid-cols-[auto_auto_1fr] gap-3 items-start"
              >
                <span className={`flex items-center ${group.color}`}>
                  {group.icon}
                </span>

                <span className="text-sm font-medium text-right min-w-[1rem]">
                  {group.count}
                </span>

                <div className="flex flex-wrap gap-1">
                  {group.events.slice(0, 10).map((reactionEvent) => {
                    const profile = profiles[reactionEvent.pubkey];

                    return (
                      <ProfileAvatar
                        key={reactionEvent.id}
                        pubkey={reactionEvent.pubkey}
                        profile={profile}
                        size="sm"
                      />
                    );
                  })}

                  {group.events.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
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
      </div>
    </TooltipProvider>
  );
}
