import type { ReactNode } from "react";

import Footer from "./Footer";
import Header from "./Header";
import PriceBar from "./PriceBar";

interface MainContentProps {
  children: ReactNode;
  breakingNews?: {
    title: string;
    summary?: string;
  };
}

export default function MainContent({
  children,
  breakingNews,
}: MainContentProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      {breakingNews && (
        <div className="bg-main-accent text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <span className="bg-white text-main-accent px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold mr-2 sm:mr-4 whitespace-nowrap">
                SON DAKİKA
              </span>
              <div className="flex-1 overflow-hidden">
                <div className="animate-pulse">
                  <span className="text-xs sm:text-sm font-medium">
                    {`${breakingNews.title} - ${breakingNews.summary?.substring(0, 100)}...`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
      <Footer />
    </div>
  );
}
