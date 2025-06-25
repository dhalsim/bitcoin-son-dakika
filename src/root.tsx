import React from "react";
import { Outlet, Links, Meta, Scripts } from "react-router";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import type { MetaFunction, LinksFunction } from "react-router";
import "./index.css";

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
      href: "https://cdn.jsdelivr.net/npm/window.nostr.js/dist/window.nostr.min.js",
      as: "script",
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
        <script src="https://cdn.jsdelivr.net/npm/window.nostr.js/dist/window.nostr.min.js"></script>
        <Scripts />
      </body>
    </html>
  );
} 