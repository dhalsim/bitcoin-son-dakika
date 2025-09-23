import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EventItem } from "@/lib/nip01";
import { postNip22Reply } from "@/lib/nip22";
import { postKind1Reply } from "@/lib/nip10";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { useToast } from "@/hooks/use-toast";

import { RichTextPreview } from "./RichTextPreview";
import { ThreadView } from "../ThreadView";
import type { ThreadViewWrapperProps } from "./types";
import { isContainerAtBottom } from "./utils";

export function ThreadViewWrapper({
  thread,
  loadingThread,
  profiles,
  rootEvent,
  rootAuthor,
  publishRelays,
}: ThreadViewWrapperProps) {
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<EventItem | null>(null);
  const [isRootReply, setIsRootReply] = useState(false);

  const { getPublicKey, signEvent } = useNostrAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!threadContainerRef.current) {
      return;
    }

    setIsAtBottom(isContainerAtBottom({ current: threadContainerRef.current }));
  }, [threadContainerRef]);

  const handleThreadReply = (parentEvent: EventItem) => {
    setReplyingTo(parentEvent);
    setIsRootReply(false);
    setReplyContent("");
    setShowPreview(false);
  };

  const handleRootReply = () => {
    setReplyingTo(null);
    setIsRootReply(true);
    setReplyContent("");
    setShowPreview(false);
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) {
      return;
    }

    setIsPosting(true);

    try {
      if (rootEvent.kind === 1) {
        await postKind1Reply({
          root: { event: rootEvent, author: rootAuthor },
          parent: replyingTo
            ? { event: replyingTo, author: profiles.get(replyingTo.pubkey) || rootAuthor }
            : null,
          content: replyContent,
          publishRelays,
          getPublicKey: () => getPublicKey({ options: { reason: "Yanıt gönderme" } }),
          signEvent: ({ event: replyEvent }) =>
            signEvent({ event: replyEvent, options: { reason: "Yanıt gönderme" } }),
          onSuccess: () => {
            toast({
              title: "Başarılı",
              description: "Yanıt başarıyla gönderildi",
              variant: "success",
            });
            setReplyContent("");
            setReplyingTo(null);
            setIsRootReply(false);
            setShowPreview(false);
          },
          onError: (error) => {
            toast({ title: "Hata", description: error, variant: "destructive" });
          },
        });
      } else if (rootEvent.kind === 30023) {
        await postNip22Reply({
          root: { event: rootEvent, author: rootAuthor },
          parent: replyingTo
            ? { event: replyingTo, author: profiles.get(replyingTo.pubkey) || rootAuthor }
            : null,
          content: replyContent,
          publishRelays,
          getPublicKey: () => getPublicKey({ options: { reason: "Yanıt gönderme" } }),
          signEvent: ({ event: replyEvent }) =>
            signEvent({ event: replyEvent, options: { reason: "Yanıt gönderme" } }),
          onSuccess: () => {
            toast({
              title: "Başarılı",
              description: "Yanıt başarıyla gönderildi",
              variant: "success",
            });
            setReplyContent("");
            setReplyingTo(null);
            setIsRootReply(false);
            setShowPreview(false);
          },
          onError: (error) => {
            toast({ title: "Hata", description: error, variant: "destructive" });
          },
        });
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast({ title: "Hata", description: "Yanıt gönderilemedi", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePostReply();
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setIsRootReply(false);
    setReplyContent("");
    setShowPreview(false);
  };

  const switchToRootReply = () => {
    setReplyingTo(null);
    setIsRootReply(true);
    setReplyContent("");
    setShowPreview(false);
  };

  return (
    <div className="space-y-2 relative">
      <div
        ref={threadContainerRef}
        data-thread-container
        className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2"
        onScroll={() => {
          setIsAtBottom(isContainerAtBottom({ current: threadContainerRef.current }));
        }}
      >
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
            replyingTo={replyingTo}
          />
        )}
      </div>

      {/* Reply Composer */}
      {(replyingTo || isRootReply) && (
        <div className="border-t pt-3 space-y-2">
          {/* Reply context header */}
          {replyingTo ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Yanıtlanıyor:{" "}
              <span className="font-medium">{replyingTo.content.substring(0, 50)}...</span>
              <button
                onClick={switchToRootReply}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
              >
                Kök yanıt yap
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kök yanıt yazılıyor</div>
          )}

          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? "Yanıtınızı yazın..." : "Ana yanıtınızı yazın..."}
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
                {showPreview ? "Önizlemeyi Gizle" : "Önizlemeyi Göster"}
              </Button>
            </div>
          )}

          {/* Preview */}
          {showPreview && replyContent.trim() && <RichTextPreview content={replyContent} />}

          {/* Action buttons */}
          <div className="flex justify-between items-center space-x-2">
            <Button onClick={cancelReply} size="sm" variant="outline" className="flex-1">
              İptal
            </Button>
            <Button
              onClick={handlePostReply}
              disabled={!replyContent.trim() || isPosting}
              size="sm"
              variant="default"
              className="flex-1 cursor-pointer hover:bg-purple-600"
            >
              {isPosting ? "Gönderiliyor..." : replyingTo ? "Yanıtla" : "Yanıt Gönder"}
            </Button>
          </div>
        </div>
      )}

      {/* Root reply button when no reply is active */}
      {!replyingTo && !isRootReply && (
        <div className="border-t pt-3">
          <Button onClick={handleRootReply} size="sm" variant="outline" className="w-full">
            Yanıt Yaz
          </Button>
        </div>
      )}

      {/* Fixed gradient overlay at bottom - only show when not at bottom */}
      {!isAtBottom && (
        <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}
    </div>
  );
}
