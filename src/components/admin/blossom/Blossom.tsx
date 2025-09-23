import { useState } from "react";
import { Upload, Link, RefreshCw, TestTube, Image, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProgressiveBlossomImage } from "@/components/common/ProgressiveBlossomImage";
import { UpdateBlossomServersPayload } from "@/types/admin";

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
  const [mirrorUrl, setMirrorUrl] = useState<string>("");
  const [deleteSha256, setDeleteSha256] = useState<string>("");
  const [fetchUrl, setFetchUrl] = useState<string>("");

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Sunucular
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Dosya Yükle
          </TabsTrigger>
          <TabsTrigger value="mirror" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Yansıt
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
            <CardHeader>
              <CardTitle>Progressive Görüntü Görüntüleme Testi</CardTitle>
              <CardDescription>BlurHash ve progressive loading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedImageUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigator.clipboard.writeText(uploadedImageUrl)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </Button>
                    <Badge variant="outline">
                      {uploadedImageUrl.includes("/api/file/") ? "Blossom URL" : "Dış URL"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Standart Görüntü</h4>
                      <img
                        src={uploadedImageUrl}
                        alt="Test görüntüsü"
                        className="w-full h-48 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Progressive Blossom Image</h4>
                      <ProgressiveBlossomImage
                        sha256={
                          uploadedImageUrl.includes("/api/file/")
                            ? uploadedImageUrl.split("/api/file/")[1].split(".")[0]
                            : "test"
                        }
                        alt="Progressive test image"
                        className="w-full h-48 rounded border"
                        fallbackUrl={uploadedImageUrl}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Upload an image first to test progressive display
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
