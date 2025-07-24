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

  console.log(
    "Sidebar render - stats:",
    stats,
    "loading:",
    loading,
    "error:",
    error,
  );

  return (
    <aside className="w-full lg:w-80 space-y-6">
      {/* Recent Columns */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 dark:border dark:border-gray-800">
        <div className="flex items-center mb-4">
          <PenTool className="h-5 w-5 text-[#F7931A] mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Köşe Yazıları
          </h3>
        </div>

        <div className="space-y-4">
          {articles.map((article, index) => (
            <div
              key={index}
              className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {article.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {article.author.display_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          <a
            href="/articles"
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-[#F7931A] transition-colors"
          >
            <span className="text-sm font-medium">Tüm Makaleler →</span>
          </a>
        </div>
      </div>

      {/* Trending News */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 dark:border dark:border-gray-800">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-[#F7931A] mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Gündem
          </h3>
        </div>

        <div className="space-y-4">
          {news.map((n, index) => (
            <div
              key={index}
              className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {n.title}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(n.publishedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          <a
            href="/news"
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-[#F7931A] transition-colors"
          >
            <span className="text-sm font-medium">Tüm Haberler →</span>
          </a>
        </div>
      </div>

      {/* Bitcoin Stats */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 dark:border dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Bitcoin İstatistikleri
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">
            Veri yüklenirken hata oluştu
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Hash Oranı
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.hashrate.unit}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {stats.hashrate.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Güncel
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Zorluk
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Trilyon
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
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
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Mempool
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.mempool.status}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {stats.mempool.count.toLocaleString()} Txs
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.mempool.size} vB
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Önerilen Ücret
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  sat/vB
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {stats.fees.halfHourFee}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  30 dk
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8 text-center dark:border dark:border-gray-800">
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          REKLAM ALANI
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
