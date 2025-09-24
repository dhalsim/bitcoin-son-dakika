import { useState } from "react";
import { Upload, Link, RefreshCw, Image, Copy, Server, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProgressiveBlossomImage } from "@/components/common/ProgressiveBlossomImage";
import { UpdateBlossomServersPayload } from "@/types/admin";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { createNIP98Auth, postAdminAction } from "@/components/admin/utils";

import { ListServers } from "./ListServers";
import { BlossomImageUpload } from "./BlossomImageUpload";
import { WEBSITE_URL } from "@/lib/constants";

interface BlossomProps {
  servers: string[];
  lastUpdated: number;
  onRefresh: () => void;
  performPublishAction: (data: UpdateBlossomServersPayload) => Promise<any>;
}

interface TestResult {
  id: string;
  type: "upload" | "mirror" | "delete" | "fetch";
  status: "success" | "error" | "pending";
  message: string;
  data?: any;
  timestamp: number;
}

export function Blossom({ servers, lastUpdated, onRefresh, performPublishAction }: BlossomProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Display tab state
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<
    Array<{
      hash: string;
      blurhash?: string;
      servers: { url: string; lastGood: boolean; bad: boolean }[];
    }>
  >([]);

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

      setFileList(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoadingList(false);
    }
  }

  async function mirrorToServer(hash: string, targetServer: string) {
    const sourceUrl = `${WEBSITE_URL}/api/file/${hash}`;

    await postAdminAction(
      { action: "mirror-blossom-media", servers: [targetServer], sourceUrl },
      getPublicKey,
      signEvent,
    );

    await fetchFileList();
  }

  async function deleteFromServer(hash: string, targetServer: string) {
    await postAdminAction(
      { action: "delete-blossom-media", servers: [targetServer], sha256: hash },
      getPublicKey,
      signEvent,
    );

    await fetchFileList();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🌸 Blossom Yönetimi</h2>
          <p className="text-muted-foreground">
            Blossom sunucularını yönetin ve dosyalarınızı yükleyin
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        )}
      </div>

      <Tabs defaultValue="servers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Sunucular
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Dosya Yükle
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Görüntüle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="mt-6">
          <ListServers
            servers={servers}
            lastUpdated={lastUpdated}
            performPublishAction={performPublishAction}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <BlossomImageUpload
            value={uploadedImageUrl}
            onChange={setUploadedImageUrl}
            label="Blossom Görüntü Yükle"
            placeholder="Blossom görüntüsü yükleyin"
            blossomServers={servers}
          />
        </TabsContent>

        <TabsContent value="display" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Blossom Dosya Listesi</CardTitle>
                <CardDescription>Bloklar ve barındırıldıkları sunucular</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchFileList}
                  disabled={isLoadingList}
                >
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
                      const hostedServers = item.servers.map((s) => s.url);
                      const missingServers = servers.filter((s) => !hostedServers.includes(s));

                      return (
                        <div key={item.hash} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">
                                <ProgressiveBlossomImage
                                  sha256={item.hash}
                                  alt={item.hash}
                                  className="w-[200px] h-auto"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                              <Badge variant="outline">SHA256</Badge>
                              <span className="font-mono text-xs">{item.hash}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigator.clipboard.writeText(item.hash)}
                                title="Kopyala"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>

                            {missingServers.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                <span className="text-xs">Eksik sunucu ekle:</span>

                                {missingServers.map((s) => (
                                  <Button
                                    key={`${item.hash}-${s}`}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => mirrorToServer(item.hash, s)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> {new URL(s).host}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.servers.map((s) => (
                              <div
                                key={`${item.hash}-${s.url}`}
                                className="flex items-center justify-between border rounded p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{s.url}</span>
                                  {s.lastGood && <Badge className="bg-green-600">Primary</Badge>}
                                  {s.bad && <Badge className="bg-red-600">Bad</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteFromServer(item.hash, s.url)}
                                    title="Sunucudan sil"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" /> Sil
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
