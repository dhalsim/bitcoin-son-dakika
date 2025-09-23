import { useState } from "react";
import { ExternalLink, Calendar, FileText, Hash, Trash2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { createNIP98Auth } from "../utils";
import {
  DeleteBlossomMediaResponse,
  DeleteBlossomMediaResponseSchema,
} from "../../../../api-helpers/admin/blossom/delete";

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which blob is being deleted
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
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
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
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
      <SheetContent className="w-[600px] sm:w-[800px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {server.replace("https://", "").split(".")[0]} - Blob Listesi
          </SheetTitle>
          <SheetDescription>Bu sunucuda {blobs.length} blob bulundu</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {/* Error Alert */}
            {deleteError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{deleteError}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {deleteSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{deleteSuccess}</AlertDescription>
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
                      {/* File URL */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-16">URL:</span>
                        <div className="flex-1 min-w-0">
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {blob.url}
                          </code>
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

                      {/* SHA256 Hash */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-16">
                          Hash:
                        </span>
                        <div className="flex-1 min-w-0">
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all font-mono">
                            {blob.sha256}
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
                          <img
                            src={blob.url}
                            alt="Preview"
                            className="max-w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleOpenInNewTab(blob.url)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
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
