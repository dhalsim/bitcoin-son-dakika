import { useEffect, useState, useCallback } from "react";

interface PriceData {
  name: string;
  symbol: string;
  value: string;
  change: string;
  btcValue: string;
  category: "crypto" | "currency" | "commodity" | "stock";
  usdValue: number;
}

interface PriceResponse {
  success: boolean;
  data: {
    prices: PriceData[];
    btcPrice: number;
    btcChange: number;
    lastUpdated: string;
    source: string;
    totalAssets: number;
  };
}

interface UsePriceDataReturn {
  prices: PriceData[];
  btcPrice: number | null;
  btcChange: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => void;
}

export function usePriceData(
  refreshInterval: number = 600000,
): UsePriceDataReturn {
  // 10 minutes default
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the main gateway API endpoint
      const response = await fetch("/api/prices");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PriceResponse = await response.json();

      if (result.success && result.data) {
        setPrices(result.data.prices);
        setBtcPrice(result.data.btcPrice);
        setBtcChange(result.data.btcChange);
        setLastUpdated(result.data.lastUpdated);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching price data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch price data",
      );

      // Fallback to static data if API fails
      setPrices([
        {
          name: "Bitcoin",
          symbol: "₿",
          value: "45,000",
          change: "+2.1%",
          btcValue: "1.00000000",
          category: "crypto",
          usdValue: 45000,
        },
        {
          name: "Ethereum",
          symbol: "Ξ",
          value: "2,800",
          change: "+1.5%",
          btcValue: "0.06222222",
          category: "crypto",
          usdValue: 2800,
        },
        {
          name: "Tether",
          symbol: "₮",
          value: "1.00",
          change: "0.0%",
          btcValue: "0.00002222",
          category: "crypto",
          usdValue: 1,
        },
      ]);
      setBtcPrice(45000);
      setBtcChange(2.1);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up interval for automatic refresh
    const interval = setInterval(fetchPrices, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    btcPrice,
    btcChange,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
