import { Trash2, Edit, AlertCircle, Loader2 } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RemovePodcastPayload } from "@/types/admin";
import { EventItem } from "@/lib/nip01";
import { getKind30023Events } from "@/lib/nip23";
import { useTags } from "@/hooks/useTags";
import { getPublishedAt } from "@/lib/utils";

import type { PodcastTag } from "../../../api-helpers/utils";
import { extractPodcastDataFromEvent } from "../../../api-helpers/utils";

import { Skeleton } from "../ui/skeleton";
import UploadToX from "./UploadToX";
import { publishToX } from "./utils";

interface PodcastCurationProps {
  podcasts: PodcastTag[];
  lastUpdated: number;
  performAction: (data: RemovePodcastPayload) => Promise<void>;
  reload: () => void;
  onEditPodcast?: (podcastData: any) => void;
}

export default function PodcastCuration({
  podcasts,
  lastUpdated,
  performAction,
  reload,
  onEditPodcast,
}: PodcastCurationProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [podcastEvents, setPodcastEvents] = useState<Map<string, EventItem>>(new Map());
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<EventItem | null>(null);
  const { tags } = useTags();

  useEffect(() => {
    if (podcasts.length > 0) {
      const relays = new Set(podcasts.flatMap((n) => n.relays));
      const aTags = podcasts.map((n) => n.aTag);

      const [pubkeys, identifiers] = aTags.reduce(
        (acc, aTag) => {
          const [_kind, pubkey, identifier] = aTag.split(":");
          acc[0].push(pubkey);
          acc[1].push(identifier);

          return acc;
        },
        [[], []],
      );

      const cleanup = getKind30023Events(Array.from(relays), pubkeys, identifiers, (events) => {
        setPodcastEvents(events);
      });

      return () => {
        cleanup();
      };
    }
  }, [podcasts]);

  const handleRemovePodcast = async (tag: PodcastTag) => {
    setRemoving(tag.aTag);

    try {
      await performAction({
        action: "remove-podcast",
        tagToBeRemoved: tag,
      });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Podcast Küratörlüğü ({podcasts?.length || 0})
        </CardTitle>
        <CardDescription>
          Küratörlenen podcast içerikleri, Son güncelleme:{" "}
          {new Date(lastUpdated || 0).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {podcasts.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz podcast eklenmemiş</p>
          ) : podcastEvents.size === 0 ? (
            Array.from({ length: podcasts.length }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))
          ) : (
            Array.from(podcastEvents.values())
              .sort((a, b) => getPublishedAt(b) - getPublishedAt(a))
              .map((event) => {
                const content = event.content || "";
                const titleTag = event.tags.find((t) => t[0] === "title")?.[1];
                const summaryTag = event.tags.find((t) => t[0] === "summary")?.[1];
                const dTag = event.tags.find((t) => t[0] === "d")?.[1];
                const display = titleTag || summaryTag || content;
                const naddr = nip19.naddrEncode({
                  identifier: dTag,
                  kind: 30023,
                  pubkey: event.pubkey,
                  relays: event.relays,
                });

                const aTag = `30023:${event.pubkey}:${dTag}`;

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="text-sm truncate max-w-[48ch]">
                        <a
                          href={`https://bitcoinsondakika.com/podcast/${dTag}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 font-bold"
                        >
                          {display}
                        </a>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {event.id.substring(0, 6)}...{event.id.substring(event.id.length - 6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.relays.join(", ")}{" "}
                        {new Date(event.created_at * 1000).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShareData(event);
                          setShareOpen(true);
                        }}
                        title="X'e yükle"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 16 16"
                        >
                          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                        </svg>
                      </Button>
                      {onEditPodcast && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onEditPodcast(extractPodcastDataFromEvent(event, tags));
                          }}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={removing === aTag}
                        onClick={() => handleRemovePodcast({ aTag, relays: event.relays })}
                      >
                        {removing === aTag ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>

      <UploadToX
        open={shareOpen}
        onOpenChange={setShareOpen}
        eventItem={shareData}
        publishToX={publishToX}
        type="podcast"
        width={800}
        height={600}
      />
    </Card>
  );
}
