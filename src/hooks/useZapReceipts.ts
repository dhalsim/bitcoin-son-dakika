import type { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import { getZaps, type ZapReceipt } from "@/lib/nip57";

export function useZapReceipts(event: NostrEvent) {
  const [zaps, setZaps] = useState<Map<string, ZapReceipt>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const handleZapsUpdate = (newZaps: Map<string, ZapReceipt>) => {
      setZaps(newZaps);
      setLoading(false);
    };

    // Get zaps for this event
    const relays = [
      "wss://relay.nostr.band",
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.primal.net",
      "wss://relay.snort.social",
      "wss://nostr.bitcoiner.social",
      "wss://nostr.mom",
      "wss://nostr-pub.wellorder.net",
      "wss://relay.nos.social",
    ];
    getZaps(event, relays, handleZapsUpdate);

    // Set up real-time subscription for new zap receipts
    const unsubscribe = () => {
      // The getZaps function handles the subscription internally
    };

    return unsubscribe;
  }, [event.id]);

  return {
    zaps,
    loading,
    totalAmount: Array.from(zaps.values()).reduce(
      (sum, zap) => sum + zap.amount,
      0,
    ),
    count: zaps.size,
  };
}
