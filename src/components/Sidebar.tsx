
import React from 'react';
import { TrendingUp } from 'lucide-react';

const Sidebar = () => {
  const trendingNews = [
    {
      title: "Bitcoin 70.000 Doları Aştı: Yeni Rekor Gelir Mi?",
      time: "2 saat önce"
    },
    {
      title: "Ethereum'da Büyük Güncelleme: Gas Ücretleri Düşecek",
      time: "4 saat önce"
    },
    {
      title: "Tesla Bitcoin Satışlarını Durdurdu",
      time: "6 saat önce"
    },
    {
      title: "Türkiye'de Kripto Para Düzenlemeleri Netleşiyor",
      time: "8 saat önce"
    },
    {
      title: "DeFi Protokollerinde Toplam Değer 100 Milyar Doları Aştı",
      time: "10 saat önce"
    }
  ];

  const cryptoPrices = [
    { name: "Bitcoin", symbol: "BTC", price: "67,845", change: "+2.45%" },
    { name: "Ethereum", symbol: "ETH", price: "3,234", change: "+1.87%" },
    { name: "BNB", symbol: "BNB", price: "612", change: "-0.56%" },
    { name: "Solana", symbol: "SOL", price: "178", change: "+3.21%" }
  ];

  return (
    <aside className="space-y-6">
      {/* Trending News */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-[#F7931A] mr-2" />
          <h3 className="text-lg font-bold text-gray-900">Gündem</h3>
        </div>
        
        <div className="space-y-4">
          {trendingNews.map((news, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
              <h4 className="font-medium text-gray-900 hover:text-[#F7931A] cursor-pointer text-sm leading-snug mb-1">
                {news.title}
              </h4>
              <span className="text-xs text-gray-500">{news.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto Prices */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Anlık Fiyatlar</h3>
        
        <div className="space-y-3">
          {cryptoPrices.map((crypto, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{crypto.name}</div>
                <div className="text-xs text-gray-500">{crypto.symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${crypto.price}</div>
                <div className={`text-xs ${crypto.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {crypto.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-gray-500 text-sm">REKLAM ALANI</div>
      </div>
    </aside>
  );
};

export default Sidebar;
