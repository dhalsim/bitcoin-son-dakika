import { Loader2, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle } from "@/components/CanvasEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EventItem } from "@/lib/nip01";

type UploadToXProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventItem: EventItem;
  onUpload: ({
    blob,
    title,
    summary,
    content,
  }: {
    blob: Blob;
    title: string;
    summary: string;
    content: string;
  }) => Promise<void> | void;
  width?: number;
  height?: number;
};

export default function UploadToX({
  open,
  onOpenChange,
  eventItem,
  onUpload,
  width = 800,
  height = 600,
}: UploadToXProps) {
  const canvasRef = useRef<CanvasEditorHandle | null>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [overlayText, setOverlayText] = useState<string>("");
  const [overlayFontSize, setOverlayFontSize] = useState<number>(28);
  const [overlayFill, setOverlayFill] = useState<string>("#ffffff");
  const [overlayStroke, setOverlayStroke] = useState<string>("#000000");
  const [overlayStrokeWidth, setOverlayStrokeWidth] = useState<number>(0);

  useEffect(() => {
    if (open && eventItem) {
      const title = eventItem.tags.find((t) => t[0] === "title")?.[1];
      const summary = eventItem.tags.find((t) => t[0] === "summary")?.[1];
      const imageUrl = eventItem.tags.find((t) => t[0] === "image")?.[1];
      const content = eventItem.tags.find((t) => t[0] === "content")?.[1];

      setTitle(title);
      setSummary(summary);
      setImageUrl(imageUrl);
      setContent(content);

      setLoading(false);
    }
  }, [open, eventItem]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

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
            <div>
              <Label>İçerik</Label>
              <Textarea
                className="min-h-[160px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <Button
              disabled={loading || !imageUrl?.trim()}
              onClick={async () => {
                if (!canvasRef.current) {
                  return;
                }

                setLoading(true);
                try {
                  const blob = await canvasRef.current.exportAsBlob();
                  if (!blob) {
                    return;
                  }

                  await onUpload({
                    blob,
                    title,
                    summary,
                    content,
                  });

                  onOpenChange(false);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full"
            >
              {loading ? (
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
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!canvasRef.current || !overlayText.trim()) {
                        return;
                      }

                      canvasRef.current.addOverlayText(overlayText.trim(), {
                        fontSize: overlayFontSize,
                        fill: overlayFill,
                        stroke: overlayStroke,
                        strokeWidth: overlayStrokeWidth,
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
                      value={overlayFontSize}
                      onChange={(e) => setOverlayFontSize(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Kontur Kalınlığı</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={overlayStrokeWidth}
                      onChange={(e) => setOverlayStrokeWidth(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Yazı Rengi</Label>
                    <Input
                      type="color"
                      value={overlayFill}
                      onChange={(e) => setOverlayFill(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="min-w-[90px]">Kontur Rengi</Label>
                    <Input
                      type="color"
                      value={overlayStroke}
                      onChange={(e) => setOverlayStroke(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
