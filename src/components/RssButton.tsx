import { Rss } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RssButtonProps {
  text?: string;
  variant?: "default" | "outline" | "ghost" | "blue";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function RssButton({
  text,
  variant = "outline",
  size = "default",
  className = "",
}: RssButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyRss = async () => {
    try {
      const rssUrl = `${window.location.origin}/feed/podcast-rss.xml`;
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);

      toast({
        title: "Başarılı",
        description: "RSS feed URL'si kopyalandı",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "RSS feed URL'si kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopyRss}
      className={className}
      title="RSS Feed URL'sini Kopyala"
    >
      <Rss className="h-4 w-4" />
      {text && <span className="ml-2">{copied ? "Kopyalandı!" : text}</span>}
    </Button>
  );
}
