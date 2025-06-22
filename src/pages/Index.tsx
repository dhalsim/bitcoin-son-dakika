
import React from 'react';
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const Index = () => {
  const featuredNews = {
    title: "Bitcoin Halving Sonrası Piyasada Büyük Hareketlilik",
    summary: "Bitcoin'in son halving olayının ardından kripto para piyasalarında önemli değişimler yaşanıyor. Uzmanlar, önümüzdeki dönemde fiyat hareketlerinin artacağını öngörüyor.",
    category: "Bitcoin",
    time: "30 dakika önce",
    image: "https://images.unsplash.com/photo-1518544866273-fc95ba4d8b2b?w=800&h=600&fit=crop"
  };

  const mainNews = [
    {
      title: "Ethereum'da Yeni Güncelleme: Gas Ücretleri %40 Azalacak",
      summary: "Ethereum ağındaki son güncelleme ile transaction maliyetlerinde önemli düşüş bekleniyor.",
      category: "Ethereum",
      time: "1 saat önce",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop"
    },
    {
      title: "Türkiye'de Kripto Para Düzenlemeleri Netleşiyor",
      summary: "BDDK'nın yeni açıklaması ile kripto para borsalarına yönelik kurallar belirlendi.",
      category: "Düzenleme",
      time: "2 saat önce",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"
    },
    {
      title: "DeFi Protokollerinde TVL 150 Milyar Doları Aştı",
      summary: "Merkezi olmayan finans protokollerindeki toplam kilitli değer yeni rekor seviyeye ulaştı.",
      category: "DeFi",
      time: "3 saat önce",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
    },
    {
      title: "NFT Piyasası Yeniden Canlanıyor: Sanat Eserleri Öne Çıkıyor",
      summary: "Non-fungible token piyasasında sanat eserlerine olan ilgi artarken, yeni projeler dikkat çekiyor.",
      category: "NFT",
      time: "4 saat önce",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
    }
  ];

  const sideNews = [
    {
      title: "Binance Yeni Coin Listelerini Açıkladı",
      summary: "Dünyanın en büyük kripto para borsası, önümüzdeki ay listelenecek yeni projeleri duyurdu.",
      category: "Borsa",
      time: "5 saat önce"
    },
    {
      title: "Tesla'nın Bitcoin Kararı Piyasaları Etkiledi",
      summary: "Elon Musk'ın şirketinin Bitcoin ile ilgili yeni kararı piyasalarda dalgalanmaya neden oldu.",
      category: "Şirket",
      time: "6 saat önce"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breaking News Banner */}
      <div className="bg-[#F7931A] text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <span className="bg-white text-[#F7931A] px-3 py-1 rounded-full text-sm font-bold mr-4">
              SON DAKİKA
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-pulse">
                <span className="text-sm font-medium">
                  Bitcoin 70.000 doları aştı! Piyasalarda büyük hareketlilik devam ediyor...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured News */}
            <div className="mb-8">
              <NewsCard {...featuredNews} featured={true} />
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
              {['Tümü', 'Bitcoin', 'Altcoin', 'DeFi', 'NFT', 'Analiz'].map((tab) => (
                <button
                  key={tab}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'Tümü' 
                      ? 'border-[#F7931A] text-[#F7931A]' 
                      : 'border-transparent text-gray-600 hover:text-[#F7931A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Main News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {mainNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>

            {/* Additional News */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 border-l-4 border-[#F7931A] pl-4">
                Diğer Haberler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sideNews.map((news, index) => (
                  <NewsCard key={index} {...news} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
