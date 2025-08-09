// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

import { useTheme } from "@/contexts/ThemeContext";

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) {
      return;
    }

    // Clean up any existing script
    if (scriptRef.current) {
      currentContainer.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // Clear the container
    currentContainer.innerHTML = "";

    console.log("theme", theme);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
    {
      "allow_symbol_change": false,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": true,
      "hide_legend": true,
      "hide_volume": false,
      "hotlist": false,
      "interval": "W",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": "${symbol}",
      "theme": "${theme}",
      "timezone": "Etc/UTC",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(242, 242, 242, 0.06)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "studies": [],
      "autosize": true
    }`;

    scriptRef.current = script;
    currentContainer.appendChild(script);

    // Cleanup function
    return () => {
      if (currentContainer && scriptRef.current) {
        try {
          currentContainer.removeChild(scriptRef.current);
        } catch (_) {
          // Script might have been removed already
        }

        scriptRef.current = null;
      }
    };
  }, [symbol, theme]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%" }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
