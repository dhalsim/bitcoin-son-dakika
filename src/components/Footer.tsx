import { links } from "@/lib/utils";

import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

const Footer = () => {
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
    <footer className="bg-card text-card-foreground mt-12 border-t border-border relative">
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

      <div className="container mx-auto px-4 py-8 relative z-content">
        <div className="grid grid-cols-1 [@media(min-width:455px)]:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/beyaz-logo-yazisi.png"
                alt="Bitcoin News"
                className="h-8"
                style={{ width: "64px", height: "24px" }}
              />
            </div>
            <p className="text-muted-foreground text-sm">{WEBSITE_DESCRIPTION}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Kategoriler</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={links.news}
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Haberler
                </a>
              </li>
              <li>
                <a
                  href={links.articles}
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Köşe Yazıları
                </a>
              </li>
              <li>
                <a
                  href={links.podcasts}
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Podcast
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Takip Edin</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://njump.me/_@bitcoinsondakika.com"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Nostr
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/sondakikabtc"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <button
                  onClick={(e) =>
                    copyToClipboard(window.location.origin + "/feed/podcast-rss.xml", e)
                  }
                  className="relative text-muted-foreground hover:text-main-accent transition-colors cursor-pointer"
                  title="Podcast RSS Feed kopyala"
                >
                  Podcast RSS Feed
                  <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                    <div className="text-center">
                      Podcast feed kopyalandı
                      <br />
                      <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => copyToClipboard(window.location.origin + "/feed/rss.xml", e)}
                  className="relative text-muted-foreground hover:text-main-accent transition-colors cursor-pointer"
                  title="RSS Feed kopyala"
                >
                  RSS Feed
                  <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                    <div className="text-center">
                      RSS feed kopyalandı
                      <br />
                      <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => copyToClipboard(window.location.origin + "/feed/atom.xml", e)}
                  className="relative text-muted-foreground hover:text-main-accent transition-colors cursor-pointer"
                  title="Atom Feed kopyala"
                >
                  Atom Feed
                  <div className="tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs sm:max-w-sm hidden z-tooltip">
                    <div className="text-center">
                      Atom feed kopyalandı
                      <br />
                      <span className="text-gray-300">RSS okuyucunuza yapıştırabilirsiniz</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 {WEBSITE_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
