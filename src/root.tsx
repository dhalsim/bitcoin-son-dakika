import { Outlet, Links, Meta, Scripts, isRouteErrorResponse } from "react-router";
import type { MetaFunction, LinksFunction } from "react-router";

import turkishWindowNostrJs from "@/i18n/tr.json";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { SSGProvider } from "./contexts/SSGContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";

import "./index.css";

export const meta: MetaFunction = () => {
  const title = "Bitcoin Son Dakika - Güncel Bitcoin Haberleri";
  const description =
    "Bitcoin dünyasından son dakika haberleri, güncel gelişmeler, analizler ve uzman yorumları";
  const siteName = "Bitcoin Son Dakika";
  const siteUrl = "https://www.bitcoinsondakika.com";
  const imageUrl = `${siteUrl}/bitcoin-son-dakika-logo.png`;

  return [
    { title },
    { name: "description", content: description },
    // Open Graph
    { property: "og:site_name", content: siteName },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:url", content: siteUrl },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
};

export const links: LinksFunction = () => {
  return [
    {
      rel: "preload",
      href: "/window.nostr.js",
      as: "script",
    },
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
            <UserProvider>
              <ThemeProvider>
                <Toaster />
                <Outlet />
              </ThemeProvider>
            </UserProvider>
          </SSGProvider>
        </TooltipProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.wnjParams = { 
              texts: ${JSON.stringify(turkishWindowNostrJs)},
              position: 'bottom',
              startHidden: true,
              compactMode: true,
              nstartMeLanguage: 'tr',
            };`,
          }}
        />
        <script src="/window.nostr.js"></script>
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
