import { Upload, Link, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ListServers } from "./ListServers";
import { UpdateBlossomServersPayload } from "@/types/admin";

interface BlossomProps {
  servers: string[];
  lastUpdated: number;
  onRefresh: () => void;
  performAction: (data: UpdateBlossomServersPayload) => Promise<any>;
}

export function Blossom({ servers, lastUpdated, onRefresh, performAction }: BlossomProps) {
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
          <TabsTrigger value="mirror" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Yansıt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="mt-6">
          <ListServers servers={servers} lastUpdated={lastUpdated} performAction={performAction} />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dosya Yükle</CardTitle>
              <CardDescription>Dosyalarınızı Blossom sunucularına yükleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Dosya yükleme özelliği yakında eklenecek
                </p>
                <Button disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mirror" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>URL Yansıt</CardTitle>
              <CardDescription>Mevcut bir dosyayı Blossom sunucularına yansıtın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  URL yansıtma özelliği yakında eklenecek
                </p>
                <Button disabled>
                  <Link className="h-4 w-4 mr-2" />
                  URL Yansıt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
