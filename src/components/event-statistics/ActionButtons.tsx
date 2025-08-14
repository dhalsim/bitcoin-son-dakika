import {
  MessageSquare,
  Repeat2,
  Quote,
  Heart,
  ChevronDown,
  ChevronUp,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserContext, useUserWriteRelays } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { createNip10Thread, postKind1Reply } from "@/lib/nip10";
import { postQuoteRepost, postRepost } from "@/lib/nip18";
import { createNip22Thread } from "@/lib/nip22";

import { EmojiBoard } from "../EmojiBoard";
import { ZapDialog } from "../ZapDialog";

import { ExpandedReactions } from "./ExpandedReactions";
import { QuotesSection } from "./QuotesSection";
import { ReplyComposer } from "./ReplyComposer";
import { ThreadViewWrapper } from "./ThreadViewWrapper";
import type { ActionButtonsProps, ReactionGroup } from "./types";
import {
  getMostUsedEmojis,
  isContainerAtBottom,
  loadDraft,
  saveDraft,
  saveEmojiUsage,
} from "./utils";
import { fetchNip65Relays } from "@/lib/nip65";
import { postReaction } from "@/lib/nip25";

export function ActionButtons({
  event,
  author,
  statistics,
  setStatistics,
  profiles,
}: ActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showOnlyCompose, setShowOnlyCompose] = useState(false);
  const [thread, setThread] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [quoteContent, setQuoteContent] = useState("");
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [authorReadRelays, setAuthorReadRelays] = useState<string[]>([]);
  const { userProfile } = useUserContext();

  const writeRelays = useUserWriteRelays();
  const { toast } = useToast();

  // Load drafts for reply and quote
  useEffect(() => {
    if (!event?.id) {
      return;
    }

    setReplyContent(loadDraft(event.id));
    setQuoteContent(loadDraft(`quote-${event.id}`));
  }, [event?.id]);

  // Persist drafts
  useEffect(() => {
    if (!event?.id) {
      return;
    }

    if (replyContent !== loadDraft(event.id)) {
      saveDraft(event.id, replyContent);
    }
  }, [event?.id, replyContent]);

  useEffect(() => {
    if (!event?.id) {
      return;
    }

    if (quoteContent !== loadDraft(`quote-${event.id}`)) {
      saveDraft(`quote-${event.id}`, quoteContent);
    }
  }, [event?.id, quoteContent]);

  // Derived counts and groups
  const {
    repliesCount,
    quotesCount,
    repostsCount,
    totalReactions,
    zapCount,
    zapAmount,
    reactionGroups,
  } = useMemo(() => {
    const zaps = Array.from(statistics?.zaps?.values() || []);
    const _repliesCount = statistics?.replies?.size || 0;
    const _quotesCount = statistics?.quotes?.size || 0;
    const _repostsCount = statistics?.reposts?.size || 0;
    const _likesCount = statistics?.likes?.size || 0;
    const _dislikesCount = statistics?.dislikes?.size || 0;
    const _zapCount = zaps.length;
    const _zapAmount = zaps.reduce((sum, zap) => sum + zap.amount, 0);

    const groups: ReactionGroup[] = [];
    if (_zapCount > 0) {
      const sortedZaps = zaps.sort((a, b) => b.amount - a.amount);

      groups.push({
        type: "zap",
        key: "zap",
        icon: <Zap className="h-4 w-4" />,
        count: sortedZaps.length,
        events: sortedZaps.map((zap) => zap),
        color: "text-orange-500",
      });
    }

    if (_repostsCount > 0) {
      groups.push({
        type: "repost",
        key: "repost",
        icon: <Repeat2 className="h-4 w-4" />,
        count: _repostsCount,
        events: statistics?.reposts ? Array.from(statistics.reposts.values()) : [],
        color: "text-blue-600",
      });
    }

    if (_likesCount > 0) {
      groups.push({
        type: "like",
        key: "like",
        icon: <Heart className="h-4 w-4" />,
        count: _likesCount,
        events: Array.from(statistics?.likes?.values() || []),
        color: "text-red-600",
      });
    }

    if (_dislikesCount > 0) {
      groups.push({
        type: "dislike",
        key: "dislike",
        icon: <Heart className="h-4 w-4" />,
        count: _dislikesCount,
        events: Array.from(statistics?.dislikes?.values() || []),
        color: "text-gray-600",
      });
    }

    if (statistics?.emojis) {
      const sortedEmojis = Array.from(statistics.emojis.values()).sort(
        (a, b) => b.events.length - a.events.length,
      );
      sortedEmojis.forEach((customEmoji) => {
        if (!customEmoji || !customEmoji.events || customEmoji.events.length === 0) {
          return;
        }

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
          icon = <span className="text-lg">{customEmoji.name}</span>;
        }

        groups.push({
          type: "emoji",
          key: `emoji-${customEmoji.name}`,
          icon,
          count: customEmoji.events.length,
          events: customEmoji.events,
          color: "text-yellow-600",
        });
      });
    }

    const total = groups.reduce(
      (sum, group) =>
        sum +
        (["like" as const, "dislike" as const, "emoji" as const].includes(group.type as any)
          ? group.count
          : 0),
      0,
    );

    return {
      repliesCount: _repliesCount,
      quotesCount: _quotesCount,
      repostsCount: _repostsCount,
      totalReactions: total,
      zapCount: _zapCount,
      zapAmount: _zapAmount,
      reactionGroups: groups,
    };
  }, [statistics]);

  useEffect(() => {
    if (!author) {
      return;
    }

    fetchNip65Relays(author.pubkey, (relays) => {
      setAuthorReadRelays(relays?.readRelays || []);
    });
  }, [author]);

  const { hasUserReposted, hasUserZapped, hasUserReacted, hasUserReplied, hasUserQuoted } =
    useMemo(() => {
      if (!userProfile?.pubkey) {
        return {
          hasUserReposted: false,
          hasUserZapped: false,
          hasUserReacted: false,
          hasUserReplied: false,
          hasUserQuoted: false,
        };
      }

      if (!statistics) {
        return {
          hasUserReposted: false,
          hasUserZapped: false,
          hasUserReacted: false,
          hasUserReplied: false,
          hasUserQuoted: false,
        };
      }

      const userReposted = !!(
        userProfile?.pubkey &&
        statistics?.reposts &&
        Array.from(statistics.reposts.values()).some((r) => r.pubkey === userProfile.pubkey)
      );

      const userZapped = !!(
        userProfile?.pubkey &&
        statistics?.zaps &&
        Array.from(statistics.zaps.values()).some(
          (zap) => zap.zapRequest.pubkey === userProfile.pubkey,
        )
      );

      const userReacted = !!(
        userProfile?.pubkey &&
        statistics?.reactions &&
        Array.from(statistics.reactions.values()).some(
          (reaction) => reaction.pubkey === userProfile.pubkey,
        )
      );

      const userReplied = !!(
        userProfile?.pubkey &&
        statistics?.replies &&
        Array.from(statistics.replies.values()).some((reply) => reply.pubkey === userProfile.pubkey)
      );

      const userQuoted = !!(
        userProfile?.pubkey &&
        statistics?.quotes &&
        Array.from(statistics.quotes.values()).some((quote) => quote.pubkey === userProfile.pubkey)
      );

      return {
        hasUserReposted: userReposted,
        hasUserZapped: userZapped,
        hasUserReacted: userReacted,
        hasUserReplied: userReplied,
        hasUserQuoted: userQuoted,
      };
    }, [statistics, userProfile?.pubkey]);

  // Local handlers re-implemented
  const onToggleExpanded = () => {
    setIsExpanded((v) => !v);

    if (showReplies) {
      setShowReplies(false);
    }

    if (showQuotes) {
      setShowQuotes(false);
    }
  };

  const onShowRepliesClick = () => {
    const next = !showReplies;

    setShowReplies(next);

    if (isExpanded) {
      setIsExpanded(false);
    }

    if (showQuotes) {
      setShowQuotes(false);
    }

    if (next && statistics?.replies) {
      setLoadingThread(true);

      let threadData: any[] = [];

      if (event.kind === 1) {
        threadData = createNip10Thread(statistics.replies, event.id);
      } else if (event.kind === 30023) {
        threadData = createNip22Thread(statistics.replies, event.id);
      }

      setThread(threadData);
      setLoadingThread(false);
    }
  };

  const onReactionClick = (emoji: string, emojiUrl: string | null) => {
    saveEmojiUsage(emoji, emojiUrl);

    const publishRelays = new Set([...authorReadRelays, ...writeRelays]);

    postReaction(
      event,
      author,
      emoji,
      emojiUrl,
      Array.from(publishRelays),
      () => {
        toast({
          title: "Başarılı",
          description: "Reaksiyon başarıyla gönderildi",
          variant: "success",
        });
      },
      (error) => toast({ title: "Hata", description: error, variant: "destructive" }),
    );
  };

  const onRepostClick = () => {
    const publishRelays = new Set([...authorReadRelays, ...writeRelays]);

    postRepost(
      event,
      author,
      Array.from(publishRelays),
      () =>
        toast({
          title: "Başarılı",
          description: "Repost başarıyla gönderildi",
          variant: "success",
        }),
      (error) => toast({ title: "Hata", description: error, variant: "destructive" }),
    );
  };

  const onQuoteClick = () => {
    const next = !showQuotes;

    setShowQuotes(next);

    if (isExpanded) {
      setIsExpanded(false);
    }

    if (showReplies) {
      setShowReplies(false);
    }
  };

  const onZapClick = () => setShowZapDialog(true);

  const handlePostReply = () => {
    if (!replyContent.trim()) {
      return;
    }

    const publishRelays = new Set([...authorReadRelays, ...writeRelays]);

    if (event.kind === 1) {
      postKind1Reply(
        event,
        author,
        replyContent,
        Array.from(publishRelays),
        () => {
          toast({
            title: "Başarılı",
            description: "Yanıt başarıyla gönderildi",
            variant: "success",
          });

          clear();
        },
        (error) => toast({ title: "Hata", description: error, variant: "destructive" }),
      );
    } else if (event.kind === 30023) {
      // TODO: postKind23Reply
      console.log("TODO: postKind23Reply");
    }
    const clear = () => {
      setReplyContent("");
      saveDraft(event.id, "");
      setShowReplies(false);
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostReply();
    }
  };

  const handlePostQuote = () => {
    if (!quoteContent.trim()) {
      return;
    }

    setShowQuotes(false);

    const publishRelays = new Set([...authorReadRelays, ...writeRelays]);

    postQuoteRepost(
      event,
      quoteContent,
      Array.from(publishRelays),
      () => {
        toast({
          title: "Başarılı",
          description: "Alıntı başarıyla gönderildi",
          variant: "success",
        });
        setQuoteContent("");
        saveDraft(`quote-${event.id}`, "");
      },
      (error) => toast({ title: "Hata", description: error, variant: "destructive" }),
    );
  };

  const handleQuoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePostQuote();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        {totalReactions + zapCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className={`h-6 w-6 p-0 hover:text-amber-800 ${isExpanded ? "text-amber-700" : ""}`}
            title={isExpanded ? "Reaksiyonları daralt" : "Reaksiyonları genişlet"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}

        <button
          onClick={onShowRepliesClick}
          className={`flex items-center space-x-1 transition-colors cursor-pointer hover:text-purple-600 ${showReplies ? "text-purple-600" : ""} ${hasUserReplied ? "text-purple-600" : ""}`}
          title={showReplies ? "Yanıtları gizle" : "Yanıtları göster"}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{repliesCount}</span>
        </button>

        <Popover open={showReactionPopup} onOpenChange={setShowReactionPopup}>
          <PopoverTrigger asChild>
            <button
              className="flex items-center space-x-1 hover:text-red-600 transition-colors cursor-pointer"
              title="Beğen"
            >
              {hasUserReacted ? (
                <Heart className="h-4 w-4 fill-current" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              <span>{totalReactions}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex items-center space-x-2">
              {Object.entries(getMostUsedEmojis()).map(([emoji, usage]) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReactionClick(emoji, usage.emojiUrl);
                    setShowReactionPopup(false);
                  }}
                  className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  {usage.emojiUrl ? (
                    <img
                      src={usage.emojiUrl}
                      alt={`:${emoji}:`}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    emoji
                  )}
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
                    <DialogDescription>Bir emoji seçerek tepki verin.</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto">
                    <EmojiBoard
                      onEmojiSelected={(emoji) => {
                        onReactionClick(emoji, null);
                        setShowEmojiModal(false);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </PopoverContent>
        </Popover>

        {event.kind === 1 && (
          <button
            onClick={onRepostClick}
            className={`flex items-center space-x-1 transition-colors cursor-pointer hover:text-blue-600 ${hasUserReposted ? "text-blue-600" : ""}`}
            title={hasUserReposted ? "Reposted" : "Yeniden paylaş"}
          >
            <Repeat2 className="h-4 w-4" />
            <span>{repostsCount}</span>
          </button>
        )}

        <button
          onClick={onQuoteClick}
          className={`flex items-center space-x-1 transition-colors cursor-pointer hover:text-blue-600 ${showQuotes ? "text-blue-600" : ""} ${hasUserQuoted ? "text-blue-600" : ""}`}
          title={showQuotes ? "Alıntıları gizle" : "Alıntıları göster"}
        >
          <Quote className={`h-4 w-4 ${hasUserQuoted ? "fill-current" : ""}`} />
          <span>{quotesCount}</span>
        </button>

        <button
          onClick={onZapClick}
          className={`flex items-center space-x-1 transition-colors cursor-pointer hover:text-orange-600 ${hasUserZapped ? "text-orange-600" : ""}`}
          title={hasUserZapped ? "Zap Gönderildi" : "Zap Gönder"}
        >
          <Zap className={`h-4 w-4 ${hasUserZapped ? "fill-current" : ""}`} />
          <span>{zapAmount}</span>
        </button>
      </div>

      {/* Expanded reactions panel */}
      {isExpanded && totalReactions > 0 && (
        <ExpandedReactions
          reactionGroups={reactionGroups}
          profiles={profiles}
          author={author}
          onRepostClick={onRepostClick}
          onReactionClick={onReactionClick}
          onZapClick={onZapClick}
        />
      )}

      {/* Replies section */}
      {showReplies && (
        <div className="mt-4 border-l-2 border-purple-600 pl-4 space-y-3">
          <ThreadViewWrapper
            thread={thread as any}
            loadingThread={loadingThread}
            showOnlyCompose={showOnlyCompose}
            profiles={profiles}
            onThreadReply={() => {}}
          />

          <ReplyComposer
            replyContent={replyContent}
            showPreview={showPreview}
            showOnlyCompose={showOnlyCompose}
            onReplyContentChange={setReplyContent}
            onShowPreviewToggle={() => setShowPreview((v) => !v)}
            onFocus={() => setShowOnlyCompose(true)}
            onBlur={() => setShowOnlyCompose(false)}
            onPostReply={handlePostReply}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      {/* Quotes section */}
      {showQuotes && (
        <QuotesSection
          quotesCount={quotesCount}
          quoteContent={quoteContent}
          showQuotePreview={showQuotePreview}
          statistics={statistics}
          profiles={profiles}
          onQuoteContentChange={setQuoteContent}
          onShowQuotePreviewToggle={() => setShowQuotePreview((v) => !v)}
          onPostQuote={handlePostQuote}
          onQuoteKeyDown={handleQuoteKeyDown}
        />
      )}

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
    </div>
  );
}
