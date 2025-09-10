import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import ArticleCard from "../components/ArticleCard";
import {
  useLatestNews,
  useLatestArticles,
  useSSGData,
  useLatestPodcasts,
} from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION, WEBSITE_URL, LOGO_URL } from "../lib/constants";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ContentItem, EducationItem } from "@/lib/ssg-data";
import PodcastCard from "@/components/PodcastCard";
import { assertUnreachable, links } from "@/lib/utils";
import { Clock4, Mic, PenTool } from "lucide-react";

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
  color?: string;
  icon?: React.ReactNode;
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
    color: "text-red-500",
    icon: <Clock4 className="h-4 w-4 mr-2" />,
  },
  {
    label: "Köşe Yazıları",
    value: "articles",
    color: "text-main-accent",
    icon: <PenTool className="h-4 w-4 mr-2" />,
  },
  {
    label: "Podcast",
    value: "podcast",
    color: "text-purple-500",
    icon: <Mic className="h-4 w-4 mr-2" />,
  },
];

export default function Index() {
  const ssgData = useSSGData();
  const latestNews = useLatestNews(6); // Get latest 6 news items
  const latestArticles = useLatestArticles(2); // Get latest 2 articles for the articles row
  const latestPodcasts = useLatestPodcasts(3); // Get latest 3 podcasts for the podcasts row

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
    const renderContent = (content: ContentItem, index: number) => {
      const uniqueKey = `${content.type}-${index}`;

      if (content.type === "news") {
        return <NewsCard key={uniqueKey} {...content} />;
      } else if (content.type === "article") {
        return <ArticleCard key={uniqueKey} {...content} />;
      } else if (content.type === "podcast") {
        return <PodcastCard key={uniqueKey} podcast={content} />;
      } else {
        return assertUnreachable(content);
      }
    };

    const createGrid = (content: any[], categoryName: CategoryValue) => {
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
    return categories.map(({ label, value, icon, color }) => {
      const isActive = value === category;

      return (
        <button
          key={value}
          onClick={() => handleCategoryChange(value)}
          disabled={false}
          className={`relative pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap  group flex items-center gap-2 ${
            isActive
              ? `border-main-accent ${color}`
              : `border-transparent text-muted-foreground hover:${color} hover:border-muted-foreground`
          }`}
        >
          {icon}
          {label}
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

  const getRestOfLinks = (type: Exclude<CategoryValue, "all" | "education">) => {
    const linkClassName =
      "flex items-center text-foreground hover:text-main-accent transition-colors";

    if (type === "news") {
      return (
        <a href={links.news} className={linkClassName}>
          <span className="text-sm font-medium">Tüm haberler →</span>
        </a>
      );
    } else if (type === "articles") {
      return (
        <a href={links.articles} className={linkClassName}>
          Tüm köşe yazılar →
        </a>
      );
    } else if (type === "podcast") {
      return (
        <a href={links.podcasts} className={linkClassName}>
          Tüm podcastler →
        </a>
      );
    } else {
      return assertUnreachable(type);
    }
  };

  return (
    <MainContent>
      {/* Featured Content */}
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

        <div className="ml-4 text-center">
          {category !== "all" && category !== "education" && getRestOfLinks(category)}
        </div>
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
