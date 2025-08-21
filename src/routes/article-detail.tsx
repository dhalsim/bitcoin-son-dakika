import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import ArticleMarkdownRenderer from "@/components/ui/ArticleMarkdownRenderer";

import type { SSGData } from "@/lib/ssg-data";
import { createProfileSlug } from "@/lib/ssg-data";

import { createTitleSlug } from "../../api-helpers/utils";

import { CategoryTags } from "../components/CategoryTags";
import { EventStatistics } from "../components/EventStatistics";
import MainContent from "../components/MainContent";
import { getDisplayName, ProfileAvatar } from "../components/ui/ProfileAvatar";
import { WEBSITE_NAME, WEBSITE_URL, LOGO_URL } from "../lib/constants";

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

  const articleItem = ssgData.articles.find((article) => createTitleSlug(article.title) === slug);

  if (!articleItem) {
    throw new Response("Article not found", { status: 404 });
  }

  return { articleItem };
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  const articleItem = loaderData?.articleItem;

  if (!articleItem) {
    return [
      { title: "Makale Bulunamadı - Bitcoin Son Dakika" },
      {
        name: "description",
        content: "Aradığınız makale bulunamadı. Ana sayfaya geri dönebilirsiniz.",
      },
    ];
  }

  const title = `Makale - ${articleItem.title} - ${WEBSITE_NAME}`;
  const description =
    articleItem.summary?.substring(0, 200) || articleItem.content.substring(0, 160);
  const canonicalUrl = `${WEBSITE_URL}/article/${createTitleSlug(articleItem.title!)}`;
  const imageUrl = articleItem.image ? articleItem.image : `${WEBSITE_URL}/${LOGO_URL}`;

  // Add tags for better SEO
  const tags = articleItem.tags?.length > 0 ? articleItem.tags.join(", ") : undefined;

  return [
    { title },
    { name: "description", content: description },
    // Keywords (tags)
    ...(tags ? [{ name: "keywords", content: tags }] : []),
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

export default function ArticleDetailPage() {
  const { articleItem } = useLoaderData<typeof loader>();

  if (!articleItem) {
    return <NotFound />;
  }

  const time = getTimeAgo(articleItem.publishedAt);
  const displayName = getDisplayName(articleItem.author, articleItem.event.pubkey);

  return (
    <MainContent>
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <CategoryTags tags={articleItem.tags} className="mb-4" />

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {articleItem.title}
          </h1>

          {/* Author and Time */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
            <div className="flex flex-col">{time}</div>
            <div className="text-xs text-muted-foreground">
              <Link
                to={`/profile/${createProfileSlug(displayName)}`}
                className="text-foreground font-medium hover:text-main-accent transition-colors"
              >
                <div className="flex items-center">
                  <ProfileAvatar
                    pubkey={articleItem.author.pubkey}
                    profile={articleItem.author}
                    disablePopup={true}
                    size="md"
                  />
                  <div className="font-medium text-foreground">{displayName}</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Summary */}
          {articleItem.summary && (
            <div className="mb-6">
              <p className="text-lg text-muted-foreground leading-relaxed">{articleItem.summary}</p>
            </div>
          )}
        </header>

        {/* Content */}
        <ArticleMarkdownRenderer content={articleItem.content} className="mb-8" />

        {/* Event Statistics */}
        <div className="border-t border-border pt-6">
          <EventStatistics
            event={articleItem.event}
            author={articleItem.author}
            className="justify-start"
          />
        </div>
      </article>
    </MainContent>
  );
}
