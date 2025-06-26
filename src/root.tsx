import React from "react";
import { Outlet, Links, Meta, Scripts } from "react-router";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import type { MetaFunction, LinksFunction } from "react-router";
import "./index.css";
import turkishWindowNostrJs from "@/i18n/tr.json";

export const meta: MetaFunction = () => {
  return [
    { title: "Bitcoin Son Dakika - Güncel Bitcoin Haberleri" },
    { name: "description", content: "Bitcoin ve kripto para dünyasından son dakika haberler, güncel gelişmeler ve analizler." },
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
        <Meta />
        <Links />
      </head>
      <body>
        <TooltipProvider>
          <Toaster />
          <Outlet />
        </TooltipProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.wnjParams = { 
              texts: ${JSON.stringify(turkishWindowNostrJs)},
              position: 'bottom',
              startHidden: true,
              compactMode: true,
              nstartMeLanguage: 'tr',
            };`
          }}
        />
        <script src="/window.nostr.js"></script>
        <Scripts />
      </body>
    </html>
  );
} 