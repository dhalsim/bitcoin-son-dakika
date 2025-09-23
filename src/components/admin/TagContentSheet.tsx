import { useState } from "react";
import { ExternalLink, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useSSGData } from "@/contexts/SSGContext";
import { getDisplayName, type ContentItem } from "@/lib/ssg-data";
import { WEBSITE_URL } from "@/lib/constants";
import { assertUnreachable, links } from "@/lib/utils";

import { createTitleSlug } from "api-helpers/common_with_client";

interface TagContentSheetProps {
  tag: string;
  tagLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TagContentSheet({
  tag,
  tagLabel,
  open,
  onOpenChange,
}: TagContentSheetProps) {
  const ssgData = useSSGData();

  // Get all content that uses this tag
  const getContentWithTag = () => {
    if (!ssgData) return [];

    const allContent: ContentItem[] = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts];

    return allContent.filter((item) => item.tagItems.some((itemTag) => itemTag.tag === tag));
  };

  const contentWithTag = getContentWithTag();

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "news":
        return "Haber";
      case "article":
        return "Makale";
      case "podcast":
        return "Podcast";
      default:
        return type;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "news":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "article":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "podcast":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getContentUrl = (item: ContentItem) => {
    const slug = createTitleSlug(item.title);

    switch (item.type) {
      case "news":
        return `${WEBSITE_URL}${links.newsDetail(slug)}`;
      case "article":
        return `${WEBSITE_URL}${links.articleDetail(slug)}`;
      case "podcast":
        return `${WEBSITE_URL}${links.podcastDetail(slug)}`;
      default:
        return assertUnreachable(item);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {tag}
            </Badge>
            <span>{tagLabel}</span>
          </SheetTitle>
          <SheetDescription>
            Bu etiketi kullanan {contentWithTag.length} içerik bulundu
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {contentWithTag.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bu etiket henüz hiçbir içerikte kullanılmamış
            </div>
          ) : (
            contentWithTag
              .sort((a, b) => b.publishedAt - a.publishedAt) // Sort by newest first
              .map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getContentTypeColor(item.type)}`}>
                          {getContentTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.publishedAt)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {item.type === "news"
                          ? (item as any).title || item.content.slice(0, 100) + "..."
                          : item.title}
                      </h3>

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                        {item.type === "news"
                          ? (item as any).summary || item.content.slice(0, 150) + "..."
                          : (item as any).summary || item.content.slice(0, 150) + "..."}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{getDisplayName(item.author, item.author.pubkey)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getContentUrl(item), "_blank")}
                        className="h-8 px-3"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Aç
                      </Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
