import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import BreakingNews from "./BreakingNews";
import EmailSubscription from "./EmailSubscription";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // Scroll to top of content when route changes
  useEffect(() => {
    if (contentRef.current) {
      const contentTop = contentRef.current.offsetTop;

      window.scrollTo({
        top: contentTop,
        behavior: "instant",
      });
    }
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      <BreakingNews />

      {/* Main Content with Sidebar Layout */}
      <div ref={contentRef} className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">{children}</div>

          {/* Sidebar */}
          <div className="lg:w-80 mt-6 lg:mt-0 max-lg:bg-blue-50 max-lg:dark:bg-blue-900/20 max-lg:p-4 max-lg:rounded-lg">
            <Sidebar news={news} articles={articles} podcasts={podcasts} />
          </div>
        </div>
      </div>

      <EmailSubscription />
      <Footer />
    </div>
  );
}
