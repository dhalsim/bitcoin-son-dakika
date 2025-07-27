import { useEffect, useState, useCallback } from "react";

import { WEBSITE_URL } from "@/lib/constants.js";

import type { BaseEndpointResponse, PriceData } from "../types/api.js";

interface UsePriceDataReturn {
  prices: PriceData[];
  btcPrice: string | null;
  btcChange: string | null;
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
  const [btcPrice, setBtcPrice] = useState<string | null>(null);
  const [btcChange, setBtcChange] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the main gateway API endpoint
      const response = await fetch(`${WEBSITE_URL}/api/price-feed`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BaseEndpointResponse = await response.json();

      if (result.success && result.prices) {
        setPrices(result.prices);
        setBtcPrice(result.btcPrice);
        setBtcChange(result.btcChange);
        setLastUpdated(result.lastUpdated);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching price data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch price data",
      );
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
