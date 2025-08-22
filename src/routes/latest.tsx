import type { MetaFunction } from "react-router";

import PodcastCard from "@/components/PodcastCard";

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
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin son dakika, bitcoin güncel, bitcoin haberleri, bitcoin makaleleri, bitcoin analiz, kripto para güncel, nostr güncel, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      property: "og:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
    { property: "og:type", content: "website" },
    // Twitter
    { name: "twitter:title", content: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      name: "twitter:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
  ];
};

// Helper function to convert NewsItem/ArticleItem to NewsCard props

export default function LatestPage() {
  const ssgData = useSSGData();

  // Combine news and articles, sort by publish date
  const allItems = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts].sort(
    (a, b) => b.publishedAt - a.publishedAt,
  );

  // If no content is available, show empty state
  if (allItems.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            İçerikler Yükleniyor...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Güncel Bitcoin haberleri ve makaleleri yakında burada olacak.
          </p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
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
        {allItems.map((item, index) =>
          item.type === "news" || item.type === "article" ? (
            <NewsCard key={index} {...item} />
          ) : (
            <PodcastCard key={index} podcast={item} />
          ),
        )}
      </div>
    </MainContent>
  );
}
