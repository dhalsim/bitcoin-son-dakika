import type { ReactNode } from "react";

import BreakingNews from "./BreakingNews";
import Footer from "./Footer";
import Header from "./Header";
import PriceBar from "./PriceBar";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <PriceBar />

      {/* Breaking News Banner */}
      <BreakingNews />

      {children}
      <Footer />
    </div>
  );
}
