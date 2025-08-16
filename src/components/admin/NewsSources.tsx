import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { createNIP98Auth } from "./utils";

type ScraperSource = "coindesk" | "cointelegraph" | "tradingview" | "bitcoinmagazine" | "therage";

type ScrapedItem = {
  title: string;
  summary?: string;
  url: string;
  published?: string;
  image?: string;
  source: ScraperSource;
};

export default function NewsSources({ onPrefill }: { onPrefill?: (data: any) => void }) {
  const [scrapes, setScrapes] = useState<ScrapedItem[]>([]);
  const [scrapesLoading, setScrapesLoading] = useState<boolean>(false);
  const [scrapesError, setScrapesError] = useState<string>("");
  const [scrapesLastUpdated, setScrapesLastUpdated] = useState<string>("");
  const [scrapesFilter, setScrapesFilter] = useState<"all" | ScraperSource>("all");

  const fetchScrapes = useCallback(async (refresh: boolean = false) => {
    setScrapesLoading(true);
    setScrapesError("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;

      const authHeader = await createNIP98Auth("POST", url);

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

  useEffect(() => {
    fetchScrapes(false);
  }, [fetchScrapes]);

  return (
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
  );
}
