import { Loader2, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle } from "@/components/CanvasEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EventItem } from "@/lib/nip01";

type UploadToXProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventItem: EventItem;
  publishToX: ({ blob, title }: { blob: Blob; title: string }) => Promise<Response>;
  width?: number;
  height?: number;
};

type XPublishData =
  | {
      type: "success";
      success: boolean;
      message: string;
    }
  | {
      type: "error";
      error: string;
    }
  | { type: "loading" };

export default function UploadToX({
  open,
  onOpenChange,
  eventItem,
  publishToX,
  width = 800,
  height = 600,
}: UploadToXProps) {
  const canvasRef = useRef<CanvasEditorHandle | null>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true); // initializing
  const [overlayText, setOverlayText] = useState<string>("");
  const [xPublishData, setXPublishData] = useState<XPublishData | null>(null);
  const [overlayTextConfig, setOverlayTextConfig] = useState<{
    text: string;
    fontSize: number;
    fontFamily: string;
    fill: string;
    shadowColor: string;
    shadowBlur: number;
    shadowOpacity: number;
  }>({
    text: "",
    fontSize: 60,
    fontFamily: "Inter, ui-sans-serif, system-ui",
    fill: "#ffffff",
    shadowColor: "#000000",
    shadowBlur: 3,
    shadowOpacity: 1,
  });

  useEffect(() => {
    if (open && eventItem) {
      const title = eventItem.tags.find((t) => t[0] === "title")?.[1];
      const summary = eventItem.tags.find((t) => t[0] === "summary")?.[1];
      const imageUrl = eventItem.tags.find((t) => t[0] === "image")?.[1];

      setTitle(title);
      setSummary(summary);
      setImageUrl(imageUrl);

      setLoading(false);
    }
  }, [open, eventItem]);

  const isUploading = xPublishData?.type === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>X'e Yükle</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <Label>Başlık</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Özet</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <Label>Görsel URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>

            <Button
              disabled={loading || isUploading || !imageUrl?.trim()}
              onClick={async () => {
                if (!canvasRef.current) {
                  return;
                }

                setXPublishData({ type: "loading" });
                try {
                  const blob = await canvasRef.current.exportAsBlob();
                  if (!blob) {
                    throw new Error("Görsel oluşturulamadı");
                  }

                  const res = await publishToX({ blob, title });

                  const data = await res.json();

                  if (data.success) {
                    const { success, ...rest } = data;
                    setXPublishData({
                      type: "success",
                      success: true,
                      message: JSON.stringify(rest),
                    });
                  } else {
                    setXPublishData({ type: "error", error: data.message });
                  }
                } catch (error) {
                  setXPublishData({ type: "error", error: error.message });
                }
              }}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  X'e Yükle
                </>
              )}
            </Button>

            {xPublishData && xPublishData.type === "error" && (
              <div className="text-red-500 text-sm">{xPublishData.error}</div>
            )}

            {xPublishData && xPublishData.type === "success" && (
              <div className="text-green-500 text-sm space-y-2">
                {(() => {
                  try {
                    const parsed = JSON.parse(xPublishData.message || "{}");
                    const tweetId = parsed?.data?.mediaTweetId;
                    return (
                      <>
                        {tweetId ? (
                          <a
                            href={`https://x.com/bitcoin_son_dk/status/${tweetId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            X gönderisine git
                          </a>
                        ) : null}
                        <pre className="bg-muted text-xs p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      </>
                    );
                  } catch {
                    return <div className="text-xs break-all">{xPublishData.message}</div>;
                  }
                })()}
              </div>
            )}

            {xPublishData && xPublishData.type === "loading" && (
              <div className="text-gray-500 text-sm">Twitter'a yükleniyor...</div>
            )}
          </div>

          <div className="space-y-2">
            <CanvasEditor
              ref={canvasRef as any}
              imageUrl={imageUrl}
              captionText={title}
              width={width}
              height={height}
              backgroundColor="#000000"
            />

            <div className="mt-2 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!canvasRef.current) {
                      return;
                    }

                    await canvasRef.current.addOverlayImageFromUrl(
                      "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png",
                      { width: 160, x: 20, y: 20 },
                    );
                  }}
                >
                  Logoyu Ekle
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => canvasRef.current?.clearOverlays()}
                >
                  Temizle
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Metin..."
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploading}
                    onClick={() => {
                      if (!canvasRef.current || !overlayText.trim()) {
                        return;
                      }

                      canvasRef.current.addOverlayText(overlayText.trim(), {
                        fontSize: overlayTextConfig.fontSize,
                        fontFamily: overlayTextConfig.fontFamily,
                        fill: overlayTextConfig.fill,
                        shadowColor: overlayTextConfig.shadowColor,
                        shadowBlur: overlayTextConfig.shadowBlur,
                        shadowOpacity: overlayTextConfig.shadowOpacity,
                      });
                    }}
                  >
                    Metni Ekle
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Yazı Boyutu</Label>
                    <Input
                      type="number"
                      min={8}
                      max={200}
                      value={overlayTextConfig.fontSize}
                      onChange={(e) =>
                        setOverlayTextConfig({
                          ...overlayTextConfig,
                          fontSize: Number(e.target.value) || 0,
                        })
                      }
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="min-w-[90px]">Yazı Tipi</Label>
                  <Select
                    value={overlayTextConfig.fontFamily}
                    disabled={isUploading}
                    onValueChange={(v) =>
                      setOverlayTextConfig({ ...overlayTextConfig, fontFamily: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Yazı tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, ui-sans-serif, system-ui">
                        Inter / System Sans
                      </SelectItem>
                      <SelectItem value="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans', sans-serif">
                        System Sans
                      </SelectItem>
                      <SelectItem value="Helvetica, Arial, sans-serif">
                        Helvetica / Arial
                      </SelectItem>
                      <SelectItem value="Georgia, 'Times New Roman', serif">
                        Serif (Georgia)
                      </SelectItem>
                      <SelectItem value="'Times New Roman', Times, serif">
                        Times New Roman
                      </SelectItem>
                      <SelectItem value="Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                        Monospace (Menlo)
                      </SelectItem>
                      <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Yazı Rengi</Label>
                    <Input
                      type="color"
                      value={overlayTextConfig.fill}
                      onChange={(e) =>
                        setOverlayTextConfig({
                          ...overlayTextConfig,
                          fill: e.target.value,
                        })
                      }
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Gölge Rengi</Label>
                    <Input
                      type="color"
                      value={overlayTextConfig.shadowColor}
                      onChange={(e) =>
                        setOverlayTextConfig({
                          ...overlayTextConfig,
                          shadowColor: e.target.value,
                        })
                      }
                      disabled={isUploading}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Gölge Bulanıklığı</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={overlayTextConfig.shadowBlur}
                      onChange={(e) =>
                        setOverlayTextConfig({
                          ...overlayTextConfig,
                          shadowBlur: Number(e.target.value) || 0,
                        })
                      }
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="min-w-[90px]">Gölge Opaklığı</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={overlayTextConfig.shadowOpacity}
                    onChange={(e) =>
                      setOverlayTextConfig({
                        ...overlayTextConfig,
                        shadowOpacity: Math.max(0, Math.min(1, Number(e.target.value) || 0)),
                      })
                    }
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
