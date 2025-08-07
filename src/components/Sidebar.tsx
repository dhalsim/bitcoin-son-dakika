import { TrendingUp, PenTool, Info } from "lucide-react";

import type { ArticleItem, NewsItem } from "@/lib/ssg-data";

import { useBitcoinStats } from "../hooks/useBitcoinStats.js";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Sidebar = ({
  news,
  articles,
}: {
  news: NewsItem[];
  articles: ArticleItem[];
}) => {
  const { stats, loading, error } = useBitcoinStats();

  return (
    <aside className="w-full lg:w-80 space-y-6">
      {/* Recent Columns */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center mb-4">
          <PenTool className="h-5 w-5 text-main-accent mr-2" />
          <h3 className="text-lg font-bold text-foreground">Köşe Yazıları</h3>
        </div>

        <div className="space-y-4">
          {articles.map((article, index) => (
            <div
              key={index}
              className="border-b border-border pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-foreground hover:text-main-accent cursor-pointer text-sm leading-snug mb-1">
                {article.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {article.author.display_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          <a
            href="/articles"
            className="flex items-center text-foreground hover:text-main-accent transition-colors"
          >
            <span className="text-sm font-medium">Tüm Makaleler →</span>
          </a>
        </div>
      </div>

      {/* Trending News */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-main-accent mr-2" />
          <h3 className="text-lg font-bold text-foreground">Gündem</h3>
        </div>

        <div className="space-y-4">
          {news.map((n, index) => (
            <div
              key={index}
              className="border-b border-border pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-foreground hover:text-main-accent cursor-pointer text-sm leading-snug mb-1">
                {n.title}
              </h4>
              <span className="text-xs text-muted-foreground">
                {new Date(n.publishedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          <a
            href="/news"
            className="flex items-center text-foreground hover:text-main-accent transition-colors"
          >
            <span className="text-sm font-medium">Tüm Haberler →</span>
          </a>
        </div>
      </div>

      {/* Bitcoin Stats */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">
          Bitcoin İstatistikleri
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">
            Veri yüklenirken hata oluştu
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Hash Oranı</div>
                <div className="text-xs text-muted-foreground">
                  {stats.hashrate.unit}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.hashrate.value}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium text-foreground">Zorluk</div>
                  <div className="text-xs text-muted-foreground">Trilyon</div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">
                        Bitcoin Zorluk Ayarı
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Her 2,016 blok (~2 hafta) sonrasında Bitcoin, ortalama
                          blok süresini 10 dakika civarında tutmak için
                          madencilik zorluğunu ayarlar.
                        </p>
                        <p>Eğer bloklar çok hızlı kazılırsa, zorluk artar.</p>
                        <p>Eğer bloklar çok yavaş kazılırsa, zorluk azalır.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="text-right">
                <div
                  className={`font-medium text-foreground ${stats.difficulty.previousChange > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  Önceki Ayar: %{stats.difficulty.previousChange.toFixed(2)}
                </div>
                <div
                  className={`text-xs ${stats.difficulty.estimatedChange > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  Beklenen Ayar: %{stats.difficulty.estimatedChange.toFixed(2)},{" "}
                  {new Date(
                    stats.difficulty.estimatedRetargetDate * 1000,
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Mempool</div>
                <div className="text-xs text-muted-foreground">
                  {stats.mempool.status}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.mempool.count.toLocaleString()} Txs
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.mempool.size} vB
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">
                  Önerilen Ücret
                </div>
                <div className="text-xs text-muted-foreground">sat/vB</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.fees.halfHourFee}
                </div>
                <div className="text-xs text-muted-foreground">30 dk</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-muted rounded-lg p-8 text-center border border-border">
        <div className="text-muted-foreground text-sm">REKLAM ALANI</div>
      </div>
    </aside>
  );
};

export default Sidebar;
