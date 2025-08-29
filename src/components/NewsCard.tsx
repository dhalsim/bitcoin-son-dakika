import React, { useState } from "react";
import { Link } from "react-router";

import type { EventItem, ProfileItem } from "@/lib/nip01";
import { createProfileSlug } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";
import { links } from "@/lib/utils";

import { createTitleSlug } from "../../api-helpers/utils";

import { CategoryTags } from "./CategoryTags";
import { EventStatistics } from "./EventStatistics";
import { Card, CardContent } from "./ui/card";
import { getDisplayName, ProfileAvatar } from "./ProfileAvatar";

export interface NewsCardProps {
  event: EventItem;
  publishedAt: number;
  title?: string;
  summary?: string;
  image?: string;
  featured?: boolean;
  author?: ProfileItem;
}

// Helper function to get time ago from timestamp
export function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffSeconds = Math.floor(now - timestamp);

  if (diffSeconds < 60) {
    return `${diffSeconds} saniye önce`;
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);

    return `${minutes} dakika önce`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);

    return `${hours} saat önce`;
  } else {
    const days = Math.floor(diffSeconds / 86400);

    return `${days} gün önce`;
  }
}

export const NewsCard: React.FC<NewsCardProps> = ({
  title,
  summary,
  publishedAt,
  image,
  featured = false,
  author,
  event,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const time = getTimeAgo(publishedAt);
  const displayName = getDisplayName(author, event.pubkey);
  const slug: string | null = title ? createTitleSlug(title) : null;
  const isArticle = event.kind === 30023;
  const link: string | null = slug
    ? isArticle
      ? links.articleDetail(slug)
      : links.newsDetail(slug)
    : null;

  const titleText = title ? (isArticle ? `Makale - ${title}` : `Haber - ${title}`) : "";

  const hasLink = titleText !== "" && link && summary;

  const wrapInLink = (element: React.ReactNode, className?: string) => {
    return hasLink ? (
      <Link to={link} className={className}>
        {element}
      </Link>
    ) : (
      element
    );
  };

  const titleElement = wrapInLink(
    <>{titleText}</>,
    "hover:text-main-accent decoration-main-accent",
  );

  const imageElement = image
    ? wrapInLink(
        <img src={image} alt={title} className="w-full h-full object-cover" />,
        "hover:opacity-80 transition-opacity cursor-pointer",
      )
    : null;

  const CONTENT_PREVIEW_LENGTH = 200;
  const hasSummary = Boolean(summary && summary.trim().length > 0);
  const isContentLong = Boolean(event.content) && event.content.length > CONTENT_PREVIEW_LENGTH;
  const fullText = hasSummary ? `${summary}\n\n${event.content}` : event.content;
  const previewText = hasSummary
    ? summary
    : isContentLong
      ? `${event.content.slice(0, CONTENT_PREVIEW_LENGTH)}…`
      : event.content;
  const textToRender = isExpanded ? fullText : previewText;
  const showContinueLink = !isExpanded && (hasSummary || isContentLong);

  return (
    <Card className="h-full">
      {imageElement && (
        <div className="relative aspect-video overflow-hidden rounded-t-lg mb-4 group">
          {imageElement}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
            <CategoryTags
              tags={event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1])}
              size="xs"
            />
          </div>
        </div>
      )}

      <CardContent className="flex-1">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>{time}</span>
          {author && displayName && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${createProfileSlug(displayName)}`}
                className="text-muted-foreground font-medium hover:text-main-accent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ProfileAvatar
                    pubkey={author.pubkey}
                    profile={author}
                    disablePopup={true}
                    size="sm"
                    className="mr-2"
                  />
                  {displayName}
                </div>
              </Link>
            </div>
          )}
        </div>

        {titleElement && (
          <h3
            className={`font-bold text-foreground mb-2 sm:mb-3 hover:text-main-accent transition-colors cursor-pointer ${
              featured ? "text-lg sm:text-xl leading-tight" : "text-base sm:text-lg leading-tight"
            }`}
          >
            {titleElement}
          </h3>
        )}

        {/* Show tags in content area when no image */}
        {!image && event.tags && event.tags.length > 0 && (
          <div className="mb-3">
            <CategoryTags
              tags={event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1])}
              className="text-xs"
            />
          </div>
        )}

        <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
          <RenderedText enableRichPreviews preserveNewlines className="inline">
            {textToRender}
          </RenderedText>
          {(showContinueLink || isExpanded) && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="align-baseline text-main-accent decoration-main-accent font-medium cursor-pointer hover:underline underline-offset-4"
              >
                {isExpanded ? "Daha az göster" : "Devamını oku"}
              </button>
            </>
          )}
        </div>

        {/* Interactive Statistics */}
        {event && (
          <div className="mt-4 pt-4 border-t border-border">
            <EventStatistics event={event} author={author} className="justify-start" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsCard;
