import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { Textarea } from "@/components/ui/textarea";
import { RenderedText } from "@/lib/text-renderer";

import { RichTextPreview } from "./RichTextPreview";
import type { QuotesSectionProps } from "./types";
import { cleanQuoteContent, isContainerAtBottom } from "./utils";

export function QuotesSection({
  quotesCount,
  quoteContent,
  showQuotePreview,
  statistics,
  profiles,
  onQuoteContentChange,
  onShowQuotePreviewToggle,
  onPostQuote,
  onQuoteKeyDown,
}: QuotesSectionProps) {
  const quotesContainerRef = useRef<HTMLDivElement>(null);
  const [isQuotesAtBottom, setIsQuotesAtBottom] = useState(false);

  useEffect(() => {
    if (!quotesContainerRef.current) {
      return;
    }

    setIsQuotesAtBottom(isContainerAtBottom({ current: quotesContainerRef.current }));
  }, [quotesContainerRef]);

  return (
    <div className="mt-4 border-l-2 border-blue-600 pl-4 space-y-3">
      {/* Existing quotes display */}
      <div className="space-y-2 relative">
        <div
          ref={quotesContainerRef}
          data-quotes-container
          className="max-h-[200px] overflow-y-auto overflow-x-hidden pr-2"
          onScroll={() => {
            setIsQuotesAtBottom(isContainerAtBottom({ current: quotesContainerRef.current }));
          }}
        >
          {quotesCount > 0 ? (
            <div className="space-y-2">
              {Array.from(statistics?.quotes?.values() || []).map((quote) => {
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
                          {new Date(quote.created_at * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <RenderedText enableRichPreviews>
                          {cleanQuoteContent(quote.content)}
                        </RenderedText>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Henüz alıntı yapılmamış</div>
          )}
        </div>

        {/* Fixed gradient overlay at bottom - only show when not at bottom */}
        {!isQuotesAtBottom && (
          <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {/* Quote composer */}
      <div className="border-t pt-3 space-y-2">
        <Textarea
          value={quoteContent}
          onChange={(e) => onQuoteContentChange(e.target.value)}
          onKeyDown={onQuoteKeyDown}
          placeholder="Alıntı yorumunuzu yazın..."
          className="min-h-[80px] resize-none"
        />

        {/* Preview toggle */}
        {quoteContent.trim() && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowQuotePreviewToggle}
              className="text-xs"
            >
              {showQuotePreview ? (
                <EyeOff className="h-3 w-3 mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              {showQuotePreview ? "Önizlemeyi gizle" : "Önizlemeyi göster"}
            </Button>
          </div>
        )}

        {/* Preview */}
        {showQuotePreview && quoteContent.trim() && <RichTextPreview content={quoteContent} />}

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={onPostQuote}
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
  );
}
