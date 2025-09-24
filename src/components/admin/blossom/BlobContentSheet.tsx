import { useState, useEffect } from "react";
import { ExternalLink, Calendar, FileText, Hash, Trash2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { DeleteBlossomMediaPayload } from "@/types/admin";
import { WEBSITE_URL } from "@/lib/constants";
import {
  FetchMetadata,
  ProgressiveBlossomImage,
} from "@/components/common/ProgressiveBlossomImage";

import {
  DeleteBlossomMediaResponse,
  DeleteBlossomMediaResponseSchema,
} from "api-helpers/admin/blossom/delete";

import { createNIP98Auth } from "../utils";

interface BlobDescriptor {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
}

interface BlobContentSheetProps {
  server: string;
  blobs: BlobDescriptor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlobDeleted?: () => void; // Callback to refresh the blob list
}

export default function BlobContentSheet({
  server,
  blobs,
  open,
  onOpenChange,
  onBlobDeleted,
}: BlobContentSheetProps) {
  const { getPublicKey, signEvent } = useNostrAuth();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [testBlurhash, setTestBlurhash] = useState<boolean>(true);

  const middleTruncate = (text: string, head = 10, tail = 10): string => {
    if (!text) return "";
    if (text.length <= head + tail + 3) return text;
    return `${text.slice(0, head)}…${text.slice(-tail)}`;
  };
  const [blurhashMetadata, setBlurhashMetadata] = useState<Record<string, any>>({});

  // Fetch BlurHash metadata for all blobs when sheet opens
  useEffect(() => {
    if (open && blobs.length > 0) {
      const fetchAllMetadata = async () => {
        const metadataPromises = blobs.map(async (blob) => {
          try {
            const metadata = await FetchMetadata({ sha256: blob.sha256 });
            return { sha256: blob.sha256, metadata };
          } catch (error) {
            console.error(`Failed to fetch metadata for ${blob.sha256}:`, error);
            return { sha256: blob.sha256, metadata: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        const metadataMap = results.reduce(
          (acc, { sha256, metadata }) => {
            acc[sha256] = metadata;
            return acc;
          },
          {} as Record<string, any>,
        );

        setBlurhashMetadata(metadataMap);
      };

      fetchAllMetadata();
    }
  }, [open, blobs]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileExtension = (url: string): string => {
    const path = url.split("/").pop() || "";
    const extension = path.split(".").pop() || "";
    return extension.toUpperCase();
  };

  const getMimeTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.startsWith("text/")) return "📄";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📄";
  };

  const performDeleteBlobAction = async (
    data: DeleteBlossomMediaPayload,
  ): Promise<DeleteBlossomMediaResponse | null> => {
    try {
      const url = `${WEBSITE_URL}/api/admin-panel`;
      const authHeader = await createNIP98Auth(
        "POST",
        url,
        () => getPublicKey({ options: { reason: "Blob silme işlemi" } }),
        (params) => signEvent({ event: params.event, options: { reason: "Blob silme işlemi" } }),
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setDeleteError(response.statusText);
        return null;
      }

      const result: DeleteBlossomMediaResponse = await response.json();

      DeleteBlossomMediaResponseSchema.parse(result);

      result.failed;

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Silme işlemi sırasında bir hata oluştu";

      setDeleteError(errorMessage);
      return null;
    }
  };

  const handleDeleteBlob = async (blob: BlobDescriptor) => {
    setIsDeleting(blob.sha256);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const response = await performDeleteBlobAction({
        action: "delete-blossom-media",
        servers: [server],
        sha256: blob.sha256,
      });

      if (response && response.successful.length > 0) {
        setDeleteSuccess(`Blob başarıyla silindi: ${blob.sha256.substring(0, 8)}...`);

        // Call the callback to refresh the blob list
        if (onBlobDeleted) {
          onBlobDeleted();
        }
      } else {
        setDeleteError("Blob silinemedi");
      }
    } catch (error) {
      setDeleteError("Silme işlemi sırasında bir hata oluştu");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-x-hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {server} - Blob Listesi
          </SheetTitle>
          <SheetDescription>Bu sunucuda {blobs.length} blob bulundu</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4 pr-2">
            {/* Controls */}
            <div className="flex items-center gap-2 px-2 overflow-hidden">
              <Checkbox
                id="test-blurhash"
                checked={testBlurhash}
                onCheckedChange={(v) => setTestBlurhash(!!v)}
              />
              <label
                htmlFor="test-blurhash"
                className="text-sm text-muted-foreground select-none break-words"
              >
                BlurHash test modunu göster (tıklandığında orijinali aç)
              </label>
            </div>
            {/* Error Alert */}
            {deleteError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800">{deleteError}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {deleteSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800">{deleteSuccess}</AlertDescription>
              </Alert>
            )}
            {blobs.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Bu sunucuda henüz blob bulunmuyor</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              blobs.map((blob, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-2xl">{getMimeTypeIcon(blob.type)}</span>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-medium truncate">
                            {blob.url.split("/").pop() || "Unknown file"}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {blob.type} • {formatFileSize(blob.size)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {getFileExtension(blob.url)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* SHA256 Hash */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-16">
                          Hash:
                        </span>
                        <div className="flex-1 min-w-0">
                          <code
                            className="text-xs bg-muted px-2 py-1 rounded break-all font-mono"
                            title={blob.sha256}
                          >
                            {middleTruncate(blob.sha256, 12, 12)}
                          </code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(blob.sha256)}
                          className="flex-shrink-0"
                        >
                          <Hash className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* File URL */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs text-muted-foreground font-medium w-16">URL:</span>
                        <div className="flex-1 min-w-0">
                          <a
                            className="block text-xs bg-muted px-2 py-1 rounded break-words break-all whitespace-normal font-mono"
                            href={blob.url}
                            target="_blank"
                            title={`${WEBSITE_URL}/api/file/${blob.sha256}`}
                          >
                            {middleTruncate(`${WEBSITE_URL}/api/file/${blob.sha256}`, 24, 16)}
                          </a>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInNewTab(blob.url)}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* API URL */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-16">
                          API URL:
                        </span>
                        <div className="flex-1 min-w-0">
                          <a
                            className="text-xs bg-muted px-2 py-1 rounded break-all font-mono"
                            href={`${WEBSITE_URL}/api/file/${blob.sha256}`}
                            target="_blank"
                          >
                            {WEBSITE_URL}/api/file/{blob.sha256}
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(blob.sha256)}
                          className="flex-shrink-0"
                        >
                          <Hash className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* BlurHash */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-16">
                          BlurHash:
                        </span>
                        <div className="flex-1 min-w-0">
                          {blurhashMetadata[blob.sha256] ? (
                            <div className="space-y-1">
                              <code className="text-xs bg-muted px-2 py-1 rounded break-all font-mono">
                                {blurhashMetadata[blob.sha256].blurhash}
                              </code>
                              <div className="text-xs text-muted-foreground">
                                {blurhashMetadata[blob.sha256].width}×
                                {blurhashMetadata[blob.sha256].height} •{" "}
                                {blurhashMetadata[blob.sha256].contentType}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Loading...</span>
                          )}
                        </div>
                        {blurhashMetadata[blob.sha256] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(blurhashMetadata[blob.sha256].blurhash)
                            }
                            className="flex-shrink-0"
                          >
                            <Hash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Upload Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Yüklenme: {formatDate(blob.uploaded)}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBlob(blob)}
                          disabled={isDeleting === blob.sha256}
                          className="flex items-center gap-1"
                        >
                          {isDeleting === blob.sha256 ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          {isDeleting === blob.sha256 ? "Siliniyor..." : "Sil"}
                        </Button>
                      </div>

                      {/* File Preview */}
                      {blob.type.startsWith("image/") && (
                        <div className="mt-3">
                          <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleOpenInNewTab(blob.url)}
                          >
                            <ProgressiveBlossomImage
                              sha256={blob.sha256}
                              alt="Preview"
                              className="object-cover rounded border"
                              loading="lazy"
                              decoding="async"
                              testBlurhash={testBlurhash}
                              onError={() => {
                                console.warn(`Failed to load image for blob ${blob.sha256}`);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
