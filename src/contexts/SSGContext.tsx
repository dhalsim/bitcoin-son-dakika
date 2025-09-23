import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import {
  type SSGData,
  type NewsItem,
  type ArticleItem,
  PodcastItem,
  ContentItem,
} from "../lib/ssg-data";

// Type declaration for global SSG data (only available during prerendering)
declare global {
  var __SSG_DATA__: SSGData | undefined;
}

interface SSGContextType {
  data: SSGData;
  news: NewsItem[];
  articles: ArticleItem[];
  podcasts: PodcastItem[];
  lastUpdated: number;
}

const SSGContext = createContext<SSGContextType | null>(null);

interface SSGProviderProps {
  children: ReactNode;
}

// Fallback data for development mode
const createFallbackData = (): SSGData => ({
  news: [],
  articles: [],
  podcasts: [],
  tags: [],
  lastUpdated: Date.now(),
});

export function SSGProvider({ children }: SSGProviderProps) {
  const contextValue = useMemo(() => {
    let ssgData: SSGData;

    // Check if SSG data is available on global (during prerendering)
    if (typeof global !== "undefined" && global.__SSG_DATA__) {
      ssgData = global.__SSG_DATA__;
    }
    // Check if SSG data is available on window (client-side after hydration)
    else if (
      typeof window !== "undefined" &&
      (window as any).__SSG_DATA__ &&
      (window as any).__SSG_DATA__ !== null
    ) {
      ssgData = (window as any).__SSG_DATA__;
    }
    // In development mode, provide fallback data instead of throwing
    else if (process.env.NODE_ENV === "development") {
      console.warn("SSG data not available in development mode. Using fallback data.");
      ssgData = createFallbackData();
    }
    // Throw error if no SSG data is available in production
    else {
      throw new Error(
        "SSG data is not available. This should not happen in production builds. " +
          "The build process should have failed if data could not be fetched.",
      );
    }

    return {
      data: ssgData,
      news: ssgData.news,
      articles: ssgData.articles,
      podcasts: ssgData.podcasts,
      lastUpdated: ssgData.lastUpdated,
    };
  }, []);

  return <SSGContext.Provider value={contextValue}>{children}</SSGContext.Provider>;
}

export function useSSGContext(): SSGContextType {
  const context = useContext(SSGContext);
  if (!context) {
    throw new Error("useSSGContext must be used within an SSGProvider");
  }

  return context;
}

// Convenience hooks that use the context
export function useSSGData(): SSGData {
  return useSSGContext().data;
}

export function useNewsItems(): NewsItem[] {
  return useSSGContext().news;
}

export function useArticleItems(): ArticleItem[] {
  return useSSGContext().articles;
}

export function usePodcastItems(): PodcastItem[] {
  return useSSGContext().podcasts;
}

export function useLatestNews(limit: number = 10): NewsItem[] {
  const news = useNewsItems();

  return useMemo(() => news.slice(0, limit), [news, limit]);
}

export function useLatestArticles(limit: number = 10): ArticleItem[] {
  const articles = useArticleItems();

  return useMemo(() => articles.slice(0, limit), [articles, limit]);
}

export function useLatestPodcasts(limit: number = 10): PodcastItem[] {
  const podcasts = usePodcastItems();

  return useMemo(() => podcasts.slice(0, limit), [podcasts, limit]);
}

export function useNewsItem(id: string): NewsItem | undefined {
  const news = useNewsItems();

  return useMemo(() => news.find((item) => item.id === id), [news, id]);
}

export function useArticleItem(id: string): ArticleItem | undefined {
  const articles = useArticleItems();

  return useMemo(() => articles.find((item) => item.id === id), [articles, id]);
}

// Additional utility hooks
export function useAllContent(): ContentItem[] {
  const news = useNewsItems();
  const articles = useArticleItems();
  const podcasts = usePodcastItems();

  return useMemo(() => [...news, ...articles, ...podcasts], [news, articles, podcasts]);
}

export function useContentByAuthor(pubkey: string): ContentItem[] {
  const allContent = useAllContent();

  return useMemo(
    () => allContent.filter((item) => item.author.pubkey === pubkey),
    [allContent, pubkey],
  );
}

export function useContentStats() {
  const news = useNewsItems();
  const articles = useArticleItems();
  const lastUpdated = useSSGContext().lastUpdated;

  return useMemo(
    () => ({
      totalNews: news.length,
      totalArticles: articles.length,
      totalContent: news.length + articles.length,
      lastUpdated,
    }),
    [news.length, articles.length, lastUpdated],
  );
}
