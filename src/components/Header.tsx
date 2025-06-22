
import React from 'react';
import { Search, Menu, Moon, Sun, Rss } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-black shadow-md">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Son Dakika Haberleri
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">22 Haziran 2025, Pazar</span>
            
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#F7931A] transition-colors">
                <Rss className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#F7931A] transition-colors">
                <span className="text-sm font-bold">N</span>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#F7931A] transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
            
            <div className="flex space-x-2">
              <span className="bg-[#F7931A] text-white px-2 py-1 rounded text-xs">TR</span>
              <span className="text-gray-600 dark:text-gray-400 px-2 py-1 text-xs">EN</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <img 
                src="/lovable-uploads/fddd24f6-1e9e-421b-b423-49e885a5214a.png" 
                alt="Bitcoin News"
                className="h-10 w-auto"
              />
            </div>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-[#F7931A] font-medium transition-colors">Ana Sayfa</a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-[#F7931A] font-medium transition-colors">Haberler</a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-[#F7931A] font-medium transition-colors">Köşe Yazıları</a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-[#F7931A] font-medium transition-colors">Eğitim</a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-[#F7931A] font-medium transition-colors">Podcast</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Haber ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#F7931A] w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button className="lg:hidden">
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
