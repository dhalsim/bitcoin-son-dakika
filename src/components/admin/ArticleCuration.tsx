import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventItem } from "@/lib/nip01";
import { getKind1Events } from "@/lib/nip01";
import type { ArticleTag } from "api-helpers/utils";

import UploadToX from "./UploadToX";
import { publishToX } from "./utils";

export default function ArticleCuration({
  articles,
  lastUpdated,
  performAction,
  reload,
  userNpub,
}: {
  articles: ArticleTag[];
  lastUpdated: number;
  performAction: (data: any) => Promise<any>;
  reload: () => Promise<void> | void;
  userNpub?: string;
}) {
  const [articleInputMethod, setArticleInputMethod] = useState<"naddr" | "fields">("naddr");
  const [articleNaddr, setArticleNaddr] = useState("");
  const [articleNpub, setArticleNpub] = useState(userNpub || "");
  const [articleDTag, setArticleDTag] = useState("");
  const [articleRelay, setArticleRelay] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<EventItem | null>(null);
  const [articleEvents, setArticleEvents] = useState<Map<string, EventItem>>(new Map());

  useEffect(() => {
    if (articles.length > 0) {
      const relays = new Set(articles.map((n) => n.relay));
      const ids = articles.map((n) => n.aTag);

      // TODO: this needs to be getKind30023Events nip23.ts
      const cleanup = getKind1Events(Array.from(relays), ids, (events) => {
        setArticleEvents(events);
      });

      return () => {
        cleanup();
      };
    }
  }, [articles]);

  const onAddByNaddr = async () => {
    try {
      setAdding(true);
      await performAction({
        action: "add-article",
        type: "naddr",
        naddr: articleNaddr.trim(),
      });
      setArticleNaddr("");
      await reload();
    } finally {
      setAdding(false);
    }
  };

  const onAddByFields = async () => {
    try {
      setAdding(true);
      await performAction({
        action: "add-article",
        type: "a",
        a: `30023:${articleNpub}:${articleDTag}`,
        relay: articleRelay.trim(),
      });
      setArticleNpub(userNpub || "");
      setArticleDTag("");
      setArticleRelay("");
      await reload();
    } finally {
      setAdding(false);
    }
  };

  const onRemove = async (aTag: string, relay: string) => {
    const key = `${aTag}-${relay}`;
    try {
      setRemovingKey(key);
      await performAction({ action: "remove-article", aTag, relay });
      await reload();
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Makale Küratörlüğü ({articles?.length || 0})
        </CardTitle>
        <CardDescription>
          Küratörlenen makale içerikleri, Son güncelleme:{" "}
          {new Date(lastUpdated || 0).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {articles?.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz makale eklenmemiş</p>
          ) : (
            articles.map((a) => (
              <div
                key={`${a.aTag}-${a.relay}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="font-mono text-sm">
                  {a.aTag.substring(0, 6)}...
                  {a.aTag.substring(a.aTag.length - 6)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShareData(articleEvents.get(a.aTag));
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
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removingKey === `${a.aTag}-${a.relay}`}
                    onClick={() => onRemove(a.aTag, a.relay)}
                  >
                    {removingKey === `${a.aTag}-${a.relay}` ? (
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
          <Label>Yeni Makale Ekle</Label>
          <div className="flex gap-2">
            <Button
              variant={articleInputMethod === "naddr" ? "default" : "outline"}
              size="sm"
              onClick={() => setArticleInputMethod("naddr")}
            >
              NAddr Girişi
            </Button>
            <Button
              variant={articleInputMethod === "fields" ? "default" : "outline"}
              size="sm"
              onClick={() => setArticleInputMethod("fields")}
            >
              Manuel Giriş
            </Button>
          </div>

          {articleInputMethod === "naddr" ? (
            <div className="space-y-3">
              <Input
                placeholder="naddr1..."
                value={articleNaddr}
                onChange={(e) => setArticleNaddr(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!articleNaddr.trim() || adding}
                onClick={onAddByNaddr}
              >
                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Makale Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="npub1..."
                value={articleNpub}
                onChange={(e) => setArticleNpub(e.target.value)}
              />
              <Input
                placeholder="D Tag (Makale ID)"
                value={articleDTag}
                onChange={(e) => setArticleDTag(e.target.value)}
              />
              <Input
                placeholder="wss://relay.example.com (isteğe bağlı)"
                value={articleRelay}
                onChange={(e) => setArticleRelay(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!articleNpub.trim() || !articleDTag.trim() || adding}
                onClick={onAddByFields}
              >
                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Makale Ekle
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <UploadToX
        open={shareOpen}
        onOpenChange={setShareOpen}
        eventItem={shareData}
        publishToX={publishToX}
        width={800}
        height={600}
      />
    </Card>
  );
}
