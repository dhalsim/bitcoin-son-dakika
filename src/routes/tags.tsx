import type { MetaFunction } from "react-router";
import { useParams } from "react-router";

import Footer from "../components/Footer";
import Header from "../components/Header";
import NewsCard, { convertToNewsCardProps } from "../components/NewsCard";
import PriceBar from "../components/PriceBar";
import { useSSGData } from "../hooks/useSSGData";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export const meta: MetaFunction = () => {
  return [
    { title: `Etiket - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Etiket bazlı Bitcoin içerikleri`,
    },
  ];
};

// Helper function to convert NewsItem/ArticleItem to NewsCard props

export default function TagsPage() {
  const { tagStr, type } = useParams();
  const ssgData = useSSGData();

  // If type is not provided, show all items
  const selectedItems =
    type == null
      ? [...ssgData.news, ...ssgData.articles]
      : type === "news"
        ? ssgData.news
        : ssgData.articles;

  // Filter items by the specified tag
  const filteredItems = selectedItems
    .filter((item) => item.tags && item.tags.includes(tagStr))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(convertToNewsCardProps);

  // If no content is available, show empty state
  if (filteredItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Header />
        <PriceBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              "#{tagStr}" Etiketi İçin İçerik Bulunamadı
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bu etiketle ilgili haber veya makale bulunmuyor.
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
            "#{tagStr}" Etiketi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu etiketle ilgili tüm haberler ve makaleler
          </p>
        </div>

        {/* Filtered Content List - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredItems.map((item, index) => (
            <NewsCard key={index} {...item} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
