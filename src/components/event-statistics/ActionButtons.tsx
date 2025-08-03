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
import { useState } from "react";

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

import { EmojiBoard } from "../EmojiBoard";

import type { ActionButtonsProps } from "./types";
import { getMostUsedEmojis } from "./utils";

export function ActionButtons({
  repliesCount,
  quotesCount,
  repostsCount,
  totalReactions,
  zapCount,
  zapAmount,
  hasUserReposted,
  hasZapped,
  isExpanded,
  showReplies,
  showQuotes,
  event,
  onToggleExpanded,
  onShowRepliesClick,
  onReactionClick,
  onRepostClick,
  onQuoteClick,
  onZapClick,
}: ActionButtonsProps) {
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  const handleReactionClick = (emoji: string) => {
    onReactionClick(emoji);
    setShowReactionPopup(false);
  };

  const handleEmojiModalSelect = (emoji: string) => {
    handleReactionClick(emoji);
    setShowEmojiModal(false);
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
      {/* Expand/Collapse button */}
      {totalReactions + zapCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className={`h-6 w-6 p-0 hover:text-amber-800 ${
            isExpanded ? "text-amber-700" : ""
          }`}
          title={isExpanded ? "Reaksiyonları daralt" : "Reaksiyonları genişlet"}
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
        onClick={onShowRepliesClick}
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

      {/* Only show repost button for kind 1 events (reposts are only for text notes) */}
      {event.kind === 1 && (
        <button
          onClick={onRepostClick}
          className={`flex items-center space-x-1 transition-colors cursor-pointer ${
            hasUserReposted ? "text-blue-600" : "hover:text-blue-600"
          }`}
          title={hasUserReposted ? "Reposted" : "Yeniden paylaş"}
        >
          <Repeat2 className="h-4 w-4" />
          <span>{repostsCount}</span>
        </button>
      )}

      {/* Quotes */}
      <button
        onClick={onQuoteClick}
        className={`flex items-center space-x-1 transition-colors cursor-pointer ${
          showQuotes ? "text-blue-600" : "hover:text-blue-600"
        }`}
        title={showQuotes ? "Alıntıları gizle" : "Alıntıları göster"}
      >
        <Quote className="h-4 w-4" />
        <span>{quotesCount}</span>
      </button>

      {/* Zaps */}
      <button
        onClick={onZapClick}
        className={`flex items-center space-x-1 transition-colors cursor-pointer ${
          hasZapped ? "text-orange-600" : "hover:text-orange-600"
        }`}
        title={hasZapped ? "Zap Gönderildi" : "Zap Gönder"}
      >
        <Zap className={`h-4 w-4 ${hasZapped ? "fill-current" : ""}`} />
        <span>{zapAmount}</span>
      </button>
    </div>
  );
}
