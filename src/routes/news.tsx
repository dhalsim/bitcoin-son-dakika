import type { MetaFunction } from "react-router";

import Footer from "../components/Footer";
import Header from "../components/Header";
import NewsCard from "../components/NewsCard";
import PriceBar from "../components/PriceBar";
import { useSSGData } from "../hooks/useSSGData";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `Tüm Haberler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri`,
    },
  ];
};

// Helper function to convert NewsItem to NewsCard props
function convertToNewsCardProps(item: any) {
  const timeAgo = getTimeAgo(item.publishedAt);
  const title = `Haber - ${item.title}`;

  return {
    title,
    summary: item.summary || item.content.substring(0, 150) + "...",
    category: item.category || "Bitcoin",
    time: timeAgo,
    image: item.image,
    author: item.author,
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

export default function NewsPage() {
  const ssgData = useSSGData();

  // Get only news items and sort by publish date
  const newsItems = ssgData.news
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(convertToNewsCardProps);

  // If no content is available, show empty state
  if (newsItems.length === 0) {
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
              Güncel Bitcoin haberleri yakında burada olacak.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header />
      <PriceBar />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tüm Haberler
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitcoin dünyasından en güncel haberler
          </p>
        </div>

        {/* News List - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          {newsItems.map((news, index) => (
            <NewsCard key={index} {...news} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
