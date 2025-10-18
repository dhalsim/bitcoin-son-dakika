import { useState } from "react";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type ImageSelectorProps = {
  images: string[];
  selectedImage: string;
  onImageSelect: (url: string) => void;
  label?: string;
  className?: string;
};

export default function ImageSelector({
  images,
  selectedImage,
  onImageSelect,
  label = "Görsel Seç",
  className = "",
}: ImageSelectorProps) {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (url: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  const handleImageError = (url: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
    setFailedImages((prev) => new Set(prev).add(url));
  };

  const handleImageClick = (url: string) => {
    if (!failedImages.has(url)) {
      onImageSelect(url);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-base font-medium">{label}</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {images.map((url, index) => {
          const isLoading = loadingImages.has(url);
          const isFailed = failedImages.has(url);
          const isSelected = selectedImage === url;

          return (
            <Card
              key={index}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? "ring-2 ring-blue-500 shadow-md" : ""
              } ${isFailed ? "opacity-50" : ""}`}
              onClick={() => handleImageClick(url)}
            >
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}

                  {isFailed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                      <X className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center">Yüklenemedi</span>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Görsel ${index + 1}`}
                      className={`w-full h-full object-cover transition-opacity duration-200 ${
                        isLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => handleImageLoad(url)}
                      onError={() => handleImageError(url)}
                      loading="lazy"
                    />
                  )}

                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <div className="bg-blue-500 rounded-full p-1">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">
                    {isFailed ? "Hata" : isSelected ? "Seçili" : "Seç"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedImage && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Seçilen görsel:</span>
          </div>
          <div className="text-xs text-green-600 mt-1 break-all">{selectedImage}</div>
        </div>
      )}
    </div>
  );
}
