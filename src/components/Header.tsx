
import React from 'react';
import { Search, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="text-sm text-gray-600">
            Son Dakika Haberleri
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">22 Haziran 2025, Pazar</span>
            <div className="flex space-x-2">
              <span className="bg-[#F7931A] text-white px-2 py-1 rounded text-xs">TR</span>
              <span className="text-gray-600 px-2 py-1 text-xs">EN</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/028135f1-856a-4e86-a719-a75eca32fa2a.png" 
                alt="Bitcoin News"
                className="h-12 w-12"
              />
              <h1 className="text-2xl font-bold text-[#F7931A]">CoinHaber</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">Ana Sayfa</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">Bitcoin</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">Altcoin</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">DeFi</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">NFT</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">Analiz</a>
              <a href="#" className="text-gray-700 hover:text-[#F7931A] font-medium transition-colors">Piyasalar</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Haber ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7931A] w-64"
              />
            </div>
            <button className="lg:hidden">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
