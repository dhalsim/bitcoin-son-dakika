import { useMemo } from "react";

import { links } from "@/lib/utils";

import { createTitleSlug } from "../../api-helpers/utils";

import { useLatestNews } from "../contexts/SSGContext";

export default function BreakingNews() {
  const latestNews = useLatestNews(6);

  const topItem = useMemo(() => latestNews[0], [latestNews]);

  if (!topItem) {
    return null;
  }

  const hasLink = topItem.title && topItem.summary;

  const link = hasLink ? links.newsDetail(createTitleSlug(topItem.title)) : null;

  return (
    <div className="bg-main-accent text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <span className="bg-white text-main-accent px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold mr-2 sm:mr-4 whitespace-nowrap">
            SON DAKİKA
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-pulse">
              <span className="text-xs sm:text-sm font-medium">
                <a href={link}>
                  {`${topItem.title || "Bitcoin Haberleri"} - ${(
                    topItem.summary || "Güncel Bitcoin haberleri ve analizler"
                  ).substring(0, 100)}...`}
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
