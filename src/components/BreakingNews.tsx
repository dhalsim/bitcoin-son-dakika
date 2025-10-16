import { useMemo } from "react";

import { createTitleSlug } from "api-helpers/common_with_client";

import { useLatestNews } from "../contexts/SSGContext";

export default function BreakingNews() {
  const latestNews = useLatestNews(6);

  const topItem = useMemo(() => latestNews[0], [latestNews]);

  if (!topItem || !topItem.title) {
    return null;
  }

  const link = createTitleSlug(topItem.title);

  return (
    <div className="bg-main-accent text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center animate-pulse text-gray-700">
          <span className="bg-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold mr-2 sm:mr-4 whitespace-nowrap">
            SON DAKİKA
          </span>
          <div className="flex-1 overflow-hidden">
            <span className="text-xs sm:text-sm font-medium">
              <a href={link}>${topItem.title}</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
