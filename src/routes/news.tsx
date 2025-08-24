import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `Tüm Haberler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin haberleri, kripto para haberleri, bitcoin son dakika, bitcoin güncel, nostr haberleri, bitcoin analiz, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `Tüm Haberler - ${WEBSITE_NAME}` },
    { property: "og:description", content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `Tüm Haberler - ${WEBSITE_NAME}` },
    { name: "twitter:description", content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri` },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

// Helper function to convert NewsItem to NewsCard props

export default function NewsPage() {
  const ssgData = useSSGData();

  // Get only news items and sort by publish date
  const newsItems = ssgData.news.sort((a, b) => b.publishedAt - a.publishedAt);

  // If no content is available, show empty state
  if (newsItems.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Haberler Yükleniyor...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Güncel Bitcoin haberleri yakında burada olacak.
          </p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      {/* News List - Single Column */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tüm Haberler
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Bitcoin dünyasından en güncel haberler</p>
        </div>

        {newsItems.map((news, index) => (
          <NewsCard key={index} {...news} />
        ))}
      </div>
    </MainContent>
  );
}
