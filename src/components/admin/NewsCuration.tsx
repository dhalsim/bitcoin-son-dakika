import { AlertCircle, Loader2, Trash2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import UploadToX from "./UploadToX";
import { NewsTag } from "api-helpers/utils";
import { EventItem, getKind1Events } from "@/lib/nip01";

export default function NewsCuration({
  news,
  lastUpdated,
  performAction,
  reload,
}: {
  news: NewsTag[];
  lastUpdated: number;
  performAction: (data: any) => Promise<any>;
  reload: () => Promise<void> | void;
}) {
  const [newsEventId, setNewsEventId] = useState("");
  const [newsRelay, setNewsRelay] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [newsEvents, setNewsEvents] = useState<Map<string, EventItem>>(new Map());
  const [shareData, setShareData] = useState<EventItem | null>(null);

  useEffect(() => {
    if (news.length > 0) {
      const relays = new Set(news.map((n) => n.relay));
      const ids = news.map((n) => n.eTag);

      const cleanup = getKind1Events(Array.from(relays), ids, (events) => {
        setNewsEvents(events);
      });

      return () => {
        cleanup();
      };
    }
  }, [news]);

  const onAddNews = async () => {
    try {
      setAdding(true);

      await performAction({
        action: "add-news",
        eventId: newsEventId.trim(),
        relay: newsRelay.trim(),
      });

      setNewsEventId("");
      setNewsRelay("");

      await reload();
    } finally {
      setAdding(false);
    }
  };

  const onRemoveNews = async (eventId: string, relay: string) => {
    const key = `${eventId}-${relay}`;

    try {
      setRemovingKey(key);

      await performAction({ action: "remove-news", eventId, relay });

      await reload();
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Haber Küratörlüğü ({news?.length || 0})
        </CardTitle>
        <CardDescription>
          Küratörlenen haber içerikleri, Son güncelleme:{" "}
          {new Date(lastUpdated || 0).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {news?.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz haber eklenmemiş</p>
          ) : newsEvents.size === 0 ? (
            Array.from({ length: news.length }).map((_, idx) => (
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
            Array.from(newsEvents.values())
              .sort((a, b) => b.created_at - a.created_at)
              .map((event) => {
                const content = event.content || "";
                const titleTag = event.tags.find((t) => t[0] === "title")?.[1];
                const summaryTag = event.tags.find((t) => t[0] === "summary")?.[1];
                const display = titleTag || summaryTag || content;

                return (
                  <div
                    key={`${event.id}-${event.relay}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">
                        {event.id.substring(0, 6)}...{event.id.substring(event.id.length - 6)}
                      </div>
                      <div className="text-sm truncate max-w-[48ch]">{display}</div>
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
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={removingKey === `${event.id}-${event.relay}`}
                        onClick={() => onRemoveNews(event.id, event.relay)}
                      >
                        {removingKey === `${event.id}-${event.relay}` ? (
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
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="newsEventId">Yeni Haber Ekle</Label>
          <Input
            id="newsEventId"
            placeholder="Event ID girin"
            value={newsEventId}
            onChange={(e) => setNewsEventId(e.target.value)}
          />
          <Input
            placeholder="Relay URL"
            value={newsRelay}
            onChange={(e) => setNewsRelay(e.target.value)}
          />
          <Button
            className="w-full"
            variant="secondary"
            disabled={!newsEventId.trim() || !newsRelay.trim() || adding}
            onClick={onAddNews}
          >
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Haber Ekle
          </Button>
        </div>
      </CardContent>

      <UploadToX
        open={shareOpen}
        onOpenChange={setShareOpen}
        eventItem={shareData}
        onUpload={async (blob) => {
          const formData = new FormData();
          formData.append("action", "upload-to-x");
          formData.append("media", new File([blob], "post.png", { type: "image/png" }));

          const response = await fetch("/api/admin", {
            method: "POST",
            body: JSON.stringify({ action: "upload-to-x", formData }),
          });

          console.log(response);
        }}
        width={800}
        height={600}
      />
    </Card>
  );
}
