import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import type { SSGData } from "@/lib/ssg-data";
import { RenderedText } from "@/lib/text-renderer";
import { getTimeAgo, links } from "@/lib/utils";

import { createTitleSlug } from "../../api-helpers/utils";

import { CategoryTags } from "../components/CategoryTags";
import { EventStatistics } from "../components/EventStatistics";
import MainContent from "../components/MainContent";
import { getDisplayName, ProfileAvatar } from "../components/ProfileAvatar";
import { WEBSITE_NAME, WEBSITE_URL, LOGO_URL } from "../lib/constants";

import NotFound from "./$";

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
      { title: `Haber Bulunamadı - ${WEBSITE_NAME}` },
      {
        name: "description",
        content: "Aradığınız haber bulunamadı. Ana sayfaya geri dönebilirsiniz.",
      },
    ];
  }

  const title = `Haber - ${newsItem.title} - ${WEBSITE_NAME}`;
  const description = newsItem.summary?.substring(0, 200) || newsItem.content.substring(0, 160);
  const canonicalUrl = `${WEBSITE_URL}${links.newsDetail(createTitleSlug(newsItem.title!))}`;
  const imageUrl = newsItem.image ? newsItem.image : `${WEBSITE_URL}/${LOGO_URL}`;

  // Add tags for better SEO
  const tags =
    newsItem.tagItems?.length > 0
      ? `bitcoin, btc, ${newsItem.tagItems.join(", ")}`
      : "bitcoin, btc";

  return [
    { title },
    { name: "description", content: description },
    // Canonical URL
    { rel: "canonical", href: canonicalUrl },
    // Keywords (tags)
    { name: "keywords", content: tags },
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
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {/* Category and Tags */}
          <CategoryTags tagItems={newsItem.tagItems} className="mb-4" />

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
    </MainContent>
  );
}
