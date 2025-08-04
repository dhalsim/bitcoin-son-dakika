import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router";

import NewsCard from "@/components/NewsCard";
import type { EventItem } from "@/lib/nip01";
import { getProfiles, type ProfileItem } from "@/lib/nip01";
import { pool } from "@/lib/utils";

export default function TestEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<ProfileItem | null>(null);

  useEffect(() => {
    if (!event) {
      return undefined;
    }

    const cleanup = getProfiles({
      authors: [event.pubkey],
      cachedProfiles: new Map(),
      onUpdate: (profiles) => {
        setAuthor(profiles.get(event.pubkey));
      },
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [event]);

  const time = useMemo(() => {
    if (!event) {
      return "";
    }

    return new Date(event.created_at * 1000).toLocaleString();
  }, [event]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("No event ID provided");
        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      // Query relays for the specific event
      const relays = [
        "wss://relay.nostr.band",
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.primal.net",
        "wss://relay.snort.social",
      ];

      const event = await pool.get(relays, {
        ids: [eventId],
      });

      setEvent({ ...event, relay: relays[0] });
      setLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h1 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Event
            </h1>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">Event ID: {eventId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h1 className="text-lg font-semibold text-yellow-800 mb-2">
              Event Not Found
            </h1>
            <p className="text-yellow-700">
              The event with ID {eventId} could not be found on the relays.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse event content based on kind
  let title = "Event";
  let summary = event.content;
  let category = "Test";

  if (event.kind === 1) {
    // Regular note
    title = "Note";
    summary = event.content;
    category = "Note";
  } else if (event.kind === 30023) {
    // Article
    try {
      const parsed = JSON.parse(event.content);
      title = parsed.title || "Article";
      summary = parsed.summary || parsed.content || event.content;
      category = "Article";
    } catch {
      title = "Article";
      summary = event.content;
      category = "Article";
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h1 className="text-lg font-semibold text-blue-800 mb-2">
            Event Test Page
          </h1>
          <p className="text-blue-700 text-sm">
            Testing EventStatistics component with event ID: {eventId}
          </p>
          <div className="mt-2 text-xs text-blue-600 space-y-1">
            <p>
              <strong>Event Kind:</strong> {event.kind}
            </p>
            <p>
              <strong>Author:</strong> {event.pubkey.slice(0, 16)}...
            </p>
            <p>
              <strong>Created:</strong> {time}
            </p>
          </div>
        </div>

        <NewsCard
          title={title}
          summary={summary}
          category={category}
          time={time}
          publishedAt={event.created_at}
          event={event}
          author={author}
        />
      </div>
    </div>
  );
}
