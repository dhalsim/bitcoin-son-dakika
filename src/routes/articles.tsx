import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `Tüm Makaleler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin makaleleri ve analizler`,
    },
  ];
};

export default function ArticlesPage() {
  const ssgData = useSSGData();

  // Get only article items and sort by publish date
  const articleItems = ssgData.articles.sort(
    (a, b) => b.publishedAt - a.publishedAt,
  );

  // If no content is available, show empty state
  if (articleItems.length === 0) {
    return (
      <MainContent>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Makaleler Yükleniyor...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bitcoin analizleri ve makaleleri yakında burada olacak.
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
            Tüm Makaleler
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitcoin dünyasından en güncel analizler ve makaleler
          </p>
        </div>

        {/* Articles List - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          {articleItems.map((article, index) => (
            <NewsCard key={index} {...article} />
          ))}
        </div>
      </div>
    </MainContent>
  );
}
