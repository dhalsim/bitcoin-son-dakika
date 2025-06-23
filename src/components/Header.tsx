
import React from 'react';
import { Search, Menu, Moon, Sun, Rss, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-black shadow-md relative">
      {/* Background image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/lovable-uploads/f67c2cf5-3d5b-4310-9128-a823e7c74a4c.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Bitcoinci Perspektiften Dünyanın Nabzı
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">22 Haziran 2025, Pazar</span>
            <div className="flex space-x-2">
              <span className="bg-[#F7931A] text-white px-2 py-1 rounded text-xs">TR</span>
              <span className="text-gray-600 dark:text-gray-400 px-2 py-1 text-xs">EN</span>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              <a href="#" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                <Rss className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </a>
              <a href="#" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                <img 
                  src="https://raw.githubusercontent.com/SovrynMatt/Nostr-Website-Button-Design/main/nostr-icon-purple-256x256.png" 
                  alt="Nostr"
                  className="h-4 w-4"
                />
              </a>
              <a href="#" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300">
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </a>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              {/* Light mode logo */}
              <img 
                src="/lovable-uploads/ddd6a57e-772d-4b33-a7df-b059c896614e.png" 
                alt="Bitcoin News"
                className="h-12 block dark:hidden"
                style={{ width: '129px', height: '48px' }}
              />
              {/* Dark mode logo */}
              <img 
                src="/lovable-uploads/028135f1-856a-4e86-a719-a75eca32fa2a.png" 
                alt="Bitcoin News"
                className="h-12 hidden dark:block"
                style={{ width: '129px', height: '48px' }}
              />
            </div>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <a href="#" className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded">Ana Sayfa</a>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded">
                  Haberler
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                  <DropdownMenuItem>Son Dakika</DropdownMenuItem>
                  <DropdownMenuItem>Piyasa Analizi</DropdownMenuItem>
                  <DropdownMenuItem>Teknoloji</DropdownMenuItem>
                  <DropdownMenuItem>Düzenlemeler</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded">
                  Köşe Yazıları
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                  <DropdownMenuItem>Güncel Yorumlar</DropdownMenuItem>
                  <DropdownMenuItem>Teknik Analiz</DropdownMenuItem>
                  <DropdownMenuItem>Ekonomi</DropdownMenuItem>
                  <DropdownMenuItem>Teknoloji</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded">
                  Eğitim
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                  <DropdownMenuItem>Bitcoin Temelleri</DropdownMenuItem>
                  <DropdownMenuItem>Cüzdan Kullanımı</DropdownMenuItem>
                  <DropdownMenuItem>Güvenlik</DropdownMenuItem>
                  <DropdownMenuItem>Lightning Network</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a href="#" className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded">Podcast</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Haber ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64 bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-all duration-300"
              />
            </div>
            <button className="lg:hidden hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded">
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
