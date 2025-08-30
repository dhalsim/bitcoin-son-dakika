import { Trash2, ExternalLink, User, Tag, Edit } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemovePodcastPayload } from "@/types/admin";

import type { PodcastTag } from "../../../api-helpers/utils";
import { extractPodcastDataFromEvent } from "../../../api-helpers/utils";
import { EventItem } from "@/lib/nip01";
import { getKind30023Events } from "@/lib/nip23";
import { Skeleton } from "../ui/skeleton";

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Podcast Kürasyonu</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">Son güncelleme: {formatDate(lastUpdated)}</p>
          <Button onClick={reload} variant="outline">
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {podcasts.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz podcast eklenmemiş</p>
        ) : podcastEvents.size === 0 ? (
          Array.from({ length: podcasts.length }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
            .sort((a, b) => b.created_at - a.created_at)
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
                <Card key={aTag} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          Podcast: {display || "Başlıksız"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onEditPodcast && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onEditPodcast(extractPodcastDataFromEvent(event));
                            }}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemovePodcast({ aTag, relays: event.relays })}
                          disabled={removing === aTag}
                        >
                          {removing === aTag ? (
                            "Kaldırılıyor..."
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Kaldır
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span>Relays:</span>
                          <span className="font-mono text-xs">{event.relays.join(", ")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://bitcoinsondakika.com/podcast/${dTag}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Podcast'i görüntüle
                        </a>
                        <a
                          href={`https://nostr.band/${naddr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Nostr.band'de görüntüle
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
