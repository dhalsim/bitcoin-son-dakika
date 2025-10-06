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

interface ImageUrlInputProps {
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

export function ImageUrlInput({
  value,
  onChange,
  label = "Resim URL'si",
  placeholder = "Resim URL'si girin veya dosya yükleyin",
  blossomServers,
  onUploadToBlossom,
  onUploadUrlToBlossom,
}: ImageUrlInputProps) {
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

  const checkCors = async (url: string): Promise<CorsCheckResult> => {
    try {
      // First try a simple fetch to see if the image is accessible
      const response = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        return {
          hasCors: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const corsHeader = response.headers.get("access-control-allow-origin");

      // If we got a successful response, check for CORS headers
      const hasCorsHeader = corsHeader === "*";

      return {
        hasCors: hasCorsHeader,
        error: hasCorsHeader ? undefined : "CORS bulunamadı - Blossom'a yüklemeyi deneyiniz",
      };
    } catch (error) {
      // If it's a CORS error, the image might still be accessible via img tag
      if (error instanceof TypeError && error.message.includes("CORS")) {
        return {
          hasCors: false,
          error: "CORS bulunamadı - Blossom'a yüklemeyi deneyiniz",
        };
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
        optimize,
        generateBlurHash,
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
        optimize,
        generateBlurHash,
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
        <Label htmlFor="image-url">{label}</Label>
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
                  id="image-url"
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
                        ? "CORS etkin - resim harici olarak kullanılabilir"
                        : `CORS etkin değil${corsResult.error ? `: ${corsResult.error}` : ""} - Blossom'a yüklemeyi düşünün`}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {value && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={value}
                      alt="Önizleme"
                      className="h-20 w-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
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
                  accept="image/*"
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
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="optimize"
                            checked={optimize}
                            onCheckedChange={(checked) => setOptimize(checked as boolean)}
                          />
                          <Label htmlFor="optimize">
                            Resmi optimize et (boyutlandır ve format dönüştür)
                          </Label>
                        </div>

                        {optimize && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="format">Çıktı Formatı</Label>
                              <Select
                                value={format}
                                onValueChange={(value: "webp" | "avif" | "jpeg") =>
                                  setFormat(value)
                                }
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
                              <Label htmlFor="quality">Kalite: {quality}%</Label>
                              <Slider
                                id="quality"
                                min={10}
                                max={100}
                                step={1}
                                value={[quality]}
                                onValueChange={(value) => setQuality(value[0])}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="maxWidth">
                                Maksimum Genişlik: {maxWidth ? `${maxWidth}px` : "Orijinal"}
                              </Label>
                              <Slider
                                id="maxWidth"
                                min={320}
                                max={4096}
                                step={160}
                                value={maxWidth ? [maxWidth] : [4096]}
                                onValueChange={(value) =>
                                  setMaxWidth(value[0] === 4096 ? null : value[0])
                                }
                                className="w-full"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="generateBlurHash"
                            checked={generateBlurHash}
                            onCheckedChange={(checked) => setGenerateBlurHash(checked as boolean)}
                          />
                          <Label htmlFor="generateBlurHash">
                            Aşamalı yükleme için BlurHash oluştur
                          </Label>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

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
                      <img
                        src={value}
                        alt="Önizleme"
                        className="h-20 w-20 object-cover rounded border"
                      />
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
