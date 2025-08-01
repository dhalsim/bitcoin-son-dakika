// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

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

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
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
          "save_image": false,
          "style": "1",
          "symbol": "${symbol}",
          "theme": "light",
          "timezone": "Etc/UTC",
          "backgroundColor": "#ffffff",
          "gridColor": "rgba(46, 46, 46, 0.06)",
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
  }, [symbol]);

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
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
