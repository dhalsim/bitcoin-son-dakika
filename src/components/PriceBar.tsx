import React, { useRef, useState, useCallback, useEffect } from "react";

import { usePriceData } from "../hooks/usePriceData";

import Chart from "./Chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const PriceBar = () => {
  const { prices, btcPrice, btcChange, loading, error } = usePriceData(300000); // 5 minutes refresh for BTC
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Create enough duplicates for seamless infinite scroll
  const infinitePrices = [...prices, ...prices, ...prices];

  const handlePriceClick = useCallback(
    (symbol: string, _e: React.MouseEvent) => {
      // Prevent the click if we're dragging
      if (isDragging) {
        return;
      }

      setSelectedSymbol(symbol);
      setIsDialogOpen(true);
    },
    [isDragging],
  );

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedSymbol(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) {
      return;
    }

    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) {
        return;
      }

      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleMouseUp = useCallback(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    setIsDragging(false);
    scrollContainerRef.current.style.cursor = "grab";
    scrollContainerRef.current.style.userSelect = "auto";
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainerRef.current) {
      return;
    }

    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !scrollContainerRef.current) {
        return;
      }

      const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Clean up event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  return (
    <div className="bg-main-accent text-white py-2 border-b border-orange-300 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center">
                <span className="mr-2">Anlık Fiyatlar</span>
                <span className="text-white satoshi-symbol text-lg"></span>
              </h3>
              <p className="text-xs text-white/80 italic font-medium">
                her şey bitcoin karşısında sıfıra gidiyor
                {btcPrice && (
                  <span className="ml-2">
                    ₿ {btcPrice}
                    {btcChange && (
                      <span
                        className={`ml-1 ${
                          parseFloat(btcChange) >= 0
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {parseFloat(btcChange) >= 0 ? "+" : ""}
                        {parseFloat(btcChange).toFixed(2)}%
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-black/20 dark:bg-black/30 rounded backdrop-blur-sm">
            {loading && (
              <div className="flex items-center justify-center py-4 text-white/80">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="ml-2 text-sm">Fiyatlar yükleniyor...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center py-4 text-red-300">
                <span className="text-sm">Fiyat verisi yüklenemedi</span>
              </div>
            )}
            {!loading && !error && (
              <div
                ref={scrollContainerRef}
                className="flex items-center space-x-3 sm:space-x-4 price-slider py-1.5 sm:py-2 px-3 sm:px-4 overflow-x-auto scrollbar-hide cursor-grab select-none"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {infinitePrices.map((price, index) => (
                  <div
                    key={index}
                    data-price-item
                    className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap min-w-fit flex-shrink-0 cursor-pointer hover:bg-white/10 rounded-lg px-2 py-1 transition-colors duration-200"
                    onClick={(e) => handlePriceClick(price.symbol, e)}
                  >
                    <span className="text-white/90 font-medium">
                      {price.name}:
                    </span>
                    <span className="font-bold text-white">{price.value}</span>
                    <span className="text-white satoshi-symbol"></span>
                    <span
                      className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
                        parseFloat(price.change) >= 0
                          ? "text-green-100 bg-green-600/80"
                          : "text-red-100 bg-red-600/80"
                      }`}
                    >
                      {parseFloat(price.change) >= 0 ? "+" : ""}
                      {parseFloat(price.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-screen-xl h-[90vh] p-0 bg-background flex flex-col">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-foreground">
              {selectedSymbol ? `${selectedSymbol} Grafiği` : "Fiyat Grafiği"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6 pt-0 min-h-0">
            {selectedSymbol && (
              <Chart key={selectedSymbol} symbol={selectedSymbol} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceBar;
