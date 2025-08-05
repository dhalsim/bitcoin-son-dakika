import React from "react";
import { Link } from "react-router";

import type { EventItem, ProfileItem } from "@/lib/nip01";
import { createTitleSlug, createProfileSlug } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";

import { CategoryTags } from "./CategoryTags";
import { EventStatistics } from "./EventStatistics";
import { Card, CardHeader, CardContent } from "./ui/card";
import { getDisplayName, ProfileAvatar } from "./ui/ProfileAvatar";

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
  const time = getTimeAgo(publishedAt);
  const displayName = getDisplayName(author, event.pubkey);
  const slug: string | null = title ? createTitleSlug(title) : null;
  const isArticle = event.kind === 30023;
  const link: string | null = slug
    ? isArticle
      ? `/article/${slug}`
      : `/news/${slug}`
    : null;

  const titleText = title
    ? isArticle
      ? `Makale - ${title}`
      : `Haber - ${title}`
    : "";

  const hasLink = titleText !== "" && link && summary;

  const titleElement = hasLink ? (
    <Link to={link}>
      {titleText}
      {title}
    </Link>
  ) : titleText ? (
    <>
      {titleText}
      {title}
    </>
  ) : null;

  return (
    <Card className="h-full">
      <CardHeader>
        {image && (
          <div
            className={`relative ${featured ? "h-48 sm:h-64" : "h-40 sm:h-48"}`}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
              <CategoryTags
                tags={event.tags
                  .filter((tag) => tag[0] === "t")
                  .map((tag) => tag[1])}
                tagClassName="text-xs"
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>{time}</span>
          {author && displayName && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${createProfileSlug(displayName)}`}
                className="text-gray-600 dark:text-gray-400 font-medium hover:text-main-accent transition-colors"
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
            className={`font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 hover:text-main-accent transition-colors cursor-pointer ${
              featured
                ? "text-lg sm:text-xl leading-tight"
                : "text-base sm:text-lg leading-tight"
            }`}
          >
            {titleElement}
          </h3>
        )}

        {/* Show tags in content area when no image */}
        {!image && event.tags && event.tags.length > 0 && (
          <div className="mb-3">
            <CategoryTags
              tags={event.tags
                .filter((tag) => tag[0] === "t")
                .map((tag) => tag[1])}
              className="text-xs"
            />
          </div>
        )}

        <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
          <RenderedText enableRichPreviews>
            {summary || event.content}
          </RenderedText>
        </div>

        {/* Interactive Statistics */}
        {event && (
          <div className="mt-4 pt-4 border-t">
            <EventStatistics
              event={event}
              author={author}
              className="justify-start"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsCard;
