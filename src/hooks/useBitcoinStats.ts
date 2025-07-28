import { useState, useEffect } from "react";

import { WEBSITE_URL } from "@/lib/constants";

import {
  BitcoinStatsDataSchema,
  type BitcoinStatsData,
} from "../../common/bitcoin-stats/schemas.js";

type BitcoinStatsResponse =
  | (BitcoinStatsData & { success: true })
  | { success: false; message: string; error: string };

// Type guard to help TypeScript narrow the type
function isSuccessResponse(
  response: BitcoinStatsResponse,
): response is BitcoinStatsData & { success: true } {
  return response.success === true;
}

export const useBitcoinStats = () => {
  const [stats, setStats] = useState<BitcoinStatsData | null>(null);
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

        const rawBitcoinStats: BitcoinStatsResponse = await response.json();
        console.log("Bitcoin stats data:", rawBitcoinStats);

        if (!isSuccessResponse(rawBitcoinStats)) {
          throw new Error(
            rawBitcoinStats.error || "Failed to fetch Bitcoin stats",
          );
        }

        const bitcoinStats = BitcoinStatsDataSchema.parse(rawBitcoinStats);

        setStats(bitcoinStats);
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
