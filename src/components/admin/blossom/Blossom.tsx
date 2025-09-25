import { useState } from "react";
import { Upload, Link, RefreshCw, Image, Copy, Server, Trash2, Plus } from "lucide-react";
import { BlurhashCanvas } from "react-blurhash";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProgressiveBlossomImage } from "@/components/common/ProgressiveBlossomImage";
import { UpdateBlossomServersPayload } from "@/types/admin";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { createNIP98Auth, postAdminAction } from "@/components/admin/utils";
import { WEBSITE_URL } from "@/lib/constants";
import { FileListItem } from "api-helpers/schemas";

import { ListServers } from "./ListServers";
import { BlossomImageUpload } from "./BlossomImageUpload";

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
  const [fileList, setFileList] = useState<Array<FileListItem>>([]);

  // Selection map: hash -> set of server URLs selected for delete
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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

      // Preselect all current servers for each blob
      const initialSelected: Record<string, Set<string>> = {};
      for (const item of list) {
        initialSelected[item.hash] = new Set(item.servers.map((s: any) => s.url));
      }
      setSelected(initialSelected);
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

  function toggleSelection(hash: string, server: string) {
    setSelected((prev) => {
      const current = new Set(prev[hash] ? Array.from(prev[hash]) : []);
      if (current.has(server)) {
        current.delete(server);
      } else {
        current.add(server);
      }
      return { ...prev, [hash]: current };
    });
  }

  async function deleteSelected(hash: string) {
    const serversToDelete = Array.from(selected[hash] || []);
    if (!serversToDelete.length) return;

    await postAdminAction(
      { action: "delete-blossom-media", servers: serversToDelete, sha256: hash },
      getPublicKey,
      signEvent,
    );

    setSelected((p) => ({ ...p, [hash]: new Set<string>() }));
    await fetchFileList();
  }

  const truncateHash = (h: string) => `${h.slice(0, 3)}...${h.slice(-3)}`;

  const copyToClipboard = async (
    text: string,
    hash: string,
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash((curr) => (curr === hash ? null : curr)), 1200);
    } catch (_) {}
  };

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
                              <a
                                href={`${WEBSITE_URL}/api/file/${item.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                                title="Resmi yeni sekmede aç"
                              >
                                <ProgressiveBlossomImage
                                  sha256={item.hash}
                                  alt={item.hash}
                                  className="w-[200px] h-auto"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </a>
                              {item.blurhash && (
                                <div className="hidden min-md:block">
                                  <BlurhashCanvas
                                    hash={item.blurhash}
                                    width={item.width}
                                    height={item.height}
                                    punch={1}
                                  />
                                </div>
                              )}
                              <Badge variant="outline">SHA256</Badge>
                              <button
                                onClick={(e) => copyToClipboard(item.hash, item.hash, e)}
                                className="font-mono text-xs underline underline-offset-2 cursor-pointer relative"
                                title="Hash'i kopyala"
                              >
                                {truncateHash(item.hash)}
                                <div
                                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow ${
                                    copiedHash === item.hash ? "block" : "hidden"
                                  }`}
                                >
                                  Kopyalandı
                                </div>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => copyToClipboard(item.hash, item.hash, e)}
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
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={!!selected[item.hash]?.has(s.url)}
                                    onChange={() => toggleSelection(item.hash, s.url)}
                                    className="h-4 w-4"
                                  />
                                  <a
                                    href={`${s.url.replace(/\/$/, "")}/${item.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm underline underline-offset-2"
                                    title="Sunucudan aç"
                                  >
                                    {s.url}
                                  </a>
                                  {s.lastGood && <Badge className="bg-green-600">Primary</Badge>}
                                  {s.bad && <Badge className="bg-red-600">Bad</Badge>}
                                </div>
                                <div className="flex items-center gap-2" />
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSelected(item.hash)}
                              disabled={!selected[item.hash] || selected[item.hash].size === 0}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Seçili Olanları Sil
                            </Button>
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
