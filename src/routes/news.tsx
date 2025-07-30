import type { MetaFunction } from "react-router";

import Footer from "../components/Footer";
import Header from "../components/Header";
import NewsCard, { convertToNewsCardProps } from "../components/NewsCard";
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
        {/* News List - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Tüm Haberler
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bitcoin dünyasından en güncel haberler
            </p>
          </div>

          {newsItems.map((news, index) => (
            <NewsCard key={index} {...news} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
