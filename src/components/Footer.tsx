import React from "react";

import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

const Footer = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                  href="/news"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Haberler
                </a>
              </li>
              <li>
                <a
                  href="/articles"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Köşe Yazıları
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Eğitim
                </a>
              </li>
              <li>
                <a
                  href="/podcasts"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Podcast
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Hakkımızda</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Biz Kimiz
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  İletişim
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Gizlilik Politikası
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Kullanım Şartları
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Takip Edin</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/feed/podcast-rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Podcast RSS Feed
                </a>
              </li>
              <li>
                <a
                  href="/feed/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  RSS Feed
                </a>
              </li>
              <li>
                <a
                  href="/feed/atom.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Atom Feed
                </a>
              </li>
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
                <a
                  href="#"
                  className="text-muted-foreground hover:text-main-accent transition-colors"
                >
                  Newsletter
                </a>
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
