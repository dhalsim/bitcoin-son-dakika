import ReactMarkdown from "react-markdown";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import remarkGfm from "remark-gfm";

import type { SSGData } from "@/lib/ssg-data";
import { createProfileSlug, createTitleSlug } from "@/lib/ssg-data";

import { CategoryTags } from "../components/CategoryTags";
import { EventStatistics } from "../components/EventStatistics";
import MainContent from "../components/MainContent";
import { getDisplayName, ProfileAvatar } from "../components/ui/ProfileAvatar";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

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

  const articleItem = ssgData.articles.find(
    (article) => createTitleSlug(article.title) === slug,
  );

  if (!articleItem) {
    throw new Response("Article not found", { status: 404 });
  }

  return { articleItem };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const articleItem = data?.articleItem;

  if (!articleItem) {
    return [
      { title: "Makale Bulunamadı - Bitcoin Son Dakika" },
      {
        name: "description",
        content:
          "Aradığınız makale bulunamadı. Ana sayfaya geri dönebilirsiniz.",
      },
    ];
  }

  return [
    { title: `${articleItem.title} - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - ${articleItem.summary}`,
    },
  ];
};

export default function ArticleDetailPage() {
  const { articleItem } = useLoaderData<typeof loader>();

  if (!articleItem) {
    return <NotFound />;
  }

  const time = getTimeAgo(articleItem.publishedAt);
  const displayName = getDisplayName(
    articleItem.author,
    articleItem.event.pubkey,
  );

  return (
    <MainContent>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <CategoryTags tags={articleItem.tags} className="mb-4" />

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              {articleItem.title}
            </h1>

            {/* Author and Time */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex flex-col">{time}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <Link
                  to={`/profile/${createProfileSlug(displayName)}`}
                  className="text-gray-600 dark:text-gray-400 font-medium hover:text-main-accent transition-colors"
                >
                  <div className="flex items-center">
                    <ProfileAvatar
                      pubkey={articleItem.author.pubkey}
                      profile={articleItem.author}
                      disablePopup={true}
                      size="md"
                    />
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {displayName}
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Summary */}
            {articleItem.summary && (
              <div className="mb-6">
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {articleItem.summary}
                </p>
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-5">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 mt-4">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 dark:text-gray-300">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-main-accent pl-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-r">
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        {children}
                      </p>
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                          {children}
                        </code>
                      );
                    }

                    return (
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
                        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-main-accent hover:text-main-accent-dark underline"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="max-w-full h-auto rounded-lg shadow-lg my-4"
                    />
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left font-bold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {articleItem.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Event Statistics */}
          <div className="border-t pt-6">
            <EventStatistics
              event={articleItem.event}
              author={articleItem.author}
              className="justify-start"
            />
          </div>
        </article>
      </div>
    </MainContent>
  );
}
