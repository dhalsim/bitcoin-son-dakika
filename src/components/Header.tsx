import { Search, Menu, Moon, Sun, Rss, Atom, X, ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { useTheme } from "../contexts/ThemeContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { UserMenu } from "./UserMenu";
import { SearchBar } from "./SearchBar";

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

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="shadow-md relative z-header">
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

      <div className="container mx-auto px-4 relative z-content">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="text-xs sm:text-sm text-muted-foreground truncate">
            Bitcoinci Perspektiften Dünyanın Nabzı
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
            <span className="hidden sm:block text-muted-foreground">
              {getCurrentDateInTurkish()}
            </span>

            {/* Social Links */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <a
                href="https://njump.me/_@bitcoinsondakika.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-accent hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              >
                <img src="/nostr-icon.png" alt="Nostr" className="h-6 w-6" />
              </a>
              <a
                href="https://x.com/bitcoin_son_dk"
                className="p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground"
                  viewBox="0 0 16 16"
                >
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                </svg>
              </a>
              <a
                href="/feed/atom.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
              >
                <Atom className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </a>
              <a
                href="/feed/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
              >
                <Rss className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </a>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300"
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              ) : (
                <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <a href="/" className="flex items-center">
              {/* Light mode logo (black) */}
              {theme === "light" ? (
                <img
                  src="/siyah-logo-yazisi.png"
                  alt="Bitcoin News"
                  className="h-8 sm:h-12"
                  style={{ width: "auto" }}
                />
              ) : (
                <img
                  src="/beyaz-logo-yazisi.png"
                  alt="Bitcoin News"
                  className="h-8 sm:h-12"
                  style={{ width: "auto" }}
                />
              )}
            </a>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:flex items-center space-x-6 relative z-header">
            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-foreground font-medium px-2 py-1 rounded">
                Ana Sayfa
              </a>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                  <a href="/news">Haberler</a>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border border-border">
                  <DropdownMenuItem>
                    <a href="/news">Son Dakika</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/analiz?type=news">Piyasa Analizi</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/teknoloji?type=news">Teknoloji</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/duzenlemeler?type=news">Düzenlemeler</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                  <a href="/articles">Köşe Yazıları</a>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border border-border">
                  <DropdownMenuItem>
                    <a href="/tag/yorum?type=article">Güncel Yorumlar</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/analiz?type=article">Teknik Analiz</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/ekonomi?type=article">Ekonomi</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/tag/teknoloji?type=article">Teknoloji</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                  <a href="/egitim">Eğitim</a>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border border-border">
                  <DropdownMenuItem>
                    <a href="/egitim/bitcoin-temelleri">Bitcoin Temelleri</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/egitim/cuzdan-kullanimi">Cüzdan Kullanımı</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/egitim/guvenlik">Güvenlik</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/egitim/lightning-network">Lightning Network</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a href="/podcast" className="text-foreground font-medium px-2 py-1 rounded">
                Podcast
              </a>
            </nav>

            {/* Desktop Search */}
            <SearchBar />

            {/* User Menu */}
            <UserMenu />
          </div>

          {/* Mobile View */}
          <div className="lg:hidden flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
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
                className="w-80 text-left-menu bg-left-menu border-left-menu"
              >
                <div className="flex flex-col space-y-6 mt-6">
                  <a href="/" className="font-medium text-lg pb-2">
                    Ana Sayfa
                  </a>

                  <div className="space-y-4">
                    <h3 className="text-left-menu-primary font-semibold">
                      <a href="/news">Haberler</a>
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a href="/news" className="block text-left-menu-accent">
                        Son Dakika
                      </a>
                      <a href="/tag/analiz?type=news" className="block text-left-menu-accent">
                        Piyasa Analizi
                      </a>
                      <a href="/tag/teknoloji?type=news" className="block text-left-menu-accent">
                        Teknoloji
                      </a>
                      <a href="/tag/duzenlemeler?type=news" className="block text-left-menu-accent">
                        Düzenlemeler
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-left-menu-primary font-semibold">
                      <a href="/articles">Köşe Yazıları</a>
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a href="/articles" className="block text-left-menu-accent">
                        Güncel Yorumlar
                      </a>
                      <a href="/tag/analiz?type=article" className="block text-left-menu-accent">
                        Teknik Analiz
                      </a>
                      <a href="/tag/ekonomi?type=article" className="block text-left-menu-accent">
                        Ekonomi
                      </a>
                      <a href="/tag/teknoloji?type=article" className="block text-left-menu-accent">
                        Teknoloji
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-left-menu-primary font-semibold">
                      <a href="/egitim">Eğitim</a>
                    </h3>
                    <div className="pl-4 space-y-2">
                      <a href="/egitim/bitcoin-temelleri" className="block text-left-menu-accent">
                        Bitcoin Temelleri
                      </a>
                      <a href="/egitim/cuzdan-kullanimi" className="block text-left-menu-accent">
                        Cüzdan Kullanımı
                      </a>
                      <a href="/egitim/guvenlik" className="block text-left-menu-accent">
                        Güvenlik
                      </a>
                      <a href="/egitim/lightning-network" className="block text-left-menu-accent">
                        Lightning Network
                      </a>
                    </div>
                  </div>

                  <a href="/podcast" className="text-left-menu-accent">
                    Podcast
                  </a>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Search Bar */}
            {isSearchOpen && (
              <div className="md:hidden pb-4 relative z-header">
                <SearchBar />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
