import { useState, useRef } from "react";
import { Upload, Link, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface ImageUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  blossomServers: string[];
  onUploadToBlossom?: (file: File, servers: string[]) => Promise<string[]>;
}

interface CorsCheckResult {
  hasCors: boolean;
  error?: string;
}

export function ImageUrlInput({
  value,
  onChange,
  label = "Image URL",
  placeholder = "Enter image URL or upload file",
  blossomServers,
  onUploadToBlossom,
}: ImageUrlInputProps) {
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [isCheckingCors, setIsCheckingCors] = useState(false);
  const [corsResult, setCorsResult] = useState<CorsCheckResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
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
    try {
      const uploadedUrls = await onUploadToBlossom(fileInput.files[0], Array.from(selectedServers));
      if (uploadedUrls.length > 0) {
        onChange(uploadedUrls[0]); // Use first successful upload
        setActiveTab("url");
      }
    } catch (error) {
      console.error("Upload failed:", error);
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image-url">{label}</Label>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "file")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File
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
                  {isCheckingCors ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check CORS"}
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
                        ? "CORS enabled - image can be used externally"
                        : `CORS not enabled${corsResult.error ? `: ${corsResult.error}` : ""} - consider uploading to Blossom`}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {value && (
                <div className="flex items-center gap-2">
                  <img
                    src={value}
                    alt="Preview"
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
                    Open
                  </Button>
                </div>
              )}
            </div>
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
                    <Label>Select Blossom Servers for Upload:</Label>
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
                      onClick={handleUploadToBlossom}
                      disabled={selectedServers.size === 0 || isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload to Blossom
                    </Button>
                    <Badge variant="outline">
                      {selectedServers.size} server{selectedServers.size !== 1 ? "s" : ""} selected
                    </Badge>
                  </div>

                  {value && (
                    <div className="flex items-center gap-2">
                      <img
                        src={value}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <div className="text-sm text-muted-foreground">Ready to upload</div>
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
