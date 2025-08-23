import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { X, BarChart3 } from "lucide-react";

import { usePriceData } from "../hooks/usePriceData";
import { getCache } from "../lib/cache";

import Chart from "./Chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const PriceBar = () => {
  const { prices, btcPrice, btcChange, loading, error } = usePriceData();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hiddenPrices, setHiddenPrices] = useState<Set<string>>(new Set());
  const autoscrollIntervalRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);

  // Initialize visibility and hidden prices from cache
  useEffect(() => {
    const cache = getCache();

    setIsVisible(cache.getPriceBarVisibility());

    const cachedHiddenPrices = cache.getPriceFilter();
    if (cachedHiddenPrices) {
      setHiddenPrices(new Set(cachedHiddenPrices));
    }
  }, []);

  // Handle close button click
  const handleClose = useCallback(() => {
    const cache = getCache();

    cache.setPriceBarVisibility(false);

    setIsVisible(false);
  }, []);

  // Handle show button click
  const handleShow = useCallback(() => {
    const cache = getCache();

    cache.setPriceBarVisibility(true);

    setIsVisible(true);
  }, []);

  // Handle hiding a price
  const handleHidePrice = useCallback(
    (priceSymbol: string) => {
      const newHiddenPrices = new Set(hiddenPrices);
      newHiddenPrices.add(priceSymbol);

      setHiddenPrices(newHiddenPrices);

      // Update cache
      const cache = getCache();

      cache.setPriceFilter(Array.from(newHiddenPrices));
    },
    [hiddenPrices],
  );

  // Filter out hidden prices
  const filteredPrices = useMemo(() => {
    return prices.filter((price) => !hiddenPrices.has(price.priceSymbol));
  }, [prices, hiddenPrices]);

  // Create a simple duplicated array for continuous scrolling (using filtered prices)
  const displayPrices = [...filteredPrices, ...filteredPrices, ...filteredPrices];

  const oneUsdInSatoshi = useMemo(() => {
    if (prices.length === 0) {
      return;
    }

    return prices.find((p) => p.symbol === "USD")?.value;
  }, [prices]);

  const oneTryInSatoshi = useMemo(() => {
    if (prices.length === 0) {
      return;
    }

    return prices.find((p) => p.symbol === "TRY")?.value;
  }, [prices]);

  const handlePriceClick = useCallback(
    (symbol: string) => {
      if (!isDragging) {
        setSelectedSymbol(symbol);
        setIsDialogOpen(true);
      }
    },
    [isDragging],
  );

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedSymbol(null);
  }, []);

  // Simple mouse drag handlers
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
      const walk = (x - startX) * 1.5; // Moderate scroll speed
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

  // Touch handlers
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
      const walk = (x - startX) * 1.5;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  // Autoscroll functionality
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || filteredPrices.length === 0) {
      return;
    }

    // Ensure we start centered on the middle copy to allow seamless wrapping
    const singleSetWidth = container.scrollWidth / 3;
    if (container.scrollLeft < singleSetWidth || container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft = singleSetWidth;
    }

    const startAutoscroll = () => {
      if (isUserInteractingRef.current) {
        return;
      }

      if (autoscrollIntervalRef.current !== null) {
        return;
      } // already running

      const id = window.setInterval(() => {
        if (!scrollContainerRef.current || isUserInteractingRef.current) {
          return;
        }

        const el = scrollContainerRef.current;
        const widthPerSet = el.scrollWidth / 3;

        let next = el.scrollLeft + 1; // slow, smooth move to the right
        // Wrap within the triple content to create the infinite effect
        if (next >= widthPerSet * 2) {
          next = next - widthPerSet; // jump back by one set to stay in middle band
        }

        if (next < 0) {
          next = next + widthPerSet; // guard for unexpected negatives
        }

        el.scrollLeft = next;
      }, 50);

      autoscrollIntervalRef.current = id;
    };

    const stopAutoscroll = () => {
      if (autoscrollIntervalRef.current !== null) {
        window.clearInterval(autoscrollIntervalRef.current);
        autoscrollIntervalRef.current = null;
      }
    };

    const scheduleAutoscrollResume = () => {
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }

      resumeTimeoutRef.current = window.setTimeout(() => {
        isUserInteractingRef.current = false;
        // Re-center if we drifted to edges during interaction
        const el = scrollContainerRef.current;
        if (el) {
          const widthPerSet = el.scrollWidth / 3;
          if (el.scrollLeft < widthPerSet || el.scrollLeft >= widthPerSet * 2) {
            el.scrollLeft = widthPerSet + (el.scrollLeft % widthPerSet);
          }
        }

        startAutoscroll();
      }, 2000);
    };

    const handleUserInteraction = () => {
      isUserInteractingRef.current = true;
      stopAutoscroll();
      scheduleAutoscrollResume();
    };

    // Start autoscroll
    startAutoscroll();

    // Listen for user interactions
    container.addEventListener("mousedown", handleUserInteraction);
    container.addEventListener("touchstart", handleUserInteraction, {
      passive: true,
    });
    container.addEventListener("wheel", handleUserInteraction, {
      passive: true,
    });

    return () => {
      stopAutoscroll();
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }

      container.removeEventListener("mousedown", handleUserInteraction);
      container.removeEventListener("touchstart", handleUserInteraction);
      container.removeEventListener("wheel", handleUserInteraction);
    };
  }, [prices]);

  // If not visible, show a minimal bar with show button
  if (!isVisible) {
    return (
      <div className="bg-main-accent text-white py-2 border-b border-orange-300 relative overflow-hidden z-pricebar pointer-events-auto">
        <div className="container mx-auto px-4 pr-12 relative z-pricebar">
          <div className="flex items-center justify-center">
            <button
              onClick={handleShow}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
            >
              <BarChart3 size={16} />
              <span className="text-sm font-medium">Fiyat Çubuğunu Göster</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-main-accent text-white py-2 border-b border-orange-300 relative overflow-hidden z-pricebar pointer-events-auto">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-4 z-pricebar-ctrl p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors duration-200 cursor-pointer"
        aria-label="Close price bar"
      >
        <X size={16} />
      </button>

      <div className="container mx-auto relative z-pricebar">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-black bitcoin-symbol hover:opacity-80 transition-opacity mr-2 cursor-pointer"></button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium text-foreground">
                        <span className="bitcoin-symbol text-main-accent mr-1"></span>
                        <span>Bitcoin (BTC)</span>
                      </h4>
                      <div className="text-muted-foreground">
                        Bitcoin, merkezi olmayan dijital para birimidir. Satoshi Nakamoto tarafından
                        2009 yılında oluşturulmuştur.
                      </div>
                      <div className="text-muted-foreground">
                        <p>Bitcoin'in en önemli özellikleri</p>
                      </div>
                      <div className="text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>Merkezi olmayan yapı</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>Sınırlı arz (21 milyon BTC)</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>Şeffaf ve güvenli</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>Dünya çapında kullanım</span>
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>{" "}
                veya{" "}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-black satoshi-symbol text-lg ml-2 mb-1 hover:opacity-80 transition-opacity cursor-pointer"></button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium text-foreground">
                        <span className="satoshi-symbol text-main-accent mr-2"></span>
                        <span>Satoshi (sat)</span>
                      </h4>
                      <div className="flex flex-col text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>
                            1 Bitcoin kaç <strong>satoshi</strong> eder?
                          </span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>
                            1 BTC = 100.000.000 <strong>sat</strong>
                          </span>
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        Bitcoin, 100 milyon <strong>satoshi</strong> adlı daha küçük birimlere
                        bölünebilir. Satoshi veya kısaca <strong>sat</strong>, Bitcoin'in en küçük
                        birimidir. 1 sat = 0.00000001 BTC (yani bir Bitcoin'in yüz milyonda biri).
                      </div>
                      <div className="text-muted-foreground">
                        Bitcoin almak için 1 BTC'nin tamamını almanız gerekmez. İstediğiniz kadar
                        küçük miktarda satın alabilir veya gönderebilirsiniz. Bu, Bitcoin'i herkes
                        için erişilebilir kılar.
                      </div>
                      <div className="text-muted-foreground">
                        <p>Örneğin:</p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>1 USD ile yaklaşık {oneUsdInSatoshi}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>🔹</span>
                          <span>1 TRY ile yaklaşık {oneTryInSatoshi}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span>
                            <strong>sat</strong> satın alınabilir
                          </span>
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <span className="ml-2">Cinsinden Anlık Fiyatlar</span>
              </h3>

              <p className="text-xs text-black/80 font-medium ml-2">
                {btcPrice && (
                  <span className="ml-2 text-md font-bold">
                    ₿ {btcPrice} <span className="">$</span>
                    {btcChange && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 ml-2 rounded-full ${
                          parseFloat(btcChange) >= 0
                            ? "text-white/80 bg-green-600/80"
                            : "text-white/80 bg-red-600/80"
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
            <div className="flex flex-row items-center space-x-4 text-xs font-normal">
              <div className="flex items-center space-x-2">
                <span className="italic">"Her şey bitcoin karşısında sıfıra gidiyor"</span>
                <span>- Max Keiser</span>
              </div>
              {hiddenPrices.size > 0 && (
                <button
                  onClick={() => {
                    setHiddenPrices(new Set());

                    const cache = getCache();

                    cache.setPriceFilter([]);
                  }}
                  className="text-white/70 hover:text-white transition-colors duration-200 underline cursor-pointer"
                  title={`${hiddenPrices.size} gizli fiyat var. Tümünü göster.`}
                >
                  {hiddenPrices.size} gizli fiyat
                </button>
              )}
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
              <>
                {filteredPrices.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-white/80">
                    <span className="text-sm">Tüm fiyatlar gizlendi</span>
                    <button
                      onClick={() => {
                        setHiddenPrices(new Set());

                        const cache = getCache();

                        cache.setPriceFilter([]);
                      }}
                      className="ml-2 text-white hover:text-white/80 underline transition-colors duration-200"
                    >
                      Tümünü göster
                    </button>
                  </div>
                ) : (
                  <div
                    ref={scrollContainerRef}
                    className="flex items-center space-x-4 py-2 px-4 overflow-x-auto scrollbar-hide cursor-grab select-none"
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
                    {displayPrices.map((price, index) => (
                      <div
                        key={`${price.symbol}-${index}`}
                        className="group flex items-center space-x-2 text-sm whitespace-nowrap flex-shrink-0 cursor-pointer hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors duration-200"
                        onClick={() => handlePriceClick(price.priceSymbol)}
                      >
                        <span className="text-white/90 font-medium">
                          {price.emoji} {price.name}:
                        </span>
                        <span className="font-bold text-white">{price.value}</span>
                        {price.currency === "sats" && (
                          <span className="text-white satoshi-symbol mb-1"></span>
                        )}
                        {price.currency === "BTC" && (
                          <span className="text-white bitcoin-symbol"></span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            parseFloat(price.change) >= 0
                              ? "text-white/80 bg-green-600/80"
                              : "text-white/80 bg-red-600/80"
                          }`}
                        >
                          {parseFloat(price.change) >= 0 ? "+" : ""}
                          {parseFloat(price.change).toFixed(2)}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHidePrice(price.priceSymbol);
                          }}
                          className="ml-2 text-white/60 hover:text-red-400 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                          title="Fiyatı Gizle"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
        <DialogContent className="max-w-screen-xl h-[90vh] p-0 flex flex-col bg-dialog">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-foreground">
              {selectedSymbol ? `${selectedSymbol} Grafiği` : "Fiyat Grafiği"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6 pt-0 min-h-0">
            {selectedSymbol && <Chart key={selectedSymbol} symbol={selectedSymbol} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceBar;
