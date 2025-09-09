import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import ArticleCard from "../components/ArticleCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `Tüm Makaleler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin makaleleri ve analizler`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin makaleleri, bitcoin analiz, bitcoin köşe yazıları, kripto para analiz, bitcoin eğitim, bitcoin teknoloji, bitcoin ekonomi, bitcoin regülasyon, bitcoin güvenlik, podcast",
    },
    // Open Graph
    { property: "og:title", content: `Tüm Makaleler - ${WEBSITE_NAME}` },
    {
      property: "og:description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin makaleleri ve analizler`,
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `Tüm Makaleler - ${WEBSITE_NAME}` },
    {
      name: "twitter:description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin makaleleri ve analizler`,
    },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

export default function ArticlesPage() {
  const ssgData = useSSGData();

  // Get only article items and sort by publish date
  const articleItems = ssgData.articles.sort((a, b) => b.publishedAt - a.publishedAt);

  // If no content is available, show empty state
  if (articleItems.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Makaleler Yükleniyor...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitcoin analizleri ve makaleleri yakında burada olacak.
          </p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tüm Makaleler</h1>
        <p className="text-muted-foreground">
          Bitcoin dünyasından en güncel analizler ve makaleler
        </p>
      </div>

      {/* Articles List - Single Column */}
      <div className="max-w-4xl mx-auto space-y-6">
        {articleItems.map((article, index) => (
          <ArticleCard key={index} {...article} />
        ))}
      </div>
    </MainContent>
  );
}
