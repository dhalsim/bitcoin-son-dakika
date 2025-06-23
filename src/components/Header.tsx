import React, { useState } from 'react';
import { Search, Menu, Moon, Sun, Rss, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            Bitcoin Haberleri ve Piyasa Analizi
          </div>
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <span className="hidden sm:block text-gray-600 dark:text-gray-400 font-medium">23 Haziran 2025, Pazartesi</span>
            <div className="flex space-x-1">
              <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold">TR</span>
              <span className="text-gray-600 dark:text-gray-400 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">EN</span>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              <a href="#" className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <Rss className="h-4 w-4" />
              </a>
              <a href="#" className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <img 
                  src="https://raw.githubusercontent.com/SovrynMatt/Nostr-Website-Button-Design/main/nostr-icon-purple-256x256.png" 
                  alt="Nostr"
                  className="h-4 w-4"
                />
              </a>
              <a href="#" className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <X className="h-4 w-4" />
              </a>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
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
                className="h-8 sm:h-10 block dark:hidden"
                style={{ width: 'auto' }}
              />
              {/* Dark mode logo */}
              <img 
                src="/lovable-uploads/028135f1-856a-4e86-a719-a75eca32fa2a.png" 
                alt="Bitcoin News"
                className="h-8 sm:h-10 hidden dark:block"
                style={{ width: 'auto' }}
              />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#" className="text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors border-b-2 border-red-600 pb-1">Ana Sayfa</a>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Haberler
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Son Dakika</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Piyasa Analizi</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Teknoloji</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Düzenlemeler</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Köşe Yazıları
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Güncel Yorumlar</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Teknik Analiz</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Ekonomi</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Teknoloji</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Eğitim
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Bitcoin Temelleri</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Cüzdan Kullanımı</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Güvenlik</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800">Lightning Network</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a href="#" className="text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors">Podcast</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-red-600 dark:focus:border-red-400 w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm transition-colors"
              />
            </div>

            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white dark:bg-gray-900">
                <div className="flex flex-col space-y-6 mt-6">
                  <a href="#" className="text-gray-700 dark:text-gray-300 font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Ana Sayfa</a>
                  
                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Haberler</h3>
                    <div className="pl-4 space-y-2">
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Son Dakika</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Piyasa Analizi</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Teknoloji</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Düzenlemeler</a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Köşe Yazıları</h3>
                    <div className="pl-4 space-y-2">
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Güncel Yorumlar</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Teknik Analiz</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Ekonomi</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Teknoloji</a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Eğitim</h3>
                    <div className="pl-4 space-y-2">
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Bitcoin Temelleri</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Cüzdan Kullanımı</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Güvenlik</a>
                      <a href="#" className="block text-gray-600 dark:text-gray-400">Lightning Network</a>
                    </div>
                  </div>

                  <a href="#" className="text-gray-700 dark:text-gray-300 font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Podcast</a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-red-600 dark:focus:border-red-400 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm transition-colors"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
