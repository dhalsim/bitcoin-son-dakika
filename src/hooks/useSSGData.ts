import { useMemo } from "react";

import { type SSGData, type NewsItem, type ArticleItem } from "../lib/ssg-data";

// Type declaration for global SSG data (only available during prerendering)
declare global {
  var __SSG_DATA__: SSGData | undefined;
}

/**
 * Hook to access SSG data that was fetched during prerendering
 * Throws an error if no SSG data is available
 */
export function useSSGData(): SSGData {
  return useMemo(() => {
    // Check if SSG data is available on global (during prerendering)
    if (typeof global !== "undefined" && global.__SSG_DATA__) {
      return global.__SSG_DATA__;
    }

    // Check if SSG data is available on window (client-side after hydration)
    if (
      typeof window !== "undefined" &&
      (window as any).__SSG_DATA__ &&
      (window as any).__SSG_DATA__ !== null
    ) {
      return (window as any).__SSG_DATA__;
    }

    // Throw error if no SSG data is available
    throw new Error(
      "SSG data is not available. This should not happen in production builds. " +
        "The build process should have failed if data could not be fetched.",
    );
  }, []);
}

/**
 * Hook to get news items from SSG data
 */
export function useNewsItems(): NewsItem[] {
  const ssgData = useSSGData();

  return ssgData.news;
}

/**
 * Hook to get article items from SSG data
 */
export function useArticleItems(): ArticleItem[] {
  const ssgData = useSSGData();

  return ssgData.articles;
}

/**
 * Hook to get the latest news items (up to specified limit)
 */
export function useLatestNews(limit: number = 10): NewsItem[] {
  const news = useNewsItems();

  return useMemo(() => news.slice(0, limit), [news, limit]);
}

/**
 * Hook to get the latest articles (up to specified limit)
 */
export function useLatestArticles(limit: number = 10): ArticleItem[] {
  const articles = useArticleItems();

  return useMemo(() => articles.slice(0, limit), [articles, limit]);
}

/**
 * Hook to get a specific news item by ID
 */
export function useNewsItem(id: string): NewsItem | undefined {
  const news = useNewsItems();

  return useMemo(() => news.find((item) => item.id === id), [news, id]);
}

/**
 * Hook to get a specific article by ID
 */
export function useArticleItem(id: string): ArticleItem | undefined {
  const articles = useArticleItems();

  return useMemo(() => articles.find((item) => item.id === id), [articles, id]);
}

/**
 * Hook to get news items by category
 */
export function useNewsByCategory(category: string): NewsItem[] {
  const news = useNewsItems();

  return useMemo(
    () => news.filter((item) => item.category === category),
    [news, category],
  );
}

/**
 * Hook to get articles by category
 */
export function useArticlesByCategory(category: string): ArticleItem[] {
  const articles = useArticleItems();

  return useMemo(
    () => articles.filter((item) => item.category === category),
    [articles, category],
  );
}
