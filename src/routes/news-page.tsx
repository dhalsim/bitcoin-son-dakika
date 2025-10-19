import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
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
    { title: `Haberler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Bitcoin haberleri sayfa ${currentPage}`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin haberleri, kripto para haberleri, bitcoin son dakika, bitcoin güncel, nostr haberleri, bitcoin analiz, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `Haberler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      property: "og:description",
      content: `${WEBSITE_DESCRIPTION} - Bitcoin haberleri sayfa ${currentPage}`,
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `Haberler - Sayfa ${currentPage} - ${WEBSITE_NAME}` },
    {
      name: "twitter:description",
      content: `${WEBSITE_DESCRIPTION} - Bitcoin haberleri sayfa ${currentPage}`,
    },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const page = parseInt(params.page || "1");
  const NEWS_PER_PAGE = 10;

  // Get SSG data from global (set during prerender)
  const ssgData = global.__SSG_DATA__;

  if (!ssgData) {
    throw new Error("SSG data not available");
  }

  // Sort news chronologically (oldest first for stable pagination)
  const sortedNews = ssgData.news.sort((a, b) => a.publishedAt - b.publishedAt);
  const totalPages = Math.ceil(sortedNews.length / NEWS_PER_PAGE);

  // Validate page number
  if (page < 1 || page > totalPages) {
    throw new Response("Page not found", { status: 404 });
  }

  // Get news for current page
  const startIndex = (page - 1) * NEWS_PER_PAGE;
  const endIndex = startIndex + NEWS_PER_PAGE;
  const pageNews = sortedNews.slice(startIndex, endIndex);

  // Reverse the order within the page to show latest first
  const newsItems = pageNews.reverse();

  return {
    currentPage: page,
    totalPages,
    newsItems,
    totalNews: sortedNews.length,
  };
}

export default function NewsPage() {
  // Get data from loader
  const loaderData = useLoaderData<typeof loader>();
  const { currentPage, totalPages, newsItems, totalNews } = loaderData;

  // Calculate user-friendly page numbers (1 = latest, N = oldest)
  const userPageNumber = totalPages - currentPage + 1;

  // If no content is available, show empty state
  if (newsItems.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Haberler Yükleniyor...</h1>
          <p className="text-muted-foreground">Güncel Bitcoin haberleri yakında burada olacak.</p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Tüm Haberler
            {totalPages > 1 && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                - Sayfa {userPageNumber} / {totalPages}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Bitcoin dünyasından haberler ({totalNews} toplam haber)
          </p>
        </div>

        {newsItems.map((news, index) => (
          <NewsCard key={news.id} {...news} />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationNext href={`/haberler/${currentPage - 1}`}>Sonraki</PaginationNext>
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
                        href={`/haberler/${actualPageNum}`}
                        isActive={userPageNum === userPageNumber}
                      >
                        {userPageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationPrevious href={`/haberler/${currentPage + 1}`}>
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
