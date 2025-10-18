import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";
import { AlertCircle, Loader2, Share2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { WEBSITE_URL } from "@/lib/constants";

import { createNIP98Auth } from "./utils";
import type { FormattedNewsItemWithImages } from "api-helpers/admin/zeronoise/types.js";

// Helper function to render markdown links as clickable HTML links
const renderMarkdownLinks = (text: string): JSX.Element => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the link
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {match[1]}
      </a>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};

type ScraperSource = "coindesk" | "cointelegraph" | "tradingview" | "bitcoinmagazine" | "therage";

type ScrapedItem = {
  title: string;
  summary?: string;
  url: string;
  published?: string;
  image?: string;
  source: ScraperSource;
};

type ZeronoiseEmail = {
  messageId: string;
  subject: string;
  date: string;
  blobUrl: string;
  items: ZeronoiseNewsItem[];
};

type ZeronoiseNewsItem = {
  index: number;
  title: string;
  content: string;
  image?: string;
  sources: string[];
  rawTags?: string[];
};

import type { PrefillData, ZeronoisePrefillData, ScrapedPrefillData } from "./types";

export default function NewsSources({ onPrefill }: { onPrefill?: (data: PrefillData) => void }) {
  const [scrapes, setScrapes] = useState<ScrapedItem[]>([]);
  const [scrapesLoading, setScrapesLoading] = useState<boolean>(false);
  const [scrapesError, setScrapesError] = useState<string>("");
  const [scrapesLastUpdated, setScrapesLastUpdated] = useState<string>("");
  const [scrapesFilter, setScrapesFilter] = useState<"all" | ScraperSource>("all");

  // Zeronoise state
  const [zeronoiseEmails, setZeronoiseEmails] = useState<ZeronoiseEmail[]>([]);
  const [zeronoiseLoading, setZeronoiseLoading] = useState<boolean>(false);
  const [zeronoiseError, setZeronoiseError] = useState<string>("");
  const [zeronoiseFromCache, setZeronoiseFromCache] = useState<boolean>(false);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<ZeronoiseNewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Loading state for individual items
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const { getPublicKey, signEvent } = useNostrAuth();

  const fetchScrapes = useCallback(async (refresh: boolean = false) => {
    setScrapesLoading(true);
    setScrapesError("");

    try {
      const url = `${WEBSITE_URL}/api/admin-panel`;

      const authHeader = await createNIP98Auth("POST", url, getPublicKey, signEvent);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ action: refresh ? "refresh-scrapes" : "get-scrapes" }),
      });

      const json = await response.json();

      if (json?.success) {
        const items = Array.isArray(json.items) ? json.items : [];

        setScrapes(items);

        setScrapesLastUpdated(json.lastUpdated || "");
      } else {
        setScrapesError(json?.error || json?.message || "Scrapes yüklenemedi");
      }
    } catch (e) {
      setScrapesError(e instanceof Error ? e.message : "Scrapes yüklenemedi");
    } finally {
      setScrapesLoading(false);
    }
  }, []);

  const fetchZeronoiseEmails = useCallback(
    async (noCache: boolean = false) => {
      setZeronoiseLoading(true);
      setZeronoiseError("");

      try {
        const url = `${WEBSITE_URL}/api/admin-panel`;

        const authHeader = await createNIP98Auth("POST", url, getPublicKey, signEvent);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ action: "fetch-zeronoise-emails", noCache }),
        });

        const json = await response.json();

        if (json?.success) {
          setZeronoiseEmails(json.emails || []);
          setZeronoiseFromCache(json.fromCache || false);
        } else {
          setZeronoiseError(json?.error || json?.message || "Zeronoise emails yüklenemedi");
        }
      } catch (e) {
        setZeronoiseError(e instanceof Error ? e.message : "Zeronoise emails yüklenemedi");
      } finally {
        setZeronoiseLoading(false);
      }
    },
    [getPublicKey, signEvent],
  );

  const formatZeronoiseItem = useCallback(
    async (
      messageId: string,
      itemIndex: number,
      item: ZeronoiseNewsItem,
    ): Promise<FormattedNewsItemWithImages> => {
      try {
        const url = `${WEBSITE_URL}/api/admin-panel`;

        const authHeader = await createNIP98Auth("POST", url, getPublicKey, signEvent);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: "format-zeronoise-item",
            messageId,
            itemIndex,
            item,
          }),
        });

        const json = await response.json();

        if (json?.success) {
          return json.formatted;
        } else {
          throw new Error(json?.error || "Formatting failed");
        }
      } catch (e) {
        console.error("Error formatting Zeronoise item:", e);
        throw e;
      }
    },
    [getPublicKey, signEvent],
  );

  const handleUseZeronoiseItem = useCallback(
    async (email: ZeronoiseEmail, item: ZeronoiseNewsItem) => {
      const itemKey = `${email.messageId}-${item.index}`;

      // Add to loading state
      setLoadingItems((prev) => new Set(prev).add(itemKey));

      try {
        const formatted = await formatZeronoiseItem(email.messageId, item.index, item);

        onPrefill?.({
          title: formatted.title,
          summary: formatted.summary,
          content: formatted.content,
          images: formatted.images,
          tags: formatted.tags,
          from: "zeronoise",
        });
      } catch (error) {
        console.error("Error using Zeronoise item:", error);
        setZeronoiseError("Item formatting failed. Please try again.");
      } finally {
        // Remove from loading state
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    },
    [formatZeronoiseItem, onPrefill],
  );

  const handleReadMore = useCallback((item: ZeronoiseNewsItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    fetchScrapes(false);
    fetchZeronoiseEmails(false);
  }, [fetchScrapes, fetchZeronoiseEmails]);

  return (
    <Tabs defaultValue="zeronoise" className="space-y-4">
      <TabsList>
        <TabsTrigger value="zeronoise">Zeronoise</TabsTrigger>
        <TabsTrigger value="scrapes">Scrape Sources</TabsTrigger>
      </TabsList>

      <TabsContent value="zeronoise">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchZeronoiseEmails(true)}
              disabled={zeronoiseLoading}
            >
              {zeronoiseLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yenileniyor...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Emails
                </>
              )}
            </Button>
            {zeronoiseFromCache && (
              <span className="text-xs text-muted-foreground">Cache'den yüklendi</span>
            )}
          </div>

          {zeronoiseError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{zeronoiseError}</AlertDescription>
            </Alert>
          )}

          {zeronoiseLoading && !zeronoiseEmails.length ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Zeronoise emails yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {zeronoiseEmails.map((email) => (
                <div key={email.messageId} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg">
                      {typeof email.subject === "string"
                        ? renderMarkdownLinks(email.subject)
                        : email.subject}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(email.date).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {email.items.map((item) => (
                      <div
                        key={item.index}
                        className="border rounded-md p-3 hover:bg-accent transition"
                      >
                        <div className="flex items-start gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold leading-snug line-clamp-2">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-3">
                              {item.content.substring(0, 150)}...
                            </div>
                            {item.rawTags && item.rawTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.rawTags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReadMore(item)}
                                className="flex-1"
                              >
                                Devamını Oku
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUseZeronoiseItem(email, item)}
                                className="flex-1"
                                disabled={loadingItems.has(`${email.messageId}-${item.index}`)}
                              >
                                {loadingItems.has(`${email.messageId}-${item.index}`) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    İşleniyor...
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="h-3 w-3 mr-1" />
                                    AI ile Kullan
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="scrapes">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="border rounded px-2 py-1 bg-background"
              value={scrapesFilter}
              onChange={(e) => setScrapesFilter(e.target.value as any)}
            >
              <option value="all">Tümü</option>
              <option value="coindesk">CoinDesk</option>
              <option value="cointelegraph">Cointelegraph</option>
              <option value="tradingview">TradingView</option>
              <option value="bitcoinmagazine">Bitcoin Magazine</option>
              <option value="therage">The Rage</option>
            </select>
            <button
              className="inline-flex items-center rounded bg-primary text-primary-foreground px-3 py-1 text-sm disabled:opacity-50"
              disabled={scrapesLoading}
              onClick={() => fetchScrapes(true)}
            >
              {scrapesLoading ? "Yenileniyor..." : "Yenile"}
            </button>
            {scrapesLastUpdated && (
              <span className="text-xs text-muted-foreground">
                Son güncelleme: {new Date(scrapesLastUpdated).toLocaleString()}
              </span>
            )}
          </div>

          {scrapesError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scrapesError}</AlertDescription>
            </Alert>
          )}

          {scrapesLoading && !scrapes.length ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scrapes
                .filter((it) => (scrapesFilter === "all" ? true : it.source === scrapesFilter))
                .map((item, idx) => (
                  <a
                    key={`${item.url}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition"
                  >
                    <div className="flex items-start gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-semibold leading-snug line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {item.summary || ""}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {item.source}
                          </Badge>
                          {item.published && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.published).toLocaleString()}
                            </span>
                          )}
                          <button
                            type="button"
                            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-accent cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();

                              onPrefill?.({
                                title: item.title,
                                summary: item.summary,
                                image: item.image,
                                url: item.url,
                                content: item.summary || "",
                                tags: ["bitcoin"],
                                from: "sources",
                              });
                            }}
                            title="Haber formuna kopyala"
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Modal for reading full content */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem?.image && (
              <img
                src={selectedItem.image}
                alt=""
                className="w-full max-w-md mx-auto rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedItem?.content}
              </div>
            </div>
            {selectedItem?.rawTags && selectedItem.rawTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedItem.rawTags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {selectedItem?.sources && selectedItem.sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Kaynaklar:</h4>
                <div className="space-y-1">
                  {selectedItem.sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      • {source}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
