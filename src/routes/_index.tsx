import React from "react";
import type { MetaFunction } from "react-router";

import Footer from "../components/Footer";
import Header from "../components/Header";
import NewsCard from "../components/NewsCard";
import PriceBar from "../components/PriceBar";
import Sidebar from "../components/Sidebar";
import {
  useLatestNews,
  useLatestArticles,
  useSSGData,
} from "../hooks/useSSGData";
import { type NewsItem, type ArticleItem } from "../lib/ssg-data";

export const meta: MetaFunction = () => {
  return [
    { title: "Bitcoin Son Dakika - Güncel Bitcoin Haberleri ve Analizler" },
    {
      name: "description",
      content:
        "Bitcoin dünyasından son dakika haberleri, güncel gelişmeler, analizler ve uzman yorumları. Lightning Network, madencilik ve kripto para düzenlemeleri.",
    },
    {
      name: "keywords",
      content:
        "bitcoin, kripto para, lightning network, madencilik, bitcoin haberleri",
    },
  ];
};

// Helper function to convert NewsItem/ArticleItem to NewsCard props
function convertToNewsCardProps(item: NewsItem | ArticleItem) {
  const timeAgo = getTimeAgo(item.publishedAt);

  return {
    title: item.title,
    summary: item.summary || item.content.substring(0, 150) + "...",
    category: item.category || "Bitcoin",
    time: timeAgo,
    image: item.image,
  };
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffSeconds = Math.floor(now - timestamp);

  if (diffSeconds < 60) {
    return `${diffSeconds} saniye önce`;
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);

    return `${minutes} dakika önce`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);

    return `${hours} saat önce`;
  } else {
    const days = Math.floor(diffSeconds / 86400);

    return `${days} gün önce`;
  }
}

// Fallback data for when SSG data is not available
const fallbackFeaturedNews = {
  title: "Bitcoin Halving Sonrası Piyasada Büyük Hareketlilik",
  summary:
    "Bitcoin'in son halving olayının ardından piyasalarda önemli değişimler yaşanıyor. Uzmanlar, önümüzdeki dönemde fiyat hareketlerinin artacağını öngörüyor.",
  category: "Bitcoin",
  time: "30 dakika önce",
  image:
    "https://images.unsplash.com/photo-1518544866273-fc95ba4d8b2b?w=800&h=600&fit=crop",
};

const fallbackMainNews = [
  {
    title: "Lightning Network'te Yeni Rekor: Kapasite 5.000 BTC'yi Aştı",
    summary:
      "Bitcoin'in ikinci katman çözümü Lightning Network'te kilitli Bitcoin miktarı yeni bir rekora ulaştı.",
    category: "Lightning",
    time: "1 saat önce",
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
  },
  {
    title: "Türkiye'de Bitcoin Düzenlemeleri Netleşiyor",
    summary:
      "BDDK'nın yeni açıklaması ile Bitcoin borsalarına yönelik kurallar belirlendi.",
    category: "Düzenleme",
    time: "2 saat önce",
    image:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
  },
];

const fallbackSideNews = [
  {
    title: "El Salvador Bitcoin Rezervlerini Artırıyor",
    summary:
      "Latin Amerika ülkesi, Bitcoin'i yasal para birimi ilan ettikten sonra rezervlerini genişletmeye devam ediyor.",
    category: "Ülke",
    time: "5 saat önce",
  },
];

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

  // Use fallback data if no SSG data is available
  const featuredNews = featuredContent
    ? convertToNewsCardProps(featuredContent)
    : fallbackFeaturedNews;

  const mainNews =
    mainContent.length > 0
      ? mainContent.map(convertToNewsCardProps)
      : fallbackMainNews;

  const sideNews =
    sideContent.length > 0
      ? sideContent.map(convertToNewsCardProps)
      : fallbackSideNews;

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
                  {featuredContent
                    ? `${featuredContent.title} - ${featuredContent.summary?.substring(0, 100)}...`
                    : "Bitcoin 70.000 doları aştı! Piyasalarda büyük hareketlilik devam ediyor..."}
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
            <Sidebar />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
