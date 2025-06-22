
import React from 'react';
import { TrendingUp } from 'lucide-react';

const Sidebar = () => {
  const trendingNews = [
    {
      title: "Bitcoin 70.000 Doları Aştı: Yeni Rekor Gelir Mi?",
      time: "2 saat önce"
    },
    {
      title: "Lightning Network Büyük Güncelleme Aldı",
      time: "4 saat önce"
    },
    {
      title: "Tesla Bitcoin Satışlarını Durdurdu",
      time: "6 saat önce"
    },
    {
      title: "Türkiye'de Bitcoin Düzenlemeleri Netleşiyor",
      time: "8 saat önce"
    },
    {
      title: "Bitcoin Madenciliğinde Yeni Rekor",
      time: "10 saat önce"
    }
  ];

  return (
    <aside className="space-y-6">
      {/* Trending News */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 dark:border dark:border-gray-800">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-[#F7931A] mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Gündem</h3>
        </div>
        
        <div className="space-y-4">
          {trendingNews.map((news, index) => (
            <div key={index} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {news.title}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{news.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bitcoin Stats */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 dark:border dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Bitcoin İstatistikleri</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Hash Rate</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">EH/s</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">485.2</div>
              <div className="text-xs text-green-600">+3.2%</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Difficulty</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Trillion</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">62.46T</div>
              <div className="text-xs text-red-600">-1.2%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Mempool</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Bekleyen TX</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">8,432</div>
              <div className="text-xs text-green-600">-15.3%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8 text-center dark:border dark:border-gray-800">
        <div className="text-gray-500 dark:text-gray-400 text-sm">REKLAM ALANI</div>
      </div>
    </aside>
  );
};

export default Sidebar;
