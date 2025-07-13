import { useMemo } from "react";

import { type SSGData, type NewsItem, type ArticleItem } from "../lib/ssg-data";

// Type declaration for global SSG data (only available during prerendering)
declare global {
  var __SSG_DATA__: SSGData | undefined;
}

/**
 * Hook to access SSG data that was fetched during prerendering
 * Falls back to empty data if not available (e.g., in development)
 */
export function useSSGData(): SSGData {
  return useMemo(() => {
    // Check if SSG data is available on global (during prerendering)
    if (typeof global !== "undefined" && global.__SSG_DATA__) {
      return global.__SSG_DATA__;
    }

    // Fallback to empty data if no SSG data is available
    return {
      news: [],
      articles: [],
      lastUpdated: Date.now(),
    };
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
