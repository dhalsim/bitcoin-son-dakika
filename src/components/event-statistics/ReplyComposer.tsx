import { Eye, EyeOff } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { RichTextPreview } from "./RichTextPreview";
import type { ReplyComposerProps } from "./types";

export function ReplyComposer({
  replyContent,
  showPreview,
  showOnlyCompose,
  onReplyContentChange,
  onShowPreviewToggle,
  onFocus,
  onBlur,
  onPostReply,
  onKeyDown,
}: ReplyComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="border-t pt-3 space-y-2">
      <Textarea
        ref={textareaRef}
        value={replyContent}
        onChange={(e) => onReplyContentChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Yorumunuzu yazın..."
        className="min-h-[80px] resize-none"
      />

      {/* Preview toggle */}
      {replyContent.trim() && (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onShowPreviewToggle} className="text-xs">
            {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
      )}

      {/* Preview */}
      {showPreview && replyContent.trim() && <RichTextPreview content={replyContent} />}

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onPostReply}
          disabled={!replyContent.trim()}
          size="sm"
          variant="default"
          className="w-full cursor-pointer hover:bg-purple-600"
        >
          Yorum Yap
        </Button>
      </div>
    </div>
  );
}
