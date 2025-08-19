import { Trash2, ExternalLink, Calendar, User, Tag } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import type { PodcastTag } from "../../../api-helpers/utils";

interface PodcastCurationProps {
  podcasts: PodcastTag[];
  lastUpdated: number;
  performAction: (data: any) => Promise<void>;
  reload: () => void;
}

export default function PodcastCuration({
  podcasts,
  lastUpdated,
  performAction,
  reload,
}: PodcastCurationProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemovePodcast = async (aTag: string, relay: string) => {
    setRemoving(aTag);
    try {
      await performAction({
        action: "remove-podcast",
        aTag,
        relay,
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

  if (podcasts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Podcast Kürasyonu</h2>
          <Button onClick={reload} variant="outline">
            Yenile
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Henüz podcast eklenmemiş.</AlertDescription>
        </Alert>
      </div>
    );
  }

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
        {podcasts.map((podcast) => {
          const [kind, pubkey, dTag] = podcast.aTag.split(":");
          const npub = nip19.npubEncode(pubkey);

          return (
            <Card key={podcast.aTag} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Podcast: {dTag || "Başlıksız"}</span>
                    <Badge variant="secondary">Kind {kind}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePodcast(podcast.aTag, podcast.relay)}
                    disabled={removing === podcast.aTag}
                  >
                    {removing === podcast.aTag ? (
                      "Kaldırılıyor..."
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Kaldır
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Yazar:</span>
                      <a
                        href={`https://nostr.band/${npub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {npub.slice(0, 8)}...{npub.slice(-8)}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>Relay:</span>
                      <span className="font-mono text-xs">{podcast.relay}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://nostr.band/e/${dTag}`}
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
        })}
      </div>
    </div>
  );
}
