import { useEffect, useState } from "react";
import { RefreshCw, Loader2, CheckCircle, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlurhashCanvas } from "react-blurhash";
import { ProgressiveBlossomImage } from "@/components/common/ProgressiveBlossomImage";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { createNIP98Auth } from "@/components/admin/utils";
import { WEBSITE_URL } from "@/lib/constants";

import { FileListItem } from "api-helpers/schemas";

interface BlobSelectorProps {
  onSelect: (url: string) => void;
  selectedUrl?: string;
  title?: string;
  description?: string;
}

export function BlobSelector({
  onSelect,
  selectedUrl,
  title = "Blob Seç",
  description = "Mevcut blob'lardan birini seçin",
}: BlobSelectorProps) {
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<Array<FileListItem>>([]);

  const { getPublicKey, signEvent } = useNostrAuth();

  async function fetchFileList() {
    try {
      setIsLoadingList(true);
      setListError(null);

      const url = `${WEBSITE_URL}/api/file/list`;
      const auth = await createNIP98Auth("GET", url, getPublicKey, signEvent);

      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", Authorization: auth },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      setFileList(list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoadingList(false);
    }
  }

  const truncateHash = (h: string) => `${h.slice(0, 3)}...${h.slice(-3)}`;

  const handleSelect = (hash: string) => {
    const url = `${WEBSITE_URL}/api/file/${hash}`;
    onSelect(url);
  };

  // Auto-fetch on mount
  useEffect(() => {
    void fetchFileList();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFileList} disabled={isLoadingList}>
            <RefreshCw className="h-4 w-4 mr-2" /> Yenile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {listError && <div className="text-sm text-red-600">Hata: {listError}</div>}
        {isLoadingList ? (
          <div className="text-sm text-muted-foreground">Yükleniyor…</div>
        ) : (
          <div className="space-y-4">
            {fileList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Kayıt bulunamadı</div>
            ) : (
              fileList.map((item) => {
                const isSelected = selectedUrl === `${WEBSITE_URL}/api/file/${item.hash}`;
                const primaryServer =
                  item.servers.find((s) => s.lastGood)?.url || item.servers[0]?.url;

                return (
                  <div
                    key={item.hash}
                    className={`border rounded p-3 cursor-pointer transition-colors ${
                      isSelected ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                    }`}
                    onClick={() => handleSelect(item.hash)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <ProgressiveBlossomImage
                            sha256={item.hash}
                            alt={item.hash}
                            className="w-[80px] h-[60px] object-cover rounded"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        {item.blurhash && (
                          <div className="hidden min-md:block">
                            <BlurhashCanvas
                              hash={item.blurhash}
                              width={item.width || 80}
                              height={item.height || 60}
                              punch={1}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              SHA256
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              {truncateHash(item.hash)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.servers.length} sunucu • {item.contentType}
                          </div>
                          {item.width && item.height && (
                            <div className="text-xs text-muted-foreground">
                              {item.width} × {item.height}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {primaryServer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `${primaryServer.replace(/\/$/, "")}/${item.hash}`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Aç
                          </Button>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Seçildi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
