import React from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import type { SSGData } from "@/lib/ssg-data";
import { createTitleSlug } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";

import { CategoryTags } from "../components/CategoryTags";
import { EventStatistics } from "../components/EventStatistics";
import MainContent from "../components/MainContent";
import { getDisplayName, ProfileAvatar } from "../components/ui/ProfileAvatar";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION, WEBSITE_URL, LOGO_URL } from "../lib/constants";

import NotFound from "./$";

// Helper function to get time ago from timestamp
function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffSeconds = Math.floor(now - timestamp);

  if (diffSeconds < 60) {
    return `${diffSeconds} saniye önce`;
  }

  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);

    return `${minutes} dakika önce`;
  }

  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);

    return `${hours} saat önce`;
  }

  const days = Math.floor(diffSeconds / 86400);

  return `${days} gün önce`;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;

  if (!slug) {
    throw new Response("Slug not found", { status: 404 });
  }

  // Get SSG data from global (available during prerendering)
  const ssgData: SSGData = (global as any).__SSG_DATA__;

  if (!ssgData) {
    throw new Response("SSG data not available", { status: 500 });
  }

  const newsItem = ssgData.news.find((article) => createTitleSlug(article.title) === slug);

  if (!newsItem) {
    throw new Response("News item not found", { status: 404 });
  }

  return { newsItem };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const newsItem = data?.newsItem;

  if (!newsItem) {
    return [
      { title: "Haber Bulunamadı - Bitcoin Son Dakika" },
      {
        name: "description",
        content: "Aradığınız haber bulunamadı. Ana sayfaya geri dönebilirsiniz.",
      },
    ];
  }

  const title = `${newsItem.title} - ${WEBSITE_NAME}`;
  const description = newsItem.summary || WEBSITE_DESCRIPTION;
  const canonicalUrl = `${WEBSITE_URL}/news/${createTitleSlug(newsItem.title!)}`;
  const imageUrl = newsItem.image
    ? newsItem.image.startsWith("http")
      ? newsItem.image
      : `${WEBSITE_URL}${newsItem.image}`
    : `${WEBSITE_URL}${LOGO_URL}`;

  return [
    { title },
    { name: "description", content: description },
    // Open Graph
    { property: "og:site_name", content: WEBSITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:url", content: canonicalUrl },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
};

export default function NewsDetailPage() {
  const { newsItem } = useLoaderData<typeof loader>();

  if (!newsItem) {
    return <NotFound />;
  }

  const time = getTimeAgo(newsItem.publishedAt);
  const displayName = getDisplayName(newsItem.author, newsItem.event.pubkey);

  return (
    <MainContent>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {/* Category and Tags */}
            <CategoryTags tags={newsItem.tags} className="mb-4" />

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
              {newsItem.title}
            </h1>

            {/* Author and Time */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
              <div className="flex items-center space-x-3">
                <ProfileAvatar
                  pubkey={newsItem.author.pubkey}
                  profile={newsItem.author}
                  disablePopup={true}
                  size="md"
                />
                <div>
                  <div className="font-medium text-foreground">{displayName}</div>
                  <div className="text-xs">{time}</div>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {newsItem.image && (
              <div className="mb-8">
                <img
                  src={newsItem.image}
                  alt={newsItem.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <div className="text-foreground leading-relaxed">
              <RenderedText enableRichPreviews preserveNewlines>
                {newsItem.content}
              </RenderedText>
            </div>
          </div>

          {/* Event Statistics */}
          <div className="border-t border-border pt-6">
            <EventStatistics
              event={newsItem.event}
              author={newsItem.author}
              className="justify-start"
            />
          </div>
        </article>
      </div>
    </MainContent>
  );
}
