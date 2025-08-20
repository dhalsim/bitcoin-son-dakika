import type { ReactNode } from "react";

import BreakingNews from "./BreakingNews";
import Footer from "./Footer";
import Header from "./Header";
import PriceBar from "./PriceBar";
import Sidebar from "./Sidebar";
import { useLatestArticles, useLatestNews, useLatestPodcasts } from "../contexts/SSGContext";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const news = useLatestNews(5);
  const articles = useLatestArticles(2);
  const podcasts = useLatestPodcasts(2);

  return (
    <div className="min-h-screen">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      <BreakingNews />

      {/* Main Content with Sidebar Layout */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">{children}</div>

          {/* Sidebar */}
          <div className="lg:w-80 mt-6 lg:mt-0">
            <Sidebar news={news} articles={articles} podcasts={podcasts} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
