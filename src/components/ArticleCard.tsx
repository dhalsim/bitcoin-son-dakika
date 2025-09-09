import React, { useState } from "react";
import { Link } from "react-router";

import type { EventItem, ProfileItem } from "@/lib/nip01";
import { createAuthorSlug } from "@/lib/ssg-data";
import { getTimeAgo, links } from "@/lib/utils";

import { createTitleSlug, type TagItem } from "../../api-helpers/utils";

import ArticleMarkdownRenderer from "./ArticleMarkdownRenderer";
import { CategoryTags } from "./CategoryTags";
import { EventStatistics } from "./EventStatistics";
import { Card, CardContent } from "./ui/card";
import { getDisplayName, ProfileAvatar } from "./ProfileAvatar";

export interface ArticleCardProps {
  event: EventItem;
  publishedAt: number;
  tagItems: TagItem[];
  title?: string;
  summary?: string;
  image?: string;
  featured?: boolean;
  author?: ProfileItem;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  summary,
  publishedAt,
  image,
  featured = false,
  author,
  tagItems,
  event,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const time = getTimeAgo(publishedAt);
  const displayName = getDisplayName(author, event.pubkey);
  const slug: string | null = title ? createTitleSlug(title) : null;
  const link: string | null = slug ? links.articleDetail(slug) : null;

  const titleText = title ? `Makale - ${title}` : "";

  const hasLink = titleText !== "" && link;

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

  const CONTENT_PREVIEW_LENGTH = 300;
  const hasSummary = Boolean(summary && summary.trim().length > 0);
  const isContentLong = Boolean(event.content) && event.content.length > CONTENT_PREVIEW_LENGTH;
  const fullContent = hasSummary ? `${summary}\n\n${event.content}` : event.content;
  const previewContent = hasSummary
    ? summary
    : isContentLong
      ? `${event.content.slice(0, CONTENT_PREVIEW_LENGTH)}…`
      : event.content;
  const contentToRender = isExpanded ? fullContent : previewContent;
  const showContinueLink = !isExpanded && (hasSummary || isContentLong);

  return (
    <Card className="h-full">
      {imageElement && (
        <div className="relative aspect-video overflow-hidden rounded-t-lg mb-4 group">
          {imageElement}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
            <CategoryTags tagItems={tagItems} size="xs" />
          </div>
        </div>
      )}

      <CardContent className="flex-1">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>{time}</span>
          {author && displayName && (
            <div className="flex items-center space-x-2">
              <Link
                to={links.author(createAuthorSlug(displayName))}
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
        {!image && tagItems && tagItems.length > 0 && (
          <div className="mb-3">
            <CategoryTags tagItems={tagItems} className="text-xs" />
          </div>
        )}

        <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
          {isExpanded ? (
            <ArticleMarkdownRenderer content={contentToRender} className="mb-4" />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ArticleMarkdownRenderer content={contentToRender} className="mb-4" />
            </div>
          )}
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

export default ArticleCard;
