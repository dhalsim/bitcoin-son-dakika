import { useState, useEffect } from "react";
import { Clock, Save, CheckSquare, Square, Database, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { UpdateBlossomServersPayload, FetchBlobListsPayload } from "@/types/admin";

import {
  FetchBlobListsResponse,
  FetchBlobListsResponseSchema,
  isErrorResponse,
} from "../../../../api-helpers/schemas";

import { createNIP98Auth } from "../utils";

import BlobContentSheet from "./BlobContentSheet";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BlobDescriptor {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
}

interface BlossomServerBlobs {
  server: string;
  blobs: BlobDescriptor[];
  error?: string;
}

const BLOSSOM_SERVERS = [
  "https://blossom.band",
  "https://blossom.primal.net",
  "https://nostr.download",
  "https://24242.io",
  "https://cdn.nostrcheck.me",
  "https://blossom.nostr.build",
];

interface ListServersProps {
  servers: string[];
  lastUpdated: number;
  performPublishAction: (data: UpdateBlossomServersPayload) => Promise<any>;
}

export function ListServers({ servers, lastUpdated, performPublishAction }: ListServersProps) {
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set(servers));
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { getPublicKey, signEvent } = useNostrAuth();
  const [error, setError] = useState<string | null>(null);

  // Blob-related state
  const [serverBlobs, setServerBlobs] = useState<Map<string, BlobDescriptor[]>>(new Map());
  const [blobErrors, setBlobErrors] = useState<Map<string, string>>(new Map());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>("");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const performListAction = async (
    data: FetchBlobListsPayload,
  ): Promise<FetchBlobListsResponse | null> => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
      const authHeader = await createNIP98Auth(
        "POST",
        url,
        () => getPublicKey({ options: { reason: "Admin panel işlemleri" } }),
        (params) =>
          signEvent({ event: params.event, options: { reason: "Admin panel işlemleri" } }),
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      });

      const result: FetchBlobListsResponse = await response.json();

      FetchBlobListsResponseSchema.parse(result);

      if (isErrorResponse(result)) {
        setError(result.message);

        return;
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Bir hata oluştu";

      setError(errorMessage);

      return;
    }
  };

  const fetchAllBlobs = async (cache: boolean) => {
    try {
      const response = await performListAction({
        action: "fetch-blob-lists",
        servers: BLOSSOM_SERVERS,
        useCache: cache,
      });

      if (response && response.success) {
        const newServerBlobs = new Map<string, BlobDescriptor[]>();
        const newBlobErrors = new Map<string, string>();

        response.serverBlobs.forEach((serverBlob: BlossomServerBlobs) => {
          // Handle different response formats
          if (serverBlob.error) {
            newBlobErrors.set(serverBlob.server, serverBlob.error);
          }

          newServerBlobs.set(serverBlob.server, serverBlob.blobs);
        });

        setServerBlobs(newServerBlobs);
        setBlobErrors(newBlobErrors);
      }
    } catch (error) {
      console.error("Error fetching all blob lists:", error);
    }
  };

  // Update local state when servers prop changes
  useEffect(() => {
    setSelectedServers(new Set(servers));
    setHasChanges(false);
  }, [servers]);

  // Fetch blobs for all servers on component mount
  useEffect(() => {
    fetchAllBlobs(true);
  }, []);

  const handleServerToggle = (server: string, checked: boolean) => {
    const newSelectedServers = new Set(selectedServers);

    if (checked) {
      newSelectedServers.add(server);
    } else {
      newSelectedServers.delete(server);
    }

    setSelectedServers(newSelectedServers);

    setHasChanges(true);
  };

  const handleSelectAll = () => {
    setSelectedServers(new Set(BLOSSOM_SERVERS));
    setHasChanges(true);
  };

  const handleUnselectAll = () => {
    setSelectedServers(new Set());
    setHasChanges(true);
  };

  const handleServerClick = (server: string) => {
    setSelectedServer(server);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    await performPublishAction({
      action: "update-blossom-servers",
      servers: Array.from(selectedServers),
      lastUpdated: Math.floor(lastUpdated / 1000),
    });

    setHasChanges(false);
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {(error || blobErrors.size > 0) && (
            <Alert className="border-red-200 bg-red-50 relative">
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
              <AlertCircle className="h-4 w-4 text-red-600" />
              {error && <AlertDescription className="text-red-800">{error}</AlertDescription>}
              {blobErrors.size > 0 && (
                <AlertDescription className="text-red-800">
                  {Array.from(blobErrors.values()).join(", ")}
                </AlertDescription>
              )}
            </Alert>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Blossom Sunucuları</h3>
          <p className="text-sm text-muted-foreground">
            {selectedServers.size} / {BLOSSOM_SERVERS.length} sunucu seçili
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(lastUpdated)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSelectAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <CheckSquare className="h-3 w-3" />
          Tümünü Seç
        </Button>
        <Button
          onClick={handleUnselectAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Square className="h-3 w-3" />
          Tümünü Kaldır
        </Button>
      </div>

      <div className="space-y-2">
        {BLOSSOM_SERVERS.map((server) => {
          const isSelected = selectedServers.has(server);
          const blobs = serverBlobs.get(server) || [];
          const error = blobErrors.get(server);

          return (
            <div
              key={server}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isSelected ? "bg-accent border-accent" : "bg-card border-border hover:bg-accent"
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleServerToggle(server, checked as boolean)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-border"
              />
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-sm font-mono ${isSelected ? "text-accent-foreground" : "text-card-foreground"}`}
                >
                  {server}
                </span>
                <div className="flex items-center gap-2">
                  {error ? (
                    <Badge variant="destructive" className="text-xs">
                      Hata
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleServerClick(server)}
                      className="text-xs h-6 px-2 flex items-center gap-1"
                    >
                      <Database className="h-3 w-3" />
                      {blobs.length} blob
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={() => fetchAllBlobs(false)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Database className="h-3 w-3" />
          Blob Listelerini Tekrar Yükle
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="sm"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Kaydediliyor..." : "Sunucu Seçimini Kaydet"}
        </Button>
      </div>

      {/* Blob Content Sheet */}
      {selectedServer && (
        <BlobContentSheet
          server={selectedServer}
          blobs={serverBlobs.get(selectedServer) || []}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </div>
  );
}
