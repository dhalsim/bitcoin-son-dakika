import { Outlet, Links, Meta, Scripts, isRouteErrorResponse } from "react-router";
import type { MetaFunction, LinksFunction } from "react-router";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { SSGProvider } from "./contexts/SSGContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { NostrAuthProvider } from "./contexts/NostrAuthContext";

import "./index.css";

// Global meta function - Sets fallback/default meta tags for all pages
// Page-specific meta tags (like in podcast-detail.tsx) will override these
export const meta: MetaFunction = () => {
  const title = "Bitcoin Son Dakika - Güncel Bitcoin Haberleri";
  const description =
    "Bitcoin dünyasından son dakika haberleri, güncel gelişmeler, analizler ve uzman yorumları";
  const siteName = "Bitcoin Son Dakika";
  const siteUrl = "https://www.bitcoinsondakika.com";
  const imageUrl = `${siteUrl}/bitcoin-son-dakika-logo.png`;

  return [
    // Browser tab title - This will be overridden by page-specific meta tags
    { title },

    // Meta description - This will be overridden by page-specific meta tags
    { name: "description", content: description },

    // Keywords - This can stay as a fallback
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin haberleri, bitcoin son dakika, kripto para, nostr, bitcoin analiz, bitcoin piyasa, bitcoin teknoloji, bitcoin ekonomi, bitcoin regülasyon, bitcoin güvenlik, bitcoin eğitim, bitcoin geliştirme, lightning network, bitcoin mining, bitcoin madenciliği, bitcoin podcast",
    },

    // Open Graph - Only set non-conflicting properties
    { property: "og:site_name", content: siteName },
    { property: "og:type", content: "website" },
    { property: "og:image", content: imageUrl },
    { property: "og:url", content: siteUrl },

    // Twitter Card - Only set non-conflicting properties
    { name: "twitter:site", content: "bitcoinsondakika.com" },
    { name: "twitter:image", content: imageUrl },

    // Note: We DON'T set og:title, og:description, twitter:title, twitter:description
    // These will be set by page-specific meta tags to avoid conflicts
  ];
};

export const links: LinksFunction = () => {
  return [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    {
      rel: "manifest",
      href: "/site.webmanifest",
    },
  ];
};

export default function Root() {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <TooltipProvider>
          <SSGProvider>
            <NostrAuthProvider>
              <UserProvider>
                <ThemeProvider>
                  <Toaster />
                  <Outlet />
                </ThemeProvider>
              </UserProvider>
            </NostrAuthProvider>
          </SSGProvider>
        </TooltipProvider>
        {/* SSG Data Injection */}
        {typeof global !== "undefined" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.__SSG_DATA__ = ${(global as any).__SSG_DATA_HTML__ || "null"};
              console.log("SSG Data Injection - window.__SSG_DATA__:", window.__SSG_DATA__);
              `,
            }}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
