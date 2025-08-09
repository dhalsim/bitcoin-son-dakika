import type { MetaFunction } from "react-router";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import Sidebar from "../components/Sidebar";
import { useLatestNews, useLatestArticles, useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION, WEBSITE_URL, LOGO_URL } from "../lib/constants";

export const meta: MetaFunction = () => {
  const title = `${WEBSITE_NAME} - Güncel Bitcoin Haberleri ve Analizler`;
  const description = WEBSITE_DESCRIPTION;
  const siteUrl = `${WEBSITE_URL}`;
  const imageUrl = `${WEBSITE_URL}${LOGO_URL}`;

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content: "bitcoin, kripto para, lightning network, madencilik, bitcoin haberleri",
    },
    // Open Graph
    { property: "og:site_name", content: WEBSITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:url", content: siteUrl },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
};

export default function Index() {
  const ssgData = useSSGData();
  const latestNews = useLatestNews(6); // Get latest 6 news items
  const latestArticles = useLatestArticles(2); // Get latest 2 articles for the articles row

  // If no content is available, show empty state
  if (latestNews.length === 0 && latestArticles.length === 0) {
    return (
      <MainContent>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Haberler Yükleniyor...</h1>
            <p className="text-muted-foreground">
              Güncel Bitcoin haberleri ve analizler yakında burada olacak.
            </p>
          </div>
        </div>
      </MainContent>
    );
  }

  // Get featured content (latest news item) and main content
  const featuredContent = latestNews[0];
  const mainNews = latestNews.slice(1, 5); // Next 4 news items
  const sideNews = latestNews.slice(5, 7); // Next 2 news items

  return (
    <MainContent>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured News */}
            {featuredContent && (
              <div className="mb-6 sm:mb-8">
                <NewsCard {...featuredContent} featured={true} />
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b border-border overflow-x-auto">
              {["Tümü", "Haberler", "Köşe Yazıları", "Eğitim", "Podcast"].map((tab) => (
                <button
                  key={tab}
                  className={`pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === "Tümü"
                      ? "border-main-accent text-main-accent"
                      : "border-transparent text-muted-foreground hover:text-main-accent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Main News Grid */}
            {mainNews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {mainNews.map((news, index) => (
                  <NewsCard key={index} {...news} />
                ))}
              </div>
            )}

            {/* Articles Row - Only show if we have articles */}
            {latestArticles.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-foreground border-l-4 border-main-accent pl-4 mb-4 sm:mb-6">
                  Köşe Yazıları
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {latestArticles.map((article, index) => (
                    <NewsCard key={index} {...article} />
                  ))}
                  {/* If we only have 1 article, keep the second column empty */}
                  {latestArticles.length === 1 && (
                    <div className="hidden lg:block">
                      {/* Empty space to maintain grid layout */}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional News */}
            {sideNews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground border-l-4 border-main-accent pl-4">
                  Diğer Haberler
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {sideNews.map((news, index) => (
                    <NewsCard key={index} {...news} />
                  ))}
                </div>
              </div>
            )}

            {/* Debug Info - Only show in development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-bold mb-2">SSG Data Debug:</h3>
                <p>News items: {ssgData.news.length}</p>
                <p>Articles: {ssgData.articles.length}</p>
                <p>Last updated: {new Date(ssgData.lastUpdated).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <Sidebar news={ssgData.news} articles={ssgData.articles} />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
