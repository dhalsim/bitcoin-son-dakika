import type { ReactNode } from "react";

import BreakingNews from "./BreakingNews";
import Footer from "./Footer";
import Header from "./Header";
import PriceBar from "./PriceBar";
import Sidebar from "./Sidebar";
import { useSSGData } from "../contexts/SSGContext";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const ssgData = useSSGData();

  return (
    <div className="min-h-screen">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      <BreakingNews />

      {/* Main Content with Sidebar Layout */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">{children}</div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <Sidebar news={ssgData.news} articles={ssgData.articles} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
