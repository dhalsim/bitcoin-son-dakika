import { TrendingUp, PenTool } from "lucide-react";
import React from "react";

const Sidebar = () => {
  const trendingNews = [
    {
      title: "Bitcoin 70.000 Doları Aştı: Yeni Rekor Gelir Mi?",
      time: "2 saat önce",
    },
    {
      title: "Lightning Network Büyük Güncelleme Aldı",
      time: "4 saat önce",
    },
    {
      title: "Tesla Bitcoin Satışlarını Durdurdu",
      time: "6 saat önce",
    },
    {
      title: "Türkiye'de Bitcoin Düzenlemeleri Netleşiyor",
      time: "8 saat önce",
    },
    {
      title: "Bitcoin Madenciliğinde Yeni Rekor",
      time: "10 saat önce",
    },
  ];

  const recentColumns = [
    {
      title: "Bitcoin'in Geleceği ve Kurumsal Yatırımcılar",
      author: "Ahmet Yılmaz",
      time: "1 gün önce",
    },
    {
      title: "Merkez Bankası Dijital Para Birimlerinin Etkisi",
      author: "Fatma Demir",
      time: "2 gün önce",
    },
    {
      title: "Enflasyona Karşı Bitcoin: Gerçek Koruma mu?",
      author: "Mehmet Özkan",
      time: "3 gün önce",
    },
    {
      title: "Lightning Network: Bitcoin'in Ölçekleme Çözümü",
      author: "Ayşe Kaya",
      time: "4 gün önce",
    },
    {
      title: "Türkiye'de Kripto Para Düzenlemeleri",
      author: "Can Şahin",
      time: "5 gün önce",
    },
  ];

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
          {recentColumns.map((column, index) => (
            <div
              key={index}
              className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {column.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {column.author}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {column.time}
                </span>
              </div>
            </div>
          ))}
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
          {trendingNews.map((news, index) => (
            <div
              key={index}
              className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0"
            >
              <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {news.title}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {news.time}
              </span>
            </div>
          ))}
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
