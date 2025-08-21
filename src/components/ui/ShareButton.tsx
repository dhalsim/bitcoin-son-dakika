import { Share } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shareContent } from "@/lib/utils";
import { WEBSITE_URL } from "@/lib/constants";
import { createTitleSlug } from "../../../api-helpers/utils";
import { EventItem } from "@/lib/nip01";

interface ShareButtonProps {
  event: EventItem;
  isPodcast: boolean;
}

export function ShareButton({ event, isPodcast = false }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    setIsSharing(true);

    try {
      // Get the title and summary from props or event content
      const eventTitle = event.tags.find((tag) => tag[0] === "title")?.[1];
      const eventSummary = event.tags.find((tag) => tag[0] === "summary")?.[1];

      if (!eventTitle || !eventSummary) {
        toast({
          title: "Hata",
          description: "Paylaşım sırasında bir hata oluştu",
          variant: "destructive",
        });
        return;
      }

      // Create the slug and URL
      const slug = createTitleSlug(eventTitle);
      const isArticle = event.kind === 30023;
      const urlCategory = isPodcast ? "podcast" : isArticle ? "article" : "news";
      const url = `${WEBSITE_URL}/${urlCategory}/${slug}`;

      const success = await shareContent(url, eventTitle);

      if (success) {
        setShowCopiedTooltip(true);
        setTimeout(() => setShowCopiedTooltip(false), 2000);
      } else {
        toast({
          title: "Hata",
          description: "Paylaşım başarısız",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Share error:", error);

      toast({
        title: "Hata",
        description: "Paylaşım sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        disabled={isSharing}
        className="hover:text-green-600 p-2 gap-0 !transition-none"
        title="Paylaş"
      >
        <Share className="h-4 w-4" />
      </Button>

      {/* Tooltip */}
      {showCopiedTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-tooltip">
          Kopyalandı
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}
