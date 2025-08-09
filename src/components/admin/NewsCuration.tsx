import { AlertCircle, Loader2, Trash2, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import UploadToX from "./UploadToX";

type NewsItem = { eTag: string; relay: string };

export default function NewsCuration({
  news,
  lastUpdated,
  performAction,
  reload,
}: {
  news: NewsItem[];
  lastUpdated: number;
  performAction: (data: any) => Promise<any>;
  reload: () => Promise<void> | void;
}) {
  const [newsEventId, setNewsEventId] = useState("");
  const [newsRelay, setNewsRelay] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    title?: string;
    summary?: string;
    image?: string;
    content?: string;
  } | null>(null);

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
          ) : (
            news.map((n) => (
              <div
                key={`${n.eTag}-${n.relay}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="font-mono text-sm">
                  {n.eTag.substring(0, 6)}...
                  {n.eTag.substring(n.eTag.length - 6)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // We don't have full news metadata here; open with minimal info, user can edit
                      setShareData({
                        title: "",
                        summary: "",
                        image: "",
                        content: "",
                      });
                      setShareOpen(true);
                    }}
                    title="X'e yükle"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removingKey === `${n.eTag}-${n.relay}`}
                    onClick={() => onRemoveNews(n.eTag, n.relay)}
                  >
                    {removingKey === `${n.eTag}-${n.relay}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
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
        initialTitle={shareData?.title}
        initialSummary={shareData?.summary}
        initialImage={shareData?.image}
        initialContent={shareData?.content}
        onUpload={async (blob) => {
          const formData = new FormData();
          formData.append("action", "upload-to-x");
          formData.append("file", new File([blob], "post.png", { type: "image/png" }));
          await fetch("/api/admin", { method: "POST", body: formData });
        }}
        width={800}
        height={600}
      />
    </Card>
  );
}
