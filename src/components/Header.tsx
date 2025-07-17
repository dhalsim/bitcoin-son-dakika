import { Search, Menu, Moon, Sun, Rss, X, ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { useTheme } from "../hooks/useTheme";

// Function to format current date in Turkish
const getCurrentDateInTurkish = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  };

  return now.toLocaleDateString("tr-TR", options);
};

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-black shadow-md relative">
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url(/arkaplan.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            Bitcoinci Perspektiften Dünyanın Nabzı
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
            <span className="hidden sm:block text-gray-600 dark:text-gray-400">
              {getCurrentDateInTurkish()}
            </span>
            <div className="flex space-x-1 sm:space-x-2">
              <span className="bg-[#F7931A] text-white px-1 sm:px-2 py-1 rounded text-xs">
                TR
              </span>
              <span className="text-gray-600 dark:text-gray-400 px-1 sm:px-2 py-1 text-xs">
                EN
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <a
                href="#"
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
              >
                <Rss className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </a>
              <a
                href="#"
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              >
                <img
                  src="https://raw.githubusercontent.com/SovrynMatt/Nostr-Website-Button-Design/main/nostr-icon-purple-256x256.png"
                  alt="Nostr"
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
              </a>
              <a
                href="#"
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </a>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300"
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center">
              {/* Light mode logo */}
              <img
                src="/siyah-logo-yazisi.png"
                alt="Bitcoin News"
                className="h-8 sm:h-12 block dark:hidden"
                style={{ width: "auto" }}
              />
              {/* Dark mode logo */}
              <img
                src="/beyaz-logo-yazisi.png"
                alt="Bitcoin News"
                className="h-8 sm:h-12 hidden dark:block"
                style={{ width: "auto" }}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <a
                href="#"
                className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded"
              >
                Ana Sayfa
              </a>

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

              <a
                href="#"
                className="text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 px-2 py-1 rounded"
              >
                Podcast
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Haber ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64 bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-all duration-300"
              />
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded"
            >
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="lg:hidden hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 bg-white dark:bg-black"
              >
                <div className="flex flex-col space-y-6 mt-6">
                  <a
                    href="#"
                    className="text-gray-700 dark:text-gray-300 font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2"
                  >
                    Ana Sayfa
                  </a>

                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">
                      Haberler
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Son Dakika
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Piyasa Analizi
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Teknoloji
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Düzenlemeler
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">
                      Köşe Yazıları
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Güncel Yorumlar
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Teknik Analiz
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Ekonomi
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Teknoloji
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-semibold">
                      Eğitim
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Bitcoin Temelleri
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Cüzdan Kullanımı
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Güvenlik
                      </a>
                      <a
                        href="#"
                        className="block text-gray-600 dark:text-gray-400"
                      >
                        Lightning Network
                      </a>
                    </div>
                  </div>

                  <a
                    href="#"
                    className="text-gray-700 dark:text-gray-300 font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2"
                  >
                    Podcast
                  </a>
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
                placeholder="Haber ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
