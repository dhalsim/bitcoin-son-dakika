import { useState, useEffect } from "react";
import { BlurhashCanvas } from "react-blurhash";

import { WEBSITE_URL } from "@/lib/constants";

interface ProgressiveBlossomImageProps {
  sha256: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading: "lazy" | "eager" | null;
  decoding: "async" | "sync" | "auto" | null;
  onLoad?: () => void;
  onError?: () => void;
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
  width,
  height,
  loading,
  decoding,
  onLoad,
  onError,
}: ProgressiveBlossomImageProps) {
  const [metadata, setMetadata] = useState<BlurHashMetadata | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  // Fetch BlurHash metadata via HEAD request
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const apiUrl = `${WEBSITE_URL}/api/file/${sha256}`;
        console.log("Making HEAD request to:", apiUrl);

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

            console.log("BlurHash metadata loaded:", {
              blurhash,
              width: parsedWidth,
              height: parsedHeight,
              contentType: contentType || "image/webp",
              isValidBlurHash,
              blurhashLength: blurhash.length,
            });

            if (isValidBlurHash && parsedWidth > 0 && parsedHeight > 0) {
              setMetadata({
                blurhash,
                width: parsedWidth,
                height: parsedHeight,
                contentType: contentType || "image/webp",
              });
            } else {
              console.warn("Invalid BlurHash metadata:", {
                isValidBlurHash,
                width: parsedWidth,
                height: parsedHeight,
              });
            }
          } else {
            console.log("Missing BlurHash metadata:", {
              blurhash: !!blurhash,
              widthHeader: !!widthHeader,
              heightHeader: !!heightHeader,
            });
          }
        } else {
          console.log("HEAD request failed:", response.status, response.statusText);
        }
      } catch (error) {
        console.warn("Failed to fetch BlurHash metadata:", error);
      } finally {
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

  // Calculate dimensions maintaining original aspect ratio
  const aspectRatio = metadata ? metadata.width / metadata.height : 1;

  let canvasWidth, canvasHeight;

  if (width && height) {
    // Both dimensions provided - use them but ensure aspect ratio is maintained
    const providedRatio = width / height;
    if (Math.abs(providedRatio - aspectRatio) > 0.1) {
      // Aspect ratios don't match, scale to fit
      if (providedRatio > aspectRatio) {
        canvasWidth = Math.floor(height * aspectRatio);
        canvasHeight = height;
      } else {
        canvasWidth = width;
        canvasHeight = Math.floor(width / aspectRatio);
      }
    } else {
      canvasWidth = width;
      canvasHeight = height;
    }
  } else if (width) {
    // Only width provided - calculate height based on original aspect ratio
    canvasWidth = width;
    canvasHeight = Math.floor(width / aspectRatio);
  } else if (height) {
    // Only height provided - calculate width based on original aspect ratio
    canvasWidth = Math.floor(height * aspectRatio);
    canvasHeight = height;
  } else {
    // No dimensions provided - use defaults maintaining aspect ratio
    canvasWidth = 300;
    canvasHeight = Math.floor(300 / aspectRatio);
  }

  // Always use the API endpoint - no fallback URL switching
  const imageSrc = `${WEBSITE_URL}/api/file/${sha256}`;

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      {/* BlurHash placeholder - only show while image is loading */}
      {metadata && !imageLoaded && !imageError && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
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
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        } ${width && height ? "w-full h-full object-cover" : ""}`}
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
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
