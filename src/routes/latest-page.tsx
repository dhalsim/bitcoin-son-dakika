import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import PodcastCard from "@/components/PodcastCard";
import { ContentItem } from "@/lib/ssg-data";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import ArticleCard from "../components/ArticleCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { currentPage, totalPages } = data || { currentPage: 1, totalPages: 1 };

  return [
    { title: `En Son İçerikler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri sayfa ${currentPage}`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin son dakika, bitcoin güncel, bitcoin haberleri, bitcoin makaleleri, bitcoin analiz, kripto para güncel, nostr güncel, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `En Son İçerikler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      property: "og:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri sayfa ${currentPage}`,
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `En Son İçerikler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      name: "twitter:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri sayfa ${currentPage}`,
    },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const page = parseInt(params.page || "1");
  const ITEMS_PER_PAGE = 10;

  // Get SSG data from global (set during prerender)
  const ssgData = global.__SSG_DATA__;

  if (!ssgData) {
    throw new Error("SSG data not available");
  }

  // Combine news, articles, and podcasts, sort chronologically (oldest first for stable pagination)
  const allItems: ContentItem[] = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts].sort(
    (a, b) => a.publishedAt - b.publishedAt,
  );

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

  // Validate page number
  if (page < 1 || page > totalPages) {
    throw new Response("Page not found", { status: 404 });
  }

  // Get items for current page
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItemsSlice = allItems.slice(startIndex, endIndex);

  // Reverse the order within the page to show latest first
  const pageItems = pageItemsSlice.reverse();

  return {
    currentPage: page,
    totalPages,
    pageItems,
    totalItems: allItems.length,
  };
}

export default function LatestPage() {
  // Get data from loader
  const loaderData = useLoaderData<typeof loader>();
  const { currentPage, totalPages, pageItems, totalItems } = loaderData;

  // Calculate user-friendly page numbers (1 = latest, N = oldest)
  const userPageNumber = totalPages - currentPage + 1;

  // If no content is available, show empty state
  if (pageItems.length === 0) {
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          En Son İçerikler
          {totalPages > 1 && (
            <span className="text-lg font-normal text-muted-foreground ml-2">
              - Sayfa {userPageNumber} / {totalPages}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">
          Bitcoin dünyasından en güncel haberler ve makaleler ({totalItems} toplam içerik)
        </p>
      </div>

      {/* Combined Content List - Single Column */}
      <div className="max-w-4xl mx-auto space-y-6">
        {pageItems.map((item, index) => {
          if (item.type === "news") {
            return <NewsCard key={item.id} {...item} />;
          } else if (item.type === "article") {
            return <ArticleCard key={item.id} {...item} />;
          } else {
            return <PodcastCard key={item.id} podcast={item} />;
          }
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationNext href={`/son-dakika/${currentPage - 1}`}>Sonraki</PaginationNext>
                  </PaginationItem>
                )}

                {/* Page numbers - show user-friendly numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let userPageNum;
                  if (totalPages <= 5) {
                    userPageNum = i + 1;
                  } else if (userPageNumber <= 3) {
                    userPageNum = i + 1;
                  } else if (userPageNumber >= totalPages - 2) {
                    userPageNum = totalPages - 4 + i;
                  } else {
                    userPageNum = userPageNumber - 2 + i;
                  }

                  // Convert user page number back to actual page number
                  const actualPageNum = totalPages - userPageNum + 1;

                  return (
                    <PaginationItem key={userPageNum}>
                      <PaginationLink
                        href={`/son-dakika/${actualPageNum}`}
                        isActive={userPageNum === userPageNumber}
                      >
                        {userPageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationPrevious href={`/son-dakika/${currentPage + 1}`}>
                      Önceki
                    </PaginationPrevious>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </MainContent>
  );
}
