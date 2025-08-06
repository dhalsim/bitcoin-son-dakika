import { TrendingUp, PenTool } from "lucide-react";

import type { ArticleItem, NewsItem } from "@/lib/ssg-data";

import { useBitcoinStats } from "../hooks/useBitcoinStats.js";

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
          <h3 className="text-lg font-bold text-foreground">
            Köşe Yazıları
          </h3>
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
          <h3 className="text-lg font-bold text-foreground">
            Gündem
          </h3>
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
                <div className="font-medium text-foreground">
                  Hash Oranı
                </div>
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
              <div>
                <div className="font-medium text-foreground">
                  Zorluk
                </div>
                <div className="text-xs text-muted-foreground">
                  Trilyon
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.difficulty.value}
                </div>
                {stats.difficulty.change && (
                  <div
                    className={`text-xs ${stats.difficulty.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.difficulty.change}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">
                  Mempool
                </div>
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
                <div className="text-xs text-muted-foreground">
                  sat/vB
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.fees.halfHourFee}
                </div>
                <div className="text-xs text-muted-foreground">
                  30 dk
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-muted rounded-lg p-8 text-center border border-border">
        <div className="text-muted-foreground text-sm">
          REKLAM ALANI
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
