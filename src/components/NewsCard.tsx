import type { NostrEvent } from "nostr-tools";
import React from "react";
import { Link } from "react-router";

import type { ProfileItem } from "@/lib/nip01";
import { createProfileSlug } from "@/lib/ssg-data";
import type { NewsItem, ArticleItem } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";

import { EventStatistics } from "./EventStatistics";
import { Card, CardHeader, CardContent } from "./ui/card";
import { ProfileAvatar } from "./ui/ProfileAvatar";

export interface NewsCardProps {
  title: string;
  summary: string;
  category: string;
  time: string;
  publishedAt: number;
  image?: string;
  featured?: boolean;
  author?: ProfileItem;
  nostrEvent: NostrEvent;
  eventRelayHint: string;
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

// Helper function to convert NewsItem to NewsCard props
export function convertNewsItemToNewsCardProps(item: NewsItem): NewsCardProps {
  const timeAgo = getTimeAgo(item.publishedAt);
  const title = `Haber - ${item.title}`;

  return {
    title,
    summary: item.summary || item.content.substring(0, 150) + "...",
    category: item.category || "Bitcoin",
    time: timeAgo,
    publishedAt: item.publishedAt,
    image: item.image,
    author: item.author,
    nostrEvent: item.event,
    eventRelayHint: item.relayHint,
  };
}

// Helper function to convert ArticleItem to NewsCard props
export function convertArticleItemToNewsCardProps(
  item: ArticleItem,
): NewsCardProps {
  const timeAgo = getTimeAgo(item.publishedAt);
  const title = `Makale - ${item.title}`;

  return {
    title,
    summary: item.summary || item.content.substring(0, 150) + "...",
    category: item.category || "Bitcoin",
    time: timeAgo,
    publishedAt: item.publishedAt,
    image: item.image,
    author: item.author,
    nostrEvent: item.event,
    eventRelayHint: item.relayHint,
  };
}

// Generic helper function that works with both NewsItem and ArticleItem
export function convertToNewsCardProps(
  item: NewsItem | ArticleItem,
): NewsCardProps {
  const timeAgo = getTimeAgo(item.publishedAt);
  const isArticle = "identifier" in item;
  const prefix = isArticle ? "Makale - " : "Haber - ";
  const title = `${prefix}${item.title}`;

  return {
    title,
    summary: item.summary || item.content.substring(0, 150) + "...",
    category: item.category || "Bitcoin",
    time: timeAgo,
    publishedAt: item.publishedAt,
    image: item.image,
    author: item.author,
    nostrEvent: item.event,
    eventRelayHint: item.relayHint,
  };
}

export const NewsCard: React.FC<NewsCardProps> = ({
  title,
  summary,
  category,
  time,
  image,
  featured = false,
  author,
  nostrEvent,
  eventRelayHint,
}) => {
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
              <span className="bg-main-accent text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {category}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>{time}</span>
          {author && author.display_name && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${createProfileSlug(author.display_name)}`}
                className="text-gray-600 dark:text-gray-400 font-medium hover:text-main-accent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ProfileAvatar
                    pubkey="" // NewsCard doesn't have pubkey, so we use empty string
                    profile={{
                      pubkey: "",
                      display_name: author.display_name,
                      picture: author.picture,
                      created_at: author.created_at,
                    }}
                    size="sm"
                    className="mr-2"
                  />
                  {author.display_name}
                </div>
              </Link>
            </div>
          )}
        </div>

        <h3
          className={`font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 hover:text-main-accent transition-colors cursor-pointer ${
            featured
              ? "text-lg sm:text-xl leading-tight"
              : "text-base sm:text-lg leading-tight"
          }`}
        >
          {title}
        </h3>

        <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
          <RenderedText enableRichPreviews>{summary}</RenderedText>
        </div>

        {/* Interactive Statistics */}
        {nostrEvent && (
          <div className="mt-4 pt-4 border-t">
            <EventStatistics
              event={nostrEvent}
              eventRelayHint={eventRelayHint}
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
