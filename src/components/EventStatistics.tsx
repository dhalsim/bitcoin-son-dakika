import { useState, useEffect, useMemo, useCallback } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { getCache } from "@/lib/cache";
import type { EventStatistics } from "@/lib/event-statistics";
import { getEventStatistics } from "@/lib/event-statistics";
import type { ProfileItem } from "@/lib/nip01";
import { getProfiles } from "@/lib/nip01";

import { ActionButtons, type EventStatisticsProps } from "./event-statistics";

const cache = getCache();

export function EventStatistics({ event, author, className = "" }: EventStatisticsProps) {
  // State management
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Map<string, ProfileItem>>(new Map());

  const updateStatistics = useCallback((stats: EventStatistics) => {
    console.log("updateStatistics", event.id, {
      emojis: stats.emojis.size,
      zaps: stats.zaps.size,
      replies: stats.replies.size,
      nip22Replies: stats.nip22Replies.size,
      quotes: stats.quotes.size,
      reposts: stats.reposts.size,
      reactions: stats.reactions.size,
    });

    setStatistics(stats);
    setLoading(false);
  }, []);

  // Extract all pubkeys from statistics when they change
  const allPubkeys = useMemo(() => {
    if (!statistics) {
      return [];
    }

    return [
      ...Array.from(statistics.replies.values()).map((reply) => reply.pubkey),
      ...Array.from(statistics.nip22Replies.values()).map((reply) => reply.pubkey),
      ...Array.from(statistics.quotes.values()).map((quote) => quote.pubkey),
      ...Array.from(statistics.reposts.values()).map((repost) => repost.pubkey),
      ...Array.from(statistics.likes.values()).map((like) => like.pubkey),
      ...Array.from(statistics.dislikes.values()).map((dislike) => dislike.pubkey),
      ...Array.from(statistics.emojis.values()).flatMap((customEmoji) =>
        customEmoji.events.map((event) => event.pubkey),
      ),
      ...Array.from(statistics.zaps.values()).map((zap) => zap.zapRequest.pubkey),
    ];
  }, [statistics]);

  // Use ProfileContext to get profiles
  useEffect(() => {
    if (allPubkeys.length === 0) {
      return;
    }

    const cachedProfiles = cache.getProfileItems();

    // filter cached profiles with allPubkeys
    setProfiles((prev) => {
      const newProfiles = new Map(prev);

      allPubkeys.forEach((p) => {
        const profile = cachedProfiles.get(p);

        if (profile) {
          newProfiles.set(p, profile);
        }
      });

      return newProfiles;
    });

    const subCloser = getProfiles({
      authors: allPubkeys,
      cachedProfiles,
      onUpdate: (px) => {
        if (!px) {
          return;
        }

        // merge with existing profiles
        setProfiles((prev) => {
          const newProfiles = new Map(prev);

          px.forEach((profile, pubkey) => {
            newProfiles.set(pubkey, profile);
          });

          return newProfiles;
        });

        // update the cache
        cache.setProfileItems(cachedProfiles);
      },
    });

    return () => {
      subCloser();
    };
  }, [allPubkeys]);

  // Load event statistics
  useEffect(() => {
    if (!event) {
      return;
    }

    setLoading(true);
    setError(null);

    const cleanup = getEventStatistics(event, updateStatistics);

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [event, updateStatistics]);

  // Get current user's pubkey
  // (removed several UI states and handlers in favor of encapsulation in ActionButtons)

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>Hata: {error}</div>;
  }

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        <ActionButtons
          event={event}
          author={author}
          statistics={statistics}
          setStatistics={setStatistics}
          profiles={profiles}
        />
      </div>
    </TooltipProvider>
  );
}
