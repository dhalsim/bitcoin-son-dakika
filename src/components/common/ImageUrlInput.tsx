import { useState, useRef } from "react";
import {
  Upload,
  Link,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Settings,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BlobSelector } from "@/components/common/BlobSelector";
import { WEBSITE_URL } from "@/lib/constants";

interface MediaUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  blossomServers: string[];
  onUploadToBlossom?: (
    file: File,
    servers: string[],
    options: UploadOptions,
  ) => Promise<UploadResult>;
  onUploadUrlToBlossom?: (
    url: string,
    servers: string[],
    options: UploadOptions,
  ) => Promise<UploadResult>;
}

interface UploadOptions {
  optimize: boolean;
  generateBlurHash: boolean;
  format: "webp" | "avif" | "jpeg";
  quality: number;
  maxWidth: number | null;
}

interface UploadResult {
  successful: Array<{ server: string; descriptor: any }>;
  failed: Array<{ server: string; error: string }>;
  sha256: string;
  contentType: string;
  size: number;
  blurhash?: { blurhash: string; width: number; height: number };
}

interface CorsCheckResult {
  hasCors: boolean;
  error?: string;
}

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "text/plain": "txt",
  };

  return mimeMap[mimeType.toLowerCase()] || "";
}

// Optimization Settings Component
interface OptimizationSettingsProps {
  idPrefix: string;
  optimize: boolean;
  setOptimize: (value: boolean) => void;
  generateBlurHash: boolean;
  setGenerateBlurHash: (value: boolean) => void;
  format: "webp" | "avif" | "jpeg";
  setFormat: (value: "webp" | "avif" | "jpeg") => void;
  quality: number;
  setQuality: (value: number) => void;
  maxWidth: number | null;
  setMaxWidth: (value: number | null) => void;
}

function OptimizationSettings({
  idPrefix,
  optimize,
  setOptimize,
  generateBlurHash,
  setGenerateBlurHash,
  format,
  setFormat,
  quality,
  setQuality,
  maxWidth,
  setMaxWidth,
}: OptimizationSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${idPrefix}-optimize`}
          checked={optimize}
          onCheckedChange={(checked) => setOptimize(checked as boolean)}
        />
        <Label htmlFor={`${idPrefix}-optimize`}>Resmi optimize et</Label>
      </div>

      {optimize && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-format`}>Çıktı Formatı</Label>
            <Select
              value={format}
              onValueChange={(value: "webp" | "avif" | "jpeg") => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP (önerilen)</SelectItem>
                <SelectItem value="avif">AVIF (en iyi sıkıştırma)</SelectItem>
                <SelectItem value="jpeg">JPEG (uyumluluk)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-quality`}>Kalite: {quality}%</Label>
            <Slider
              id={`${idPrefix}-quality`}
              min={10}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={(value) => setQuality(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-maxWidth`}>
              Maksimum Genişlik: {maxWidth ? `${maxWidth}px` : "Orijinal"}
            </Label>
            <Slider
              id={`${idPrefix}-maxWidth`}
              min={320}
              max={4096}
              step={160}
              value={maxWidth ? [maxWidth] : [4096]}
              onValueChange={(value) => setMaxWidth(value[0] === 4096 ? null : value[0])}
              className="w-full"
            />
          </div>
        </>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${idPrefix}-generateBlurHash`}
          checked={generateBlurHash}
          onCheckedChange={(checked) => setGenerateBlurHash(checked as boolean)}
        />
        <Label htmlFor={`${idPrefix}-generateBlurHash`}>
          Aşamalı yükleme için BlurHash oluştur
        </Label>
      </div>
    </div>
  );
}

export function MediaUrlInput({
  value,
  onChange,
  label = "Medya URL'si",
  placeholder = "Medya URL'si girin veya dosya yükleyin",
  blossomServers,
  onUploadToBlossom,
  onUploadUrlToBlossom,
}: MediaUrlInputProps) {
  const [activeTab, setActiveTab] = useState<"url" | "file" | "select">("url");
  const [isCheckingCors, setIsCheckingCors] = useState(false);
  const [corsResult, setCorsResult] = useState<CorsCheckResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showOptimizationSettings, setShowOptimizationSettings] = useState(false);

  // Optimization settings
  const [optimize, setOptimize] = useState(true);
  const [generateBlurHash, setGenerateBlurHash] = useState(true);
  const [format, setFormat] = useState<"webp" | "avif" | "jpeg">("webp");
  const [quality, setQuality] = useState(82);
  const [maxWidth, setMaxWidth] = useState<number | null>(1920);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to determine if URL is a video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".avi"];
    const lowerUrl = url.toLowerCase();
    return (
      videoExtensions.some((ext) => lowerUrl.includes(ext)) ||
      lowerUrl.includes("video/") ||
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("youtu.be") ||
      lowerUrl.includes("vimeo.com")
    );
  };

  // Helper function to determine if current file is a video
  const isCurrentFileVideo = (): boolean => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      return file.type.startsWith("video/");
    }
    return isVideoUrl(value);
  };

  // Helper function to render media preview
  const renderMediaPreview = (url: string) => {
    if (isVideoUrl(url)) {
      return (
        <video
          src={url}
          className="h-20 w-20 object-cover rounded border"
          controls={false}
          muted
          onError={(e) => {
            (e.target as HTMLVideoElement).style.display = "none";
          }}
        />
      );
    } else {
      return (
        <img
          src={url}
          alt="Önizleme"
          className="h-20 w-20 object-cover rounded border"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
  };

  const checkCors = async (url: string): Promise<CorsCheckResult> => {
    try {
      // Try a CORS fetch - if it succeeds, CORS is properly configured
      // The browser will block the request before we even get a response if CORS is not allowed
      const response = await fetch(url, {
        method: "HEAD",
        mode: "cors",
      });

      if (!response.ok) {
        return {
          hasCors: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // If we got here, the fetch succeeded with CORS mode, which means CORS is working
      // The browser would have blocked it before we got a response if CORS wasn't allowed
      return {
        hasCors: true,
        error: undefined,
      };
    } catch (error) {
      // If the fetch fails, it's likely a CORS issue or network error
      if (error instanceof TypeError) {
        // Network errors and CORS errors both throw TypeError
        // Check if it's a CORS-related error
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("cors") ||
          errorMessage.includes("network") ||
          errorMessage.includes("failed to fetch")
        ) {
          return {
            hasCors: false,
            error: "CORS bulunamadı - Blossom'a yüklemeyi deneyiniz",
          };
        }
      }

      const genericErrorMessage = "CORS kontrolü başarısız";

      const errorMessage =
        error instanceof Error
          ? genericErrorMessage + ": " + error.message
          : typeof error === "string"
            ? genericErrorMessage + ": " + error
            : genericErrorMessage;

      return {
        hasCors: false,
        error: errorMessage,
      };
    }
  };

  const handleCorsCheck = async () => {
    if (!value) return;

    setIsCheckingCors(true);

    const result = await checkCors(value);

    setCorsResult(result);
    setIsCheckingCors(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      onChange(localUrl);
      setActiveTab("file");
    }
  };

  const handleUploadToBlossom = async () => {
    if (!onUploadToBlossom || selectedServers.size === 0) return;

    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.[0]) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const options: UploadOptions = {
        optimize: isCurrentFileVideo() ? false : optimize,
        generateBlurHash: isCurrentFileVideo() ? false : generateBlurHash,
        format,
        quality,
        maxWidth,
      };

      const result = await onUploadToBlossom(
        fileInput.files[0],
        Array.from(selectedServers),
        options,
      );

      setUploadResult(result);

      if (result.successful.length > 0) {
        // Construct our own URL using WEBSITE_URL/api/file/{hash}.{extension}
        const extension = getExtensionFromMimeType(result.contentType);
        const newUrl = extension
          ? `${WEBSITE_URL}/api/file/${result.sha256}.${extension}`
          : `${WEBSITE_URL}/api/file/${result.sha256}`;

        onChange(newUrl);

        setActiveTab("url");
      }
    } catch (error) {
      console.error("Upload failed:", error);

      setUploadResult({
        successful: [],
        failed: [
          {
            server: "Bilinmeyen",
            error: error instanceof Error ? error.message : "Yükleme başarısız",
          },
        ],
        sha256: "",
        contentType: "",
        size: 0,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUploadToBlossom = async () => {
    if (!onUploadUrlToBlossom || selectedServers.size === 0 || !value) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const options: UploadOptions = {
        optimize: isVideoUrl(value) ? false : optimize,
        generateBlurHash: isVideoUrl(value) ? false : generateBlurHash,
        format,
        quality,
        maxWidth,
      };

      const result = await onUploadUrlToBlossom(value, Array.from(selectedServers), options);

      setUploadResult(result);

      if (result.successful.length > 0) {
        // Construct our own URL using WEBSITE_URL/api/file/{hash}.{extension}
        const extension = getExtensionFromMimeType(result.contentType);
        const newUrl = extension
          ? `${WEBSITE_URL}/api/file/${result.sha256}.${extension}`
          : `${WEBSITE_URL}/api/file/${result.sha256}`;

        onChange(newUrl);
      }
    } catch (error) {
      console.error("URL upload failed:", error);

      setUploadResult({
        successful: [],
        failed: [
          {
            server: "Bilinmeyen",
            error: error instanceof Error ? error.message : "URL yükleme başarısız",
          },
        ],
        sha256: "",
        contentType: "",
        size: 0,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleServerToggle = (server: string, checked: boolean) => {
    const newSelectedServers = new Set(selectedServers);

    if (checked) {
      newSelectedServers.add(server);
    } else {
      newSelectedServers.delete(server);
    }

    setSelectedServers(newSelectedServers);
  };

  const handleSelectAllServers = () => {
    if (selectedServers.size === blossomServers.length) {
      // If all are selected, deselect all
      setSelectedServers(new Set());
    } else {
      // Select all servers
      setSelectedServers(new Set(blossomServers));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="media-url">{label}</Label>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "url" | "file" | "select")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Dosya
            </TabsTrigger>
            <TabsTrigger value="select" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Seç
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  id="media-url"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button
                  onClick={handleCorsCheck}
                  disabled={!value || isCheckingCors}
                  variant="outline"
                  size="sm"
                >
                  {isCheckingCors ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "CORS Kontrol Et"
                  )}
                </Button>
              </div>

              {corsResult && (
                <Alert
                  className={
                    corsResult.hasCors ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <div className="flex items-center gap-2">
                    {corsResult.hasCors ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {corsResult.hasCors
                        ? "CORS etkin - medya harici olarak kullanılabilir"
                        : `CORS etkin değil${corsResult.error ? `: ${corsResult.error}` : ""} - Blossom'a yüklemeyi düşünün`}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {value && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {renderMediaPreview(value)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(value, "_blank")}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Aç
                    </Button>
                  </div>

                  {/* Upload URL to Blossom */}
                  {onUploadUrlToBlossom && blossomServers.length > 0 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>URL'yi Blossom'a Yükle:</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllServers}
                            className="text-xs"
                          >
                            {selectedServers.size === blossomServers.length
                              ? "Hepsini Kaldır"
                              : "Hepsini Seç"}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {blossomServers.map((server) => (
                            <div key={server} className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedServers.has(server)}
                                onCheckedChange={(checked) =>
                                  handleServerToggle(server, checked as boolean)
                                }
                              />
                              <span className="text-sm font-mono">{server}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Optimization Settings for URL Upload */}
                      {!isVideoUrl(value) && (
                        <Collapsible
                          open={showOptimizationSettings}
                          onOpenChange={setShowOptimizationSettings}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <Settings className="h-4 w-4 mr-2" />
                              Optimizasyon Ayarları
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/50">
                            <OptimizationSettings
                              idPrefix="url"
                              optimize={optimize}
                              setOptimize={setOptimize}
                              generateBlurHash={generateBlurHash}
                              setGenerateBlurHash={setGenerateBlurHash}
                              format={format}
                              setFormat={setFormat}
                              quality={quality}
                              setQuality={setQuality}
                              maxWidth={maxWidth}
                              setMaxWidth={setMaxWidth}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {isVideoUrl(value) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-600">
                            Video dosyaları için optimizasyon ayarları kullanılamaz. Video orijinal
                            haliyle yüklenecek.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleUrlUploadToBlossom}
                          disabled={selectedServers.size === 0 || isUploading}
                          className="flex items-center gap-2"
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Blossom'a Yükle
                        </Button>
                        <Badge variant="outline">{selectedServers.size} sunucu seçildi</Badge>
                      </div>

                      {/* Upload Results */}
                      {uploadResult && (
                        <div className="space-y-2">
                          <Label>Yükleme Sonuçları:</Label>
                          <div className="space-y-2">
                            {uploadResult.successful.length > 0 && (
                              <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-gray-600" />
                                <AlertDescription className="text-gray-600">
                                  {uploadResult.successful.length} sunucuya başarıyla yüklendi
                                  {uploadResult.blurhash && " BlurHash ile"}
                                </AlertDescription>
                              </Alert>
                            )}

                            {uploadResult.failed.length > 0 && (
                              <Alert className="border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription>
                                  {uploadResult.failed.length} sunucuya yükleme başarısız
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                SHA256: <code className="font-mono">{uploadResult.sha256}</code>
                              </div>
                              <div>Boyut: {(uploadResult.size / 1024).toFixed(1)} KB</div>
                              <div>Tür: {uploadResult.contentType}</div>
                              {uploadResult.blurhash && (
                                <div>
                                  BlurHash:{" "}
                                  <code className="font-mono">
                                    {uploadResult.blurhash.blurhash}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="select" className="mt-4">
            <BlobSelector
              onSelect={onChange}
              selectedUrl={value}
              title="Blob Seç"
              description="Mevcut blob'lardan birini seçin"
            />
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            <div className="space-y-4">
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>

              {fileInputRef.current?.files?.[0] && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Yükleme için Blossom Sunucularını Seçin:</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllServers}
                        className="text-xs"
                      >
                        {selectedServers.size === blossomServers.length
                          ? "Hepsini Kaldır"
                          : "Hepsini Seç"}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {blossomServers.map((server) => (
                        <div key={server} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedServers.has(server)}
                            onCheckedChange={(checked) =>
                              handleServerToggle(server, checked as boolean)
                            }
                          />
                          <span className="text-sm font-mono">{server}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimization Settings */}
                  {!isCurrentFileVideo() && (
                    <Collapsible
                      open={showOptimizationSettings}
                      onOpenChange={setShowOptimizationSettings}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Optimizasyon Ayarları
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/50">
                        <OptimizationSettings
                          idPrefix="file"
                          optimize={optimize}
                          setOptimize={setOptimize}
                          generateBlurHash={generateBlurHash}
                          setGenerateBlurHash={setGenerateBlurHash}
                          format={format}
                          setFormat={setFormat}
                          quality={quality}
                          setQuality={setQuality}
                          maxWidth={maxWidth}
                          setMaxWidth={setMaxWidth}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {isCurrentFileVideo() && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-600">
                        Video dosyaları için optimizasyon ayarları kullanılamaz. Video orijinal
                        haliyle yüklenecek.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleUploadToBlossom}
                      disabled={selectedServers.size === 0 || isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Blossom'a Yükle
                    </Button>
                    <Badge variant="outline">{selectedServers.size} sunucu seçildi</Badge>
                  </div>

                  {value && (
                    <div className="flex items-center gap-2">
                      {renderMediaPreview(value)}
                      <div className="text-sm text-muted-foreground">Yüklemeye hazır</div>
                    </div>
                  )}

                  {/* Upload Results */}
                  {uploadResult && (
                    <div className="space-y-2">
                      <Label>Yükleme Sonuçları:</Label>
                      <div className="space-y-2">
                        {uploadResult.successful.length > 0 && (
                          <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                              {uploadResult.successful.length} sunucuya başarıyla yüklendi
                              {uploadResult.blurhash && " BlurHash ile"}
                            </AlertDescription>
                          </Alert>
                        )}

                        {uploadResult.failed.length > 0 && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                              {uploadResult.failed.length} sunucuya yükleme başarısız
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            SHA256: <code className="font-mono">{uploadResult.sha256}</code>
                          </div>
                          <div>Boyut: {(uploadResult.size / 1024).toFixed(1)} KB</div>
                          <div>Tür: {uploadResult.contentType}</div>
                          {uploadResult.blurhash && (
                            <div>
                              BlurHash:{" "}
                              <code className="font-mono">{uploadResult.blurhash.blurhash}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
