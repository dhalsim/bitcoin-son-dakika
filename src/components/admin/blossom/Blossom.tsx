import { useState } from "react";
import { Upload, Link, RefreshCw, TestTube, Image, Trash2, Copy, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ProgressiveBlossomImage } from "@/components/common/ProgressiveBlossomImage";
import { UpdateBlossomServersPayload } from "@/types/admin";

import { ListServers } from "./ListServers";
import { BlossomImageUpload } from "./BlossomImageUpload";

interface BlossomProps {
  servers: string[];
  lastUpdated: number;
  onRefresh: () => void;
  performPublishAction: (data: UpdateBlossomServersPayload) => Promise<any>;
  authToken?: string; // Nostr auth token for testing
}

interface TestResult {
  id: string;
  type: "upload" | "mirror" | "delete" | "fetch";
  status: "success" | "error" | "pending";
  message: string;
  data?: any;
  timestamp: number;
}

export function Blossom({
  servers,
  lastUpdated,
  onRefresh,
  performPublishAction,
  authToken,
}: BlossomProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [mirrorUrl, setMirrorUrl] = useState<string>("");
  const [deleteSha256, setDeleteSha256] = useState<string>("");
  const [fetchUrl, setFetchUrl] = useState<string>("");

  const addTestResult = (result: Omit<TestResult, "id" | "timestamp">) => {
    const newResult: TestResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setTestResults((prev) => [newResult, ...prev]);
  };

  const testMirror = async () => {
    if (!mirrorUrl || !authToken) return;

    addTestResult({
      type: "mirror",
      status: "pending",
      message: "Starting mirror test...",
    });

    try {
      const formData = new FormData();
      formData.append("action", "mirror-blossom-media");
      formData.append("sourceUrl", mirrorUrl);
      formData.append("servers", servers.join(","));

      const response = await fetch("/api/admin-panel", {
        method: "POST",
        headers: { Authorization: authToken },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        addTestResult({
          type: "mirror",
          status: "success",
          message: `Mirrored to ${result.data.successful.length} servers`,
          data: result.data,
        });
      } else {
        addTestResult({
          type: "mirror",
          status: "error",
          message: result.error || "Mirror failed",
        });
      }
    } catch (error) {
      addTestResult({
        type: "mirror",
        status: "error",
        message: error instanceof Error ? error.message : "Mirror failed",
      });
    }
  };

  const testDelete = async () => {
    if (!deleteSha256 || !authToken) return;

    addTestResult({
      type: "delete",
      status: "pending",
      message: "Starting delete test...",
    });

    try {
      const formData = new FormData();
      formData.append("action", "delete-blossom-media");
      formData.append("sha256", deleteSha256);
      formData.append("servers", servers.join(","));

      const response = await fetch("/api/admin-panel", {
        method: "POST",
        headers: { Authorization: authToken },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        addTestResult({
          type: "delete",
          status: "success",
          message: `Deleted from ${result.data.successful.length} servers`,
          data: result.data,
        });
      } else {
        addTestResult({
          type: "delete",
          status: "error",
          message: result.error || "Delete failed",
        });
      }
    } catch (error) {
      addTestResult({
        type: "delete",
        status: "error",
        message: error instanceof Error ? error.message : "Delete failed",
      });
    }
  };

  const testFetch = async () => {
    if (!fetchUrl) return;

    addTestResult({
      type: "fetch",
      status: "pending",
      message: "Testing fetch from public API...",
    });

    try {
      const response = await fetch(fetchUrl);

      if (response.ok) {
        const blob = await response.blob();
        addTestResult({
          type: "fetch",
          status: "success",
          message: `Successfully fetched ${(blob.size / 1024).toFixed(1)} KB`,
          data: { size: blob.size, type: blob.type },
        });
      } else {
        addTestResult({
          type: "fetch",
          status: "error",
          message: `Fetch failed: ${response.status} ${response.statusText}`,
        });
      }
    } catch (error) {
      addTestResult({
        type: "fetch",
        status: "error",
        message: error instanceof Error ? error.message : "Fetch failed",
      });
    }
  };

  const clearResults = () => setTestResults([]);
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
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
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
            label="Test Image Upload"
            placeholder="Upload an image to test Blossom functionality"
            blossomServers={servers}
            authToken={authToken}
          />
        </TabsContent>

        <TabsContent value="mirror" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>URL Yansıt Testi</CardTitle>
              <CardDescription>Mevcut bir dosyayı Blossom sunucularına yansıtın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mirror-url">Kaynak URL</Label>
                <Input
                  id="mirror-url"
                  value={mirrorUrl}
                  onChange={(e) => setMirrorUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <Button onClick={testMirror} disabled={!mirrorUrl || !authToken} className="w-full">
                <Link className="h-4 w-4 mr-2" />
                URL Yansıt
              </Button>
              {!authToken && (
                <Alert>
                  <AlertDescription>Test için authentication token gerekli</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blossom Test Suite</CardTitle>
                <CardDescription>Test all Blossom functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-sha256">Delete Test (SHA256)</Label>
                    <Input
                      id="delete-sha256"
                      value={deleteSha256}
                      onChange={(e) => setDeleteSha256(e.target.value)}
                      placeholder="Enter SHA256 hash to delete"
                    />
                    <Button
                      onClick={testDelete}
                      disabled={!deleteSha256 || !authToken}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Test
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fetch-url">Fetch Test (Public API)</Label>
                    <Input
                      id="fetch-url"
                      value={fetchUrl}
                      onChange={(e) => setFetchUrl(e.target.value)}
                      placeholder="/api/file/abc123..."
                    />
                    <Button
                      onClick={testFetch}
                      disabled={!fetchUrl}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Fetch Test
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Test Results</h4>
                    <p className="text-sm text-muted-foreground">
                      {testResults.length} test{testResults.length !== 1 ? "s" : ""} run
                    </p>
                  </div>
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                    disabled={testResults.length === 0}
                  >
                    Clear Results
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tests run yet</p>
                  ) : (
                    testResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border ${
                          result.status === "success"
                            ? "border-green-200 bg-green-50"
                            : result.status === "error"
                              ? "border-red-200 bg-red-50"
                              : "border-yellow-200 bg-yellow-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                result.status === "success"
                                  ? "default"
                                  : result.status === "error"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {result.type}
                            </Badge>
                            <span className="text-sm font-medium">{result.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {result.data && (
                          <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="display" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Image Display Test</CardTitle>
              <CardDescription>Test BlurHash and progressive loading</CardDescription>
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
                      Copy URL
                    </Button>
                    <Badge variant="outline">
                      {uploadedImageUrl.includes("/api/file/") ? "Blossom URL" : "External URL"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Standard Image</h4>
                      <img
                        src={uploadedImageUrl}
                        alt="Test image"
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
