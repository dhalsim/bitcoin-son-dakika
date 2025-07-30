import type { MetaFunction } from "react-router";

import Footer from "../components/Footer";
import Header from "../components/Header";
import NewsCard, { convertToNewsCardProps } from "../components/NewsCard";
import PriceBar from "../components/PriceBar";
import Sidebar from "../components/Sidebar";
import {
  useLatestNews,
  useLatestArticles,
  useSSGData,
} from "../hooks/useSSGData";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `${WEBSITE_NAME} - Güncel Bitcoin Haberleri ve Analizler` },
    {
      name: "description",
      content: WEBSITE_DESCRIPTION,
    },
    {
      name: "keywords",
      content:
        "bitcoin, kripto para, lightning network, madencilik, bitcoin haberleri",
    },
  ];
};

export default function Index() {
  const ssgData = useSSGData();
  const latestNews = useLatestNews(6); // Get latest 6 news items
  const latestArticles = useLatestArticles(4); // Get latest 4 articles

  // Combine and sort news and articles by publish date
  const allContent = [...latestNews, ...latestArticles].sort(
    (a, b) => b.publishedAt - a.publishedAt,
  );

  // Get featured content (latest item) and main content
  const featuredContent = allContent[0];
  const mainContent = allContent.slice(1, 5); // Next 4 items
  const sideContent = allContent.slice(5, 7); // Next 2 items

  // If no content is available, show empty state
  if (allContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Header />
        <PriceBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Haberler Yükleniyor...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Güncel Bitcoin haberleri ve analizler yakında burada olacak.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Convert content to NewsCard props
  const featuredNews = convertToNewsCardProps(featuredContent!);
  const mainNews = mainContent.map(convertToNewsCardProps);
  const sideNews = sideContent.map(convertToNewsCardProps);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      <div className="bg-main-accent text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <span className="bg-white text-main-accent px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold mr-2 sm:mr-4 whitespace-nowrap">
              SON DAKİKA
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-pulse">
                <span className="text-xs sm:text-sm font-medium">
                  {`${featuredContent.title} - ${featuredContent.summary?.substring(0, 100)}...`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured News */}
            <div className="mb-6 sm:mb-8">
              <NewsCard {...featuredNews} featured={true} />
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
              {["Tümü", "Haberler", "Köşe Yazıları", "Eğitim", "Podcast"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={`pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      tab === "Tümü"
                        ? "border-main-accent text-main-accent"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-main-accent"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* Main News Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {mainNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>

            {/* Additional News */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 border-l-4 border-main-accent pl-4">
                Diğer Haberler
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {sideNews.map((news, index) => (
                  <NewsCard key={index} {...news} />
                ))}
              </div>
            </div>

            {/* Debug Info - Only show in development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">SSG Data Debug:</h3>
                <p>News items: {ssgData.news.length}</p>
                <p>Articles: {ssgData.articles.length}</p>
                <p>
                  Last updated: {new Date(ssgData.lastUpdated).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <Sidebar news={ssgData.news} articles={ssgData.articles} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
