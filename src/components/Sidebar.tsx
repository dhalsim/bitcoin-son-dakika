import { TrendingUp, PenTool } from "lucide-react";

import type { ArticleItem, NewsItem } from "@/lib/ssg-data";

const Sidebar = ({
  news,
  articles,
}: {
  news: NewsItem[];
  articles: ArticleItem[];
}) => {
  return (
    <aside className="space-y-6">
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Hash Oranı
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                EH/s
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                485.2
              </div>
              <div className="text-xs text-green-600">+3.2%</div>
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
                62.46T
              </div>
              <div className="text-xs text-red-600">-1.2%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Mempool
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Bekleyen TX
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                8,432
              </div>
              <div className="text-xs text-green-600">-15.3%</div>
            </div>
          </div>
        </div>
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
