import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
  ];
};

// Helper function to convert NewsItem/ArticleItem to NewsCard props

export default function LatestPage() {
  const ssgData = useSSGData();

  // Combine news and articles, sort by publish date
  const allItems = [...ssgData.news, ...ssgData.articles].sort(
    (a, b) => b.publishedAt - a.publishedAt,
  );

  // If no content is available, show empty state
  if (allItems.length === 0) {
    return (
      <MainContent>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              İçerikler Yükleniyor...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Güncel Bitcoin haberleri ve makaleleri yakında burada olacak.
            </p>
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            En Son İçerikler
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitcoin dünyasından en güncel haberler ve makaleler
          </p>
        </div>

        {/* Combined Content List - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          {allItems.map((item, index) => (
            <NewsCard key={index} {...item} />
          ))}
        </div>
      </div>
    </MainContent>
  );
}
