import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import {
  useLatestNews,
  useLatestArticles,
  useSSGData,
  useLatestPodcasts,
} from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION, WEBSITE_URL, LOGO_URL } from "../lib/constants";
import { useState, useEffect, useCallback, useMemo } from "react";
import { EducationItem } from "@/lib/ssg-data";
import PodcastCard from "@/components/PodcastCard";

export const meta: MetaFunction = () => {
  const title = `${WEBSITE_NAME} - Güncel Bitcoin Haberleri ve Analizler`;
  const description = WEBSITE_DESCRIPTION;
  const siteUrl = `${WEBSITE_URL}`;
  const imageUrl = `${WEBSITE_URL}/${LOGO_URL}`;

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content:
        "bitcoin, btc, kripto para, lightning network, madencilik, bitcoin haberleri, nostr, analiz, piyasa, teknoloji, ekonomi, regülasyon, defi, nft, ethereum, altcoin, güvenlik, eğitim, geliştirme, podcast",
    },
    // Open Graph
    { property: "og:site_name", content: WEBSITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:url", content: siteUrl },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
};

type CategoryValue = "all" | "news" | "articles" | "podcast" | "education";

type Category = {
  label: string;
  value: CategoryValue;
};

// Define categories array first
const categories: Category[] = [
  {
    label: "Tümü",
    value: "all",
  },
  {
    label: "Haberler",
    value: "news",
  },
  {
    label: "Köşe Yazıları",
    value: "articles",
  },
  {
    label: "Podcast",
    value: "podcast",
  },
  {
    label: "Eğitim",
    value: "education",
  },
];

export default function Index() {
  const ssgData = useSSGData();
  const latestNews = useLatestNews(6); // Get latest 6 news items
  const latestArticles = useLatestArticles(2); // Get latest 2 articles for the articles row
  const latestPodcasts = useLatestPodcasts(2); // Get latest 2 podcasts for the podcasts row

  const [category, setCategory] = useState<CategoryValue>("all");

  // Handle category change - now instant!
  const handleCategoryChange = useCallback(
    (newCategory: CategoryValue) => {
      if (newCategory === category) return;
      setCategory(newCategory);
    },
    [category],
  );

  // Get featured content (latest news item) and main content
  const [featuredContent, ...mainNews] = latestNews;

  // Memoize all content combinations to avoid recalculating on every render
  const allContent = useMemo(() => {
    const educationContent: EducationItem[] = [];

    return [...mainNews, ...latestArticles, ...latestPodcasts, ...educationContent];
  }, [mainNews, latestArticles, latestPodcasts]);

  // Pre-calculate all category filters for instant switching
  const categoryContent = useMemo(() => {
    const contentMap = {
      all: allContent,
      news: allContent.filter((content) => content.type === "news"),
      articles: allContent.filter((content) => content.type === "article"),
      podcast: allContent.filter((content) => content.type === "podcast"),
      education: allContent.filter((content) => content.type === "education"),
    };
    return contentMap;
  }, [allContent]);

  // Pre-render all category content as React nodes for instant switching
  const categoryNodes = useMemo(() => {
    const renderContent = (content: any, index: number) => {
      const uniqueKey = `${content.type}-${index}`;

      if (content.type === "news") {
        return <NewsCard key={uniqueKey} {...content} />;
      } else if (content.type === "article") {
        return <NewsCard key={uniqueKey} {...content} />;
      } else if (content.type === "podcast") {
        return <PodcastCard key={uniqueKey} podcast={content} />;
      } else if (content.type === "education") {
        return null;
      }
      return null;
    };

    const createGrid = (content: any[], categoryName: string) => {
      if (content.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {categoryName === "all"
                ? "Henüz içerik bulunmuyor."
                : `Bu kategoride henüz içerik bulunmuyor.`}
            </p>
            {categoryName !== "all" && (
              <p className="text-muted-foreground text-sm mt-2">
                Diğer kategorileri kontrol etmeyi deneyin.
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 transition-all duration-200 ease-in-out rounded-lg p-2">
          {content.map((item, index) => renderContent(item, index))}
        </div>
      );
    };

    const nodesMap = {
      all: createGrid(categoryContent.all, "all"),
      news: createGrid(categoryContent.news, "news"),
      articles: createGrid(categoryContent.articles, "articles"),
      podcast: createGrid(categoryContent.podcast, "podcast"),
      education: createGrid(categoryContent.education, "education"),
    };
    return nodesMap;
  }, [categoryContent]);

  // Memoize category tabs to prevent unnecessary re-renders
  const categoryTabs = useMemo(() => {
    return categories.map(({ label, value }) => {
      const contentCount = categoryContent[value].length;
      const isActive = value === category;
      return (
        <button
          key={value}
          onClick={() => handleCategoryChange(value)}
          disabled={false}
          className={`pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap relative group ${
            isActive
              ? "border-main-accent text-main-accent"
              : "border-transparent text-muted-foreground hover:text-main-accent hover:border-muted-foreground"
          }`}
        >
          {label}
          {contentCount > 0 && (
            <span
              className={`ml-1 text-xs transition-colors duration-200 ${
                isActive ? "text-main-accent" : "text-muted-foreground group-hover:text-main-accent"
              }`}
            >
              ({contentCount})
            </span>
          )}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-main-accent rounded-full animate-pulse"></div>
          )}
        </button>
      );
    });
  }, [categories, categoryContent, category, handleCategoryChange]);

  // If no content is available, show empty state
  if (latestNews.length === 0 && latestArticles.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Haberler Yükleniyor...</h1>
          <p className="text-muted-foreground">
            Güncel Bitcoin haberleri ve analizler yakında burada olacak.
          </p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      {/* Featured News */}
      {featuredContent && (
        <div className="mb-6 sm:mb-8">
          <NewsCard {...featuredContent} featured={true} />
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b border-border overflow-x-auto">
        {categoryTabs}
      </div>

      {/* Loading State */}
      {/* Removed isLoading state and loading message */}

      {/* Main News Grid */}
      <div key={category} className="animate-in fade-in-50 duration-200 scale-in-95">
        {categoryNodes[category]}
      </div>

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-bold mb-2">SSG Data Debug:</h3>
          <p>News items: {ssgData.news.length}</p>
          <p>Articles: {ssgData.articles.length}</p>
          <p>Last updated: {new Date(ssgData.lastUpdated).toLocaleString()}</p>
        </div>
      )}
    </MainContent>
  );
}
