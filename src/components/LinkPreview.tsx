import { ExternalLink, Globe } from "lucide-react";
import { useState, useEffect } from "react";

import { Card, CardContent } from "./ui/card";

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  site_name?: string;
  type?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
  showFallback?: boolean;
}

export function LinkPreview({
  url,
  className = "",
  showFallback = true,
}: LinkPreviewProps) {
  const [ogData, setOgData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchOGData() {
      try {
        setLoading(true);
        setError(false);

        // Use microlink.io API for OG data - it's free and handles CORS
        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&video=false`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "success" && result.data) {
          const data = result.data;
          const ogData: OpenGraphData = {
            title: data.title,
            description: data.description,
            image: data.image?.url,
            url: data.url || url,
            site_name: data.publisher,
            type: "website",
          };

          if (mounted) {
            setOgData(ogData);
          }
        } else {
          throw new Error("Failed to fetch OG data");
        }
      } catch (err) {
        console.error("Error fetching OG data:", err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOGData();

    return () => {
      mounted = false;
    };
  }, [url]);

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Show fallback link if error or showFallback is false
  if (error || !showFallback) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline inline-flex items-center gap-1"
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow animate-pulse ${className}`}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rich preview
  const domain = new URL(url).hostname;
  const hasImage = ogData?.image && ogData.image.trim() !== "";
  const title = ogData?.title || domain;
  const description = ogData?.description;
  const siteName = ogData?.site_name;

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700 ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Preview Image */}
          {hasImage ? (
            <div className="w-16 h-12 flex-shrink-0 overflow-hidden rounded">
              <img
                src={ogData.image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-12 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
              <Globe className="h-6 w-6 text-gray-400" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                {title}
              </h4>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
            </div>

            {description && (
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {description}
              </div>
            )}

            <div className="flex items-center gap-1 mt-1">
              {siteName && (
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {siteName}
                </span>
              )}
              {siteName && <span className="text-xs text-gray-400">•</span>}
              <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {domain}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
