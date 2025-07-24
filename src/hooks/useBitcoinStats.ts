import { useState, useEffect } from "react";

import { WEBSITE_URL } from "@/lib/constants";

interface BitcoinStats {
  hashrate: {
    value: string;
    unit: string;
    timestamp: number;
  };
  fees: {
    fastest: number;
    halfHour: number;
    hour: number;
    economy: number;
    minimum: number;
  };
  difficulty: {
    value: string;
    change?: string;
    height: number;
  };
  mempool: {
    count: number;
    size: string;
    totalFee: string;
    status: string;
  };
  lastUpdated: string;
  source: string;
}

type BitcoinStatsResponse = {
  success: boolean;
  message?: string;
} & BitcoinStats;

export const useBitcoinStats = () => {
  const [stats, setStats] = useState<BitcoinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching Bitcoin stats...");
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${WEBSITE_URL}/api/bitcoin-stats/mempool`,
        );
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BitcoinStatsResponse = await response.json();
        console.log("Bitcoin stats data:", data);

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch Bitcoin stats");
        }

        setStats(data);
        console.log("Bitcoin stats set successfully");
      } catch (err) {
        console.error("Error fetching Bitcoin stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch Bitcoin stats",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 2 minutes
    const interval = setInterval(fetchStats, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
};
