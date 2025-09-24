import { useState, useEffect, useMemo } from "react";
import { BlurhashCanvas } from "react-blurhash";

import { WEBSITE_URL } from "@/lib/constants";

interface ProgressiveBlossomImageProps {
  sha256: string;
  alt: string;
  className?: string;
  loading: "lazy" | "eager" | null;
  decoding: "async" | "sync" | "auto" | null;
  onLoad?: () => void;
  onError?: () => void;
  testBlurhash?: boolean; // Show BlurHash for testing purposes
}

interface BlurHashMetadata {
  blurhash: string;
  width: number;
  height: number;
  contentType: string;
}

export function ProgressiveBlossomImage({
  sha256,
  alt,
  className,
  loading,
  decoding,
  onLoad,
  onError,
  testBlurhash = false,
}: ProgressiveBlossomImageProps) {
  const [metadata, setMetadata] = useState<BlurHashMetadata | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false); // For testBlurhash mode

  const showBlurhash = useMemo(
    () => metadata && ((!imageLoaded && !imageError) || (testBlurhash && !showOriginal)),
    [metadata, imageLoaded, imageError, testBlurhash, showOriginal],
  );

  // Fetch BlurHash metadata via HEAD request
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await FetchMetadata({ sha256 });

        if (metadata) {
          setMetadata(metadata);
        }

        setMetadataLoaded(true);
      } catch (error) {
        console.error("Error fetching BlurHash metadata:", error);

        setMetadataLoaded(true);
      }
    };

    fetchMetadata();
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleImageClick = (imageSrc: string) => {
    console.log("Image clicked!", imageSrc);
  };

  const handleBlurhashClick = (e: React.MouseEvent) => {
    if (testBlurhash && imageLoaded) {
      e.stopPropagation();
      setShowOriginal(true);
    }
  };

  // Calculate dimensions maintaining original aspect ratio
  const aspectRatio = metadata ? metadata.width / metadata.height : 1;

  const canvasWidth = 200;
  const canvasHeight = Math.floor(200 / aspectRatio);

  // Always use the API endpoint - no fallback URL switching
  const imageSrc = `${WEBSITE_URL}/api/file/${sha256}`;

  // Debug logging removed

  return (
    <div className={`relative overflow-hidden inline-block ${className || ""}`}>
      {/* BlurHash placeholder - show while image is loading OR in testBlurhash mode (until clicked) */}
      {showBlurhash && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 z-10 ${
            testBlurhash && imageLoaded ? "cursor-pointer hover:opacity-80" : ""
          }`}
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
          onClick={handleBlurhashClick}
        >
          <BlurhashCanvas
            hash={metadata.blurhash}
            width={canvasWidth}
            height={canvasHeight}
            punch={1}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        width={canvasWidth}
        height={canvasHeight}
        loading={loading}
        decoding={decoding}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={() => handleImageClick(imageSrc)}
        className={`transition-opacity duration-300 ${
          imageLoaded && (!testBlurhash || showOriginal) ? "opacity-100" : "opacity-0"
        } ${canvasWidth && canvasHeight ? "w-full h-full object-cover" : ""}`}
        style={{
          width: canvasWidth ? `${canvasWidth}px` : undefined,
          height: canvasHeight ? `${canvasHeight}px` : undefined,
          pointerEvents: showBlurhash ? "none" : "auto",
        }}
      />

      {/* Error fallback */}
      {imageError && (
        <div
          className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      {/* Loading fallback (when no BlurHash available) */}
      {metadataLoaded && !metadata && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}

export async function FetchMetadata({
  sha256,
}: {
  sha256: string;
}): Promise<BlurHashMetadata | null> {
  try {
    const apiUrl = `${WEBSITE_URL}/api/file/${sha256}`;
    // request metadata

    const response = await fetch(apiUrl, {
      method: "HEAD",
    });

    if (response.ok) {
      const blurhash = response.headers.get("X-Blurhash");
      const widthHeader = response.headers.get("X-Width");
      const heightHeader = response.headers.get("X-Height");
      const contentType =
        response.headers.get("X-Content-Type") || response.headers.get("Content-Type");

      if (blurhash && widthHeader && heightHeader) {
        const parsedWidth = parseInt(widthHeader);
        const parsedHeight = parseInt(heightHeader);

        // Validate BlurHash format (should be base83 string)
        const isValidBlurHash = /^[A-Za-z0-9#$%*+,\-.:;=?@[\]^_{|}~]+$/.test(blurhash);

        if (isValidBlurHash && parsedWidth > 0 && parsedHeight > 0) {
          return {
            blurhash,
            width: parsedWidth,
            height: parsedHeight,
            contentType: contentType || "image/webp",
          };
        }
      }
    }

    return null;
  } catch (error) {
    // swallow
    return null;
  }
}
