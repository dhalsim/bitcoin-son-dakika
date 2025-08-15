import type { MetaFunction } from "react-router";
import { useParams } from "react-router";

import type { ArticleItem, NewsItem } from "@/lib/ssg-data";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import { useSSGData } from "../contexts/SSGContext";
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

export default function TagsPage() {
  const { slug, type } = useParams();
  const ssgData = useSSGData();

  // If type is not provided, show all items
  const selectedItems: (NewsItem | ArticleItem)[] =
    type == null
      ? [...ssgData.news, ...ssgData.articles]
      : type === "news"
        ? ssgData.news
        : ssgData.articles;

  // Filter items by the specified tag
  const filteredItems = selectedItems
    .filter((item) => item.tags && item.tags.includes(slug))
    .sort((a, b) => b.publishedAt - a.publishedAt);

  // If no content is available, show empty state
  if (filteredItems.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            "#{slug}" Etiketi İçin İçerik Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu etiketle ilgili haber veya makale bulunmuyor.
          </p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          "#{slug}" Etiketi
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
    </MainContent>
  );
}
