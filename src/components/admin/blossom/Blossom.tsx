import { useEffect, useState } from "react";
import { Upload, Link, RefreshCw, Image, Copy } from "lucide-react";
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
import { BlossomMediaUpload } from "./BlossomMediaUpload";

interface BlossomProps {
  servers: string[];
  lastUpdated: number;
  onRefresh: () => void;
  performPublishAction: (data: UpdateBlossomServersPayload) => Promise<any>;
}

export function Blossom({ servers, lastUpdated, onRefresh, performPublishAction }: BlossomProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Display tab state
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<Array<FileListItem>>([]);

  // Selection map: hash -> set of server URLs selected for delete
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  // Baseline selection to diff against
  const [originalSelected, setOriginalSelected] = useState<Record<string, Set<string>>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { getPublicKey, signEvent } = useNostrAuth();
  const [activeTab, setActiveTab] = useState<"servers" | "upload" | "display">("servers");

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

      // Preselect all current servers for each blob and store baseline
      const baseline: Record<string, Set<string>> = {};
      const current: Record<string, Set<string>> = {};

      for (const item of list) {
        const set = new Set<string>(item.servers.map((s: any) => s.url));
        baseline[item.hash] = new Set<string>(Array.from(set));
        current[item.hash] = new Set<string>(Array.from(set));
      }

      setOriginalSelected(baseline);

      setSelected(current);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoadingList(false);
    }
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

  // Auto-fetch when switching to Display tab
  useEffect(() => {
    if (activeTab === "display" && !isLoadingList) {
      // Fetch when entering display; avoid spamming if already loaded
      if (fileList.length === 0) {
        void fetchFileList();
      }
    }
  }, [activeTab]);

  function getDiff(hash: string): { toMirror: string[]; toDelete: string[] } {
    const base = originalSelected[hash] || new Set<string>();
    const curr = selected[hash] || new Set<string>();

    const toMirror: string[] = [];
    const toDelete: string[] = [];

    // Additions (need mirror)
    for (const s of curr) {
      if (!base.has(s)) toMirror.push(s);
    }

    // Removals (need delete)
    for (const s of base) {
      if (!curr.has(s)) toDelete.push(s);
    }

    return { toMirror, toDelete };
  }

  async function saveChanges(hash: string) {
    const { toMirror, toDelete } = getDiff(hash);

    if (toMirror.length === 0 && toDelete.length === 0) return;

    // Mirror new ones
    if (toMirror.length > 0) {
      const sourceUrl = `${WEBSITE_URL}/api/file/${hash}`;

      await postAdminAction(
        { action: "mirror-blossom-media", servers: toMirror, sourceUrl },
        getPublicKey,
        signEvent,
      );
    }

    // Delete removed ones
    if (toDelete.length > 0) {
      await postAdminAction(
        { action: "delete-blossom-media", servers: toDelete, sha256: hash },
        getPublicKey,
        signEvent,
      );
    }

    // Refresh and reset baselines
    await fetchFileList();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🌸 Blossom Yönetimi</h2>
          <p className="text-muted-foreground">
            Blossom sunucularını yönetin ve medya dosyalarınızı yükleyin
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Sunucular
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Medya Yükle
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
          <BlossomMediaUpload
            value={uploadedImageUrl}
            onChange={setUploadedImageUrl}
            label="Blossom Medya Yükle"
            placeholder="Blossom medyası yükleyin"
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
                                <div
                                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow ${
                                    copiedHash === item.hash ? "block" : "hidden"
                                  }`}
                                >
                                  Kopyalandı
                                </div>
                              </Button>
                            </div>

                            {/* Quick-add section removed as per new UX */}
                          </div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {servers.map((serverUrl) => {
                              const state = item.servers.find((x) => x.url === serverUrl);
                              const isChecked = !!selected[item.hash]?.has(serverUrl);
                              const isLastGood = !!state?.lastGood;
                              const isBad = !!state?.bad;

                              return (
                                <div
                                  key={`${item.hash}-${serverUrl}`}
                                  className="flex items-center justify-between border rounded p-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSelection(item.hash, serverUrl)}
                                      className="h-4 w-4"
                                    />
                                    <a
                                      href={`${serverUrl.replace(/\/$/, "")}/${item.hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm underline underline-offset-2"
                                      title="Sunucudan aç"
                                    >
                                      {serverUrl}
                                    </a>
                                    {isLastGood && <Badge className="bg-green-600">Primary</Badge>}
                                    {isBad && <Badge className="bg-red-600">Bad</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2" />
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center justify-end gap-2">
                            {(() => {
                              const { toMirror, toDelete } = getDiff(item.hash);
                              const hasChanges = toMirror.length > 0 || toDelete.length > 0;

                              return (
                                <>
                                  <div className="text-xs text-muted-foreground">
                                    {hasChanges
                                      ? `Eklenecek: ${toMirror.length}, Silinecek: ${toDelete.length}`
                                      : "Değişiklik yok"}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={hasChanges ? "default" : "outline"}
                                    onClick={() => saveChanges(item.hash)}
                                    disabled={!hasChanges}
                                  >
                                    Kaydet
                                  </Button>
                                </>
                              );
                            })()}
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
