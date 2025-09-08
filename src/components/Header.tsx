import { Search, Menu, Moon, Sun, Rss, Atom, ChevronDown, Mic } from "lucide-react";
import React, { useState } from "react";

import { links } from "@/lib/utils";

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

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Function to copy URL to clipboard
  const copyToClipboard = async (url: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;

    if (!target) {
      console.error("Target not found");

      return;
    }

    try {
      // Focus the button first to ensure document is focused
      target.focus();

      // Try modern clipboard API first
      await navigator.clipboard.writeText(url);
    } catch (error) {
      // Fallback for older browsers or when clipboard API fails
      try {
        const textArea = document.createElement("textarea");

        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);
      } catch (fallbackError) {
        console.error("Failed to copy to clipboard:", fallbackError);

        return; // Don't show tooltip if copy failed
      }
    }

    // Show tooltip after successful copy
    const tooltip = target.querySelector(".tooltip");

    if (tooltip) {
      tooltip.classList.remove("hidden");
      tooltip.classList.add("block");
    }

    setTimeout(() => {
      if (tooltip) {
        tooltip.classList.remove("block");
        tooltip.classList.add("hidden");
      }
    }, 2000);
  };

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
        <div className="flex items-center py-2 border-b border-border">
          <div className="text-xs sm:text-sm text-muted-foreground truncate flex-shrink-0 max-w-[200px] sm:max-w-[300px]">
            Bitcoinci Perspektiften Dünyanın Nabzı
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm ml-auto flex-shrink-0">
            <span className="hidden md:block text-muted-foreground">
              {getCurrentDateInTurkish()}
            </span>

            {/* Social Links */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <a
                href="https://njump.me/_@bitcoinsondakika.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              >
                <img src="/nostr-icon.png" alt="Nostr" className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://x.com/sondakikabtc"
                target="_blank"
                rel="noopener noreferrer"
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
              <button
                onClick={(e) => copyToClipboard(window.location.origin + "/feed/atom.xml", e)}
                className="relative p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer"
                title="Atom feed kopyala"
              >
                <Atom className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />

                <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                  <div className="text-center">
                    Atom feed kopyalandı
                    <br />
                    <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
              <button
                onClick={(e) => copyToClipboard(window.location.origin + "/feed/rss.xml", e)}
                className="relative p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer"
                title="RSS feed kopyala"
              >
                <Rss className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                  <div className="text-center">
                    RSS feed kopyalandı
                    <br />
                    <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
              <button
                onClick={(e) =>
                  copyToClipboard(window.location.origin + "/feed/podcast-rss.xml", e)
                }
                className="relative p-1 rounded-md hover:bg-accent hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 cursor-pointer"
                title="Podcast feed kopyala"
              >
                <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                  <div className="text-center">
                    Podcast feed kopyalandı
                    <br />
                    <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
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
          {/* Logo */}
          <div
            className={`flex items-center space-x-4 sm:space-x-8 mr-2 transition-all duration-300 ${isSearchOpen ? "lg:hidden" : ""}`}
          >
            <a href="/" className="flex items-center flex-shrink-0">
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

          {/* Desktop Navigation - visible on lg and above */}
          <nav className="hidden lg:flex items-center space-x-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                <a href={links.news}>Haberler</a>
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border">
                <DropdownMenuItem>
                  <a href={links.news}>Son Dakika</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("analiz", "news")}>Piyasa Analizi</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("teknoloji", "news")}>Teknoloji</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("duzenlemeler", "news")}>Düzenlemeler</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                <a href={links.articles}>Köşe Yazıları</a>
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border">
                <DropdownMenuItem>
                  <a href={links.tag("yorum", "article")}>Güncel Yorumlar</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("analiz", "article")}>Teknik Analiz</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("ekonomi", "article")}>Ekonomi</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.tag("teknoloji", "article")}>Teknoloji</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a href={links.podcasts} className="text-foreground font-medium px-2 py-1 rounded">
              Podcast
            </a>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-foreground font-medium px-2 py-1 rounded">
                <a href={links.educations}>Eğitim</a>
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border">
                <DropdownMenuItem>
                  <a href={links.educationDetail("bitcoin-temelleri")}>Bitcoin Temelleri</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.educationDetail("cuzdan-kullanimi")}>Cüzdan Kullanımı</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.educationDetail("guvenlik")}>Güvenlik</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={links.educationDetail("lightning-network")}>Lightning Network</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Search Bar - visible on lg and above */}
          <div className="hidden lg:flex items-center space-x-6 relative z-header">
            {/* Desktop Search */}
            <SearchBar />
          </div>

          {/* Right Side Elements - always visible */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* UserMenu - always visible */}
            <div className="flex mr-2">
              <UserMenu />
            </div>

            {/* Mobile Search - visible below lg */}
            <div className="lg:hidden flex items-center whitespace-nowrap">
              {isSearchOpen && (
                <div className="mr-2">
                  <SearchBar />
                </div>
              )}

              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Mobile Menu - visible below lg */}
            <div className="p-1 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 p-2 rounded">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 text-left-menu bg-left-menu border-left-menu overflow-y-auto"
                >
                  <div className="flex flex-col space-y-6 mt-6">
                    <a href="/" className="font-medium text-lg pb-2">
                      Ana Sayfa
                    </a>

                    <div className="space-y-4">
                      <h3 className="text-left-menu-primary font-semibold">
                        <a href={links.news}>Haberler</a>
                      </h3>
                      <div className="pl-4 space-y-2">
                        <a href={links.news} className="block text-left-menu-accent">
                          Son Dakika
                        </a>
                        <a
                          href={links.tag("analiz", "news")}
                          className="block text-left-menu-accent"
                        >
                          Piyasa Analizi
                        </a>
                        <a
                          href={links.tag("teknoloji", "news")}
                          className="block text-left-menu-accent"
                        >
                          Teknoloji
                        </a>
                        <a
                          href={links.tag("duzenlemeler", "news")}
                          className="block text-left-menu-accent"
                        >
                          Düzenlemeler
                        </a>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-left-menu-primary font-semibold">
                        <a href={links.articles}>Köşe Yazıları</a>
                      </h3>
                      <div className="pl-4 space-y-2">
                        <a
                          href={links.tag("yorum", "article")}
                          className="block text-left-menu-accent"
                        >
                          Güncel Yorumlar
                        </a>
                        <a
                          href={links.tag("analiz", "article")}
                          className="block text-left-menu-accent"
                        >
                          Teknik Analiz
                        </a>
                        <a
                          href={links.tag("ekonomi", "article")}
                          className="block text-left-menu-accent"
                        >
                          Ekonomi
                        </a>
                        <a
                          href={links.tag("teknoloji", "article")}
                          className="block text-left-menu-accent"
                        >
                          Teknoloji
                        </a>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-left-menu-primary font-semibold">
                        <a href={links.podcasts}>Podcast</a>
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-left-menu-primary font-semibold">
                        <a href={links.educations}>Eğitim</a>
                      </h3>
                      <div className="pl-4 space-y-2">
                        <a
                          href={links.educationDetail("bitcoin-temelleri")}
                          className="block text-left-menu-accent"
                        >
                          Bitcoin Temelleri
                        </a>
                        <a
                          href={links.educationDetail("cuzdan-kullanimi")}
                          className="block text-left-menu-accent"
                        >
                          Cüzdan Kullanımı
                        </a>
                        <a
                          href={links.educationDetail("guvenlik")}
                          className="block text-left-menu-accent"
                        >
                          Güvenlik
                        </a>
                        <a
                          href={links.educationDetail("lightning-network")}
                          className="block text-left-menu-accent"
                        >
                          Lightning Network
                        </a>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
