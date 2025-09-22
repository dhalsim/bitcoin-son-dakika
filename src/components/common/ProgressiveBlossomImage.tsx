import { useState, useEffect } from "react";
import { BlurhashCanvas } from "react-blurhash";

interface ProgressiveBlossomImageProps {
  sha256: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading: "lazy" | "eager" | null;
  decoding: "async" | "sync" | "auto" | null;
  fallbackUrl: string | null;
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
  fallbackUrl,
  onLoad,
  onError,
}: ProgressiveBlossomImageProps) {
  const [metadata, setMetadata] = useState<BlurHashMetadata | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Fetch BlurHash metadata via HEAD request
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/file/${sha256}`, {
          method: "HEAD",
          cache: "force-cache", // Use cached metadata when available
        });

        if (response.ok) {
          const blurhash = response.headers.get("X-BlurHash");
          const widthHeader = response.headers.get("X-Width");
          const heightHeader = response.headers.get("X-Height");
          const contentType =
            response.headers.get("X-Content-Type") || response.headers.get("Content-Type");

          if (blurhash && widthHeader && heightHeader) {
            setMetadata({
              blurhash,
              width: parseInt(widthHeader),
              height: parseInt(heightHeader),
              contentType: contentType || "image/webp",
            });
          }
        }
      } catch (error) {
        console.warn("Failed to fetch BlurHash metadata:", error);
      } finally {
        setMetadataLoaded(true);
      }
    };

    fetchMetadata();
  }, [sha256]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setUseFallback(false);
    onLoad?.();
  };

  const handleImageError = () => {
    if (!useFallback && fallbackUrl) {
      setUseFallback(true);
      setImageError(false);
    } else {
      setImageError(true);
      onError?.();
    }
  };

  // Calculate aspect ratio for placeholder
  const aspectRatio = metadata ? metadata.width / metadata.height : 1;
  const placeholderWidth = width || (height ? height * aspectRatio : 300);
  const placeholderHeight = height || (width ? width / aspectRatio : 200);

  // Determine image source
  const imageSrc = useFallback && fallbackUrl ? fallbackUrl : `/api/file/${sha256}`;

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      {/* BlurHash placeholder */}
      {metadata && !imageLoaded && !imageError && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            width: placeholderWidth,
            height: placeholderHeight,
          }}
        >
          <BlurhashCanvas
            hash={metadata.blurhash}
            width={placeholderWidth}
            height={placeholderHeight}
            punch={1}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actual image */}
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
            width: placeholderWidth,
            height: placeholderHeight,
          }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      {/* Loading fallback (when no BlurHash available) */}
      {metadataLoaded && !metadata && !imageLoaded && !imageError && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400"
          style={{
            width: placeholderWidth,
            height: placeholderHeight,
          }}
        >
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}
