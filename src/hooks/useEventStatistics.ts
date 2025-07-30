import type { NostrEvent } from "nostr-tools";
import { useState, useEffect, useCallback } from "react";

import type { EventStatistics } from "@/lib/event-statistics";
import { getEventStatistics } from "@/lib/event-statistics";

export function useEventStatistics(
  event: NostrEvent | null,
  relays?: string[],
) {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(() => {
    if (!event) {
      setStatistics(null);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The getEventStatistics function now uses callbacks and caching
      // It will automatically update the statistics as data comes in
      getEventStatistics(event, relays, (stats) => {
        setStatistics(stats);
        setLoading(false);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch statistics",
      );
      setLoading(false);
    }
  }, [event, relays]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const refetch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch,
  };
}
