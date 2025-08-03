import { Heart, Repeat2, Zap } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState, useEffect, useMemo, useCallback } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useProfiles } from "@/contexts/ProfileContext";
import { useUserWriteRelays } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getCache } from "@/lib/cache";
import type { EventStatistics } from "@/lib/event-statistics";
import { getEventStatistics } from "@/lib/event-statistics";
import type { ProfileItem } from "@/lib/nip01";
import { getUserPubkey } from "@/lib/nip07";
import { createNip10Thread } from "@/lib/nip10";
import type { ReplyNode } from "@/lib/nip10";
import { postQuoteRepost, postRepost } from "@/lib/nip18";
import { createNip22Thread } from "@/lib/nip22";
import { hasUserZapped } from "@/lib/zap-utils";

import {
  ActionButtons,
  ExpandedReactions,
  ReplyComposer,
  QuotesSection,
  ThreadViewWrapper,
  type EventStatisticsProps,
  type ReactionGroup,
  saveDraft,
  loadDraft,
  saveEmojiUsage,
  handleScrollDetection,
} from "./event-statistics";
import { ZapDialog } from "./ZapDialog";

// KeepMounted component to prevent re-fetching of avatar images
function KeepMounted({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        visibility: isOpen ? "visible" : "hidden",
        height: isOpen ? "auto" : 0,
        overflow: "hidden",
        transition: "visibility 0.3s ease-in-out, height 0.3s ease-in-out",
      }}
    >
      {children}
    </div>
  );
}

const cache = getCache();

export function EventStatistics({
  event,
  eventRelayHint,
  author,
  className = "",
}: EventStatisticsProps) {
  // State management
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(
    null,
  );
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [thread, setThread] = useState<ReplyNode[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showOnlyCompose, setShowOnlyCompose] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [quoteContent, setQuoteContent] = useState("");
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [userPubkey, setUserPubkey] = useState<string | null>(null);
  const [hasZapped, setHasZapped] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isQuotesAtBottom, setIsQuotesAtBottom] = useState(false);

  const updateStatistics = useCallback((stats: EventStatistics) => {
    setStatistics(stats);
    setLoading(false);
  }, []);

  // Extract all pubkeys from statistics when they change
  const allPubkeys = useMemo(() => {
    if (!statistics) {
      return [];
    }

    return [
      ...Array.from(statistics.replies.values()).map((reply) => reply.pubkey),
      ...Array.from(statistics.quotes.values()).map((quote) => quote.pubkey),
      ...Array.from(statistics.reposts.values()).map((repost) => repost.pubkey),
      ...statistics.likes.map((like) => like.pubkey),
      ...statistics.dislikes.map((dislike) => dislike.pubkey),
      ...Object.entries(statistics.emojis).flatMap(([_, customEmoji]) =>
        customEmoji.events.map((event) => event.pubkey),
      ),
    ];
  }, [statistics]);

  // Use ProfileContext to get profiles
  const profilesMap = useProfiles([...new Set(allPubkeys)]);

  // Convert to the expected format for child components
  const profiles = useMemo(() => {
    const result: { [pubkey: string]: ProfileItem } = {};
    profilesMap.forEach((profile, pubkey) => {
      result[pubkey] = profile;
    });

    return result;
  }, [profilesMap]);

  // Load event statistics
  useEffect(() => {
    setLoading(true);
    setError(null);

    const cleanup = getEventStatistics(event, updateStatistics);

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [event, updateStatistics]);

  // Get current user's pubkey
  useEffect(() => {
    const getCurrentUser = async () => {
      const pubkey = await getUserPubkey();
      setCurrentUserPubkey(pubkey);
    };

    getCurrentUser();
  }, []);

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

  // Check if current user has reposted this event
  const hasUserReposted = useMemo(() => {
    if (!currentUserPubkey || !statistics?.reposts) {
      return false;
    }

    return Array.from(statistics.reposts.values()).some(
      (repost) => repost.pubkey === currentUserPubkey,
    );
  }, [currentUserPubkey, statistics?.reposts]);

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
  }, [event.id, userPubkey]);

  // Memoize expensive calculations
  const {
    repliesCount,
    quotesCount,
    repostsCount,
    reactionGroups,
    totalReactions,
    zapCount,
    zapAmount,
  } = useMemo(() => {
    const zaps = Array.from(statistics?.zaps?.values() || []);

    // Calculate counts from event arrays with null checks
    const _repliesCount = statistics?.replies?.size || 0;
    const _quotesCount = statistics?.quotes?.size || 0;
    const _repostsCount = statistics?.reposts?.size || 0;
    const _likesCount = statistics?.likes?.length || 0;
    const _dislikesCount = statistics?.dislikes?.length || 0;
    const _zapCount = zaps.length;
    const _zapAmount = zaps.reduce((sum, zap) => sum + zap.amount, 0);

    // Create reaction groups for the expanded view
    const _reactionGroups: ReactionGroup[] = [];

    // Add zaps
    if (_zapCount > 0) {
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
        events: statistics?.reposts
          ? Array.from(statistics.reposts.values())
          : [],
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
        icon: <Heart className="h-4 w-4" />, // Changed from ThumbsDown for consistency
        count: _dislikesCount,
        events: statistics?.dislikes || [],
        color: "text-gray-600",
      });
    }

    // Add emoji reactions
    if (statistics?.emojis) {
      const sortedEmojis = Object.entries(statistics.emojis).sort(
        ([, a], [, b]) => b.events.length - a.events.length,
      );

      sortedEmojis.forEach(([emojiName, customEmoji]) => {
        if (
          customEmoji &&
          customEmoji.events &&
          customEmoji.events.length > 0
        ) {
          let icon: React.ReactNode;

          if (customEmoji.url) {
            icon = (
              <img
                src={customEmoji.url}
                alt={`:${customEmoji.name}:`}
                className="h-4 w-4 object-contain"
                onError={(e) => {
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
      zapCount: _zapCount,
      zapAmount: _zapAmount,
    };
  }, [statistics]);

  const writeRelays = useUserWriteRelays();
  const { toast } = useToast();

  // Event handlers
  const handleRepostClick = () => {
    if (writeRelays.length === 0) {
      toast({
        title: "Hata",
        description: "Yazma relayleri bulunamadı",
        variant: "destructive",
      });

      return;
    }

    postRepost(
      event,
      eventRelayHint,
      writeRelays,
      () => {
        toast({
          title: "Başarılı",
          description: "Repost başarıyla gönderildi",
        });
      },
      (error) => {
        toast({
          title: "Hata",
          description: error,
          variant: "destructive",
        });
      },
    );
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

    if (showQuotes) {
      setShowQuotes(false);
    }

    if (!showReplies && statistics?.replies) {
      setLoadingThread(true);

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

    if (showQuotes) {
      setShowQuotes(false);
    }
  };

  const handleReactionClick = (emoji: string) => {
    saveEmojiUsage(emoji);
    // TODO: send actual reaction
  };

  const handlePostReply = () => {
    if (replyContent.trim()) {
      console.log("Posting reply:", replyContent);
      setReplyContent("");
      cache.deleteDraft(event.id);
      setShowReplies(false);
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
      setShowQuotes(false);

      postQuoteRepost(
        event,
        quoteContent,
        eventRelayHint,
        writeRelays,
        () => {
          toast({
            title: "Başarılı",
            description: "Alıntı başarıyla gönderildi",
          });
          setQuoteContent("");
          cache.deleteDraft(`quote-${event.id}`);
        },
        (error) => {
          toast({
            title: "Hata",
            description: error,
            variant: "destructive",
          });
        },
      );
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
        <ActionButtons
          repliesCount={repliesCount}
          quotesCount={quotesCount}
          repostsCount={repostsCount}
          totalReactions={totalReactions}
          zapCount={zapCount}
          zapAmount={zapAmount}
          hasUserReposted={hasUserReposted}
          hasZapped={hasZapped}
          isExpanded={isExpanded}
          showReplies={showReplies}
          showQuotes={showQuotes}
          event={event}
          onToggleExpanded={toggleExpanded}
          onShowRepliesClick={handleShowRepliesClick}
          onReactionClick={handleReactionClick}
          onRepostClick={handleRepostClick}
          onQuoteClick={handleQuoteClick}
          onZapClick={() => setShowZapDialog(true)}
        />

        {/* Expanded reactions panel */}
        <KeepMounted isOpen={isExpanded && totalReactions > 0}>
          {totalReactions > 0 && (
            <ExpandedReactions
              reactionGroups={reactionGroups}
              profiles={profiles}
              author={author}
            />
          )}
        </KeepMounted>

        {/* Expandable replies section */}
        {showReplies && (
          <div className="mt-4 border-l-2 border-purple-600 pl-4 space-y-3">
            <ThreadViewWrapper
              thread={thread}
              loadingThread={loadingThread}
              isAtBottom={isAtBottom}
              showOnlyCompose={showOnlyCompose}
              profiles={profiles}
              onThreadReply={handleThreadReply}
              onThreadScroll={() => {
                const container = document.querySelector(
                  "[data-thread-container]",
                ) as HTMLDivElement;
                if (container) {
                  handleScrollDetection({ current: container }, setIsAtBottom);
                }
              }}
            />

            <ReplyComposer
              replyContent={replyContent}
              showPreview={showPreview}
              showOnlyCompose={showOnlyCompose}
              onReplyContentChange={setReplyContent}
              onShowPreviewToggle={() => setShowPreview(!showPreview)}
              onFocus={() => setShowOnlyCompose(true)}
              onBlur={() => setShowOnlyCompose(false)}
              onPostReply={handlePostReply}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {/* Expandable quotes section */}
        {showQuotes && (
          <QuotesSection
            quotesCount={quotesCount}
            quoteContent={quoteContent}
            showQuotePreview={showQuotePreview}
            isQuotesAtBottom={isQuotesAtBottom}
            statistics={statistics}
            profiles={profiles}
            onQuoteContentChange={setQuoteContent}
            onShowQuotePreviewToggle={() =>
              setShowQuotePreview(!showQuotePreview)
            }
            onPostQuote={handlePostQuote}
            onQuoteKeyDown={handleQuoteKeyDown}
            onQuotesScroll={() => {
              const container = document.querySelector(
                "[data-quotes-container]",
              ) as HTMLDivElement;
              if (container) {
                handleScrollDetection(
                  { current: container },
                  setIsQuotesAtBottom,
                );
              }
            }}
          />
        )}
      </div>

      {showZapDialog && (
        <ZapDialog
          open={showZapDialog}
          onOpenChange={setShowZapDialog}
          zappedEvent={event}
          author={author}
          statistics={statistics}
          setStatistics={setStatistics}
        />
      )}
    </TooltipProvider>
  );
}
