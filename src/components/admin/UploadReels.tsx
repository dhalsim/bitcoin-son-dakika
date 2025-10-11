import { Loader2, Video, RotateCcw, RotateCw, Move, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle, type LayerInfo } from "@/components/CanvasEditor";
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
import { Slider } from "@/components/ui/slider";
import type { EventItem } from "@/lib/nip01";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

import { createTitleSlug } from "api-helpers/common_with_client";

import { publishToReels, type PublishToReelsParams } from "./utils";

type UploadReelsProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventItem: EventItem;
  type: "news" | "podcast" | "article";
  width?: number;
  height?: number;
};

type ReelsPublishData =
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

type ImageScalingMode = "cover" | "contain" | "fill" | "scale-down";

export default function UploadReels({
  open,
  onOpenChange,
  eventItem,
  type,
  width = 108 * 3,
  height = 192 * 3,
}: UploadReelsProps) {
  const canvasRef = useRef<CanvasEditorHandle | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reelsPublishData, setReelsPublishData] = useState<ReelsPublishData | null>(null);
  const { getPublicKey, signEvent } = useNostrAuth();

  // Layer management - simplified, CanvasEditor is source of truth
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [imageScalingMode, setImageScalingMode] = useState<ImageScalingMode>("cover");

  // Text layer configuration
  const [textConfig, setTextConfig] = useState({
    text: "",
    fontSize: 48,
    fontFamily: "Inter, ui-sans-serif, system-ui",
    fill: "#ffffff",
    shadowColor: "#000000",
    shadowBlur: 3,
    shadowOpacity: 1,
    backgroundColor: "#000000",
    backgroundOpacity: 0.7,
    textAlign: "center" as "left" | "center" | "right",
  });

  useEffect(() => {
    if (open && eventItem) {
      const titleText = eventItem.tags.find((t) => t[0] === "title")?.[1];
      const imageUrlValue = eventItem.tags.find((t) => t[0] === "image")?.[1];
      const tags = eventItem.tags.filter((t) => t[0] === "t").map((t) => `#${t[1]}`);

      setSlug(createTitleSlug(titleText));
      setTitle(titleText + " " + tags.join(" "));
      setDescription("Haberin devamı ve daha fazlası için: [link]");
      setImageUrl(imageUrlValue || "");

      setLoading(false);
    }
  }, [open, eventItem]);

  const isUploading = reelsPublishData?.type === "loading";

  const addTextLayer = () => {
    if (!canvasRef.current || !textConfig.text.trim()) {
      return;
    }

    const layerId = canvasRef.current.addOverlayText(textConfig.text, {
      fontSize: textConfig.fontSize,
      fontFamily: textConfig.fontFamily,
      fill: textConfig.fill,
      shadowColor: textConfig.shadowColor,
      shadowBlur: textConfig.shadowBlur,
      shadowOpacity: textConfig.shadowOpacity,
      backgroundColor: textConfig.backgroundColor,
      backgroundOpacity: textConfig.backgroundOpacity,
      textAlign: textConfig.textAlign,
    });

    setSelectedLayerId(layerId);
    // Layer will be added to state via onLayerAdded callback
  };

  const addLogoLayer = async () => {
    if (!canvasRef.current) {
      return;
    }

    const layerId = await canvasRef.current.addOverlayImageFromUrl(
      "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png",
      { width: 120, height: 120, x: 20, y: 20 },
    );

    setSelectedLayerId(layerId);
    // Layer will be added to state via onLayerAdded callback
  };

  const removeLayer = (layerId: string) => {
    canvasRef.current?.removeLayer(layerId);
    // Layer will be removed from state via onLayerRemoved callback
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  const rotateLayer = (layerId: string, direction: "left" | "right") => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || !canvasRef.current) return;

    const rotationStep = direction === "left" ? -15 : 15;
    const newRotation = (layer.rotation + rotationStep) % 360;

    canvasRef.current.rotateLayer(layerId, newRotation);
    // Layer will be updated in state via onLayerUpdated callback
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    canvasRef.current?.setLayerOpacity(layerId, opacity);
    // Layer will be updated in state via onLayerUpdated callback
  };

  const handleGenerateVideo = async () => {
    if (!canvasRef.current) {
      return;
    }

    setReelsPublishData({ type: "loading" });

    try {
      const blob = await canvasRef.current.exportAsBlob();

      if (!blob) {
        throw new Error("Video oluşturulamadı");
      }

      const res = await publishToReels({
        blob,
        title,
        description,
        type,
        slug,
        getPublicKey,
        signEvent,
      });

      const data = await res.json();

      if (data.success) {
        const { success, ...rest } = data;
        setReelsPublishData({
          type: "success",
          success: true,
          message: JSON.stringify(rest),
        });
      } else {
        setReelsPublishData({ type: "error", error: data.message });
      }
    } catch (error) {
      setReelsPublishData({ type: "error", error: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Reels Video Oluştur (9:16)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_300px] gap-6">
          {/* Left Panel - Content & Settings */}
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video başlığı..."
              />
            </div>

            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Video açıklaması..."
              />
            </div>

            <div>
              <Label>Görsel URL</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Arka plan görseli URL'si..."
              />
            </div>

            <div>
              <Label>Görsel Ölçekleme</Label>
              <Select
                value={imageScalingMode}
                onValueChange={(value: ImageScalingMode) => setImageScalingMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (Kırp)</SelectItem>
                  <SelectItem value="contain">Contain (Sığdır)</SelectItem>
                  <SelectItem value="fill">Fill (Doldur)</SelectItem>
                  <SelectItem value="scale-down">Scale Down (Küçült)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Layer Management */}
            <div className="space-y-3">
              <Label>Katmanlar</Label>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Metin..."
                    value={textConfig.text}
                    onChange={(e) => setTextConfig({ ...textConfig, text: e.target.value })}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploading || !textConfig.text.trim()}
                    onClick={addTextLayer}
                  >
                    Metin Ekle
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addLogoLayer}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Logo Ekle
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      canvasRef.current?.clearOverlays();
                      setLayers([]);
                      setSelectedLayerId(null);
                    }}
                    disabled={isUploading || layers.length === 0}
                    className="flex-1"
                  >
                    Temizle
                  </Button>
                </div>
              </div>

              {/* Layer List */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedLayerId === layer.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {layer.type === "text" ? "Metin" : "Logo"}
                        </span>
                        {layer.rotation !== 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({Math.round(layer.rotation)}°)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateLayer(layer.id, "left");
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateLayer(layer.id, "right");
                          }}
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLayer(layer.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {selectedLayerId === layer.id && (
                      <div className="mt-2 space-y-2 p-2 bg-muted rounded">
                        <div>
                          <Label className="text-xs text-foreground">
                            Opaklık: {Math.round(layer.opacity * 100)}%
                          </Label>
                          <Slider
                            value={[layer.opacity]}
                            onValueChange={([value]) => updateLayerOpacity(layer.id, value)}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Video Button */}
            <Button
              disabled={loading || isUploading || !imageUrl?.trim()}
              onClick={handleGenerateVideo}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Video Oluşturuluyor...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Video Oluştur
                </>
              )}
            </Button>

            {/* Status Messages */}
            {reelsPublishData && reelsPublishData.type === "error" && (
              <div className="text-red-500 text-sm">{reelsPublishData.error}</div>
            )}

            {reelsPublishData && reelsPublishData.type === "success" && (
              <div className="text-green-500 text-sm">
                <div className="mb-2">Video başarıyla oluşturuldu!</div>
                <pre className="bg-muted text-xs p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(reelsPublishData.message || "{}"), null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Center Panel - Canvas Preview */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                1080 × 1920px (9:16)
              </span>
            </div>
            <CanvasEditor
              ref={canvasRef as any}
              imageUrl={imageUrl}
              scalingMode={imageScalingMode}
              width={width}
              height={height}
              backgroundColor="#000000"
              onLayerAdded={(layer) => setLayers((prev) => [...prev, layer])}
              onLayerRemoved={(layerId) =>
                setLayers((prev) => prev.filter((l) => l.id !== layerId))
              }
              onLayerUpdated={(layerId, updates) =>
                setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l)))
              }
            />
          </div>

          {/* Right Panel - Text Styling */}
          <div className="space-y-4 max-h-[calc(95vh-200px)] overflow-y-auto">
            <Label className="sticky top-0 bg-background z-10 pb-2">Metin Stili</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Yazı Boyutu</Label>
                <Input
                  type="number"
                  min={12}
                  max={120}
                  value={textConfig.fontSize}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      fontSize: Number(e.target.value) || 48,
                    })
                  }
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label className="text-sm">Yazı Rengi</Label>
                <Input
                  type="color"
                  value={textConfig.fill}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      fill: e.target.value,
                    })
                  }
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label className="text-sm">Arka Plan Rengi</Label>
                <Input
                  type="color"
                  value={textConfig.backgroundColor}
                  onChange={(e) =>
                    setTextConfig({
                      ...textConfig,
                      backgroundColor: e.target.value,
                    })
                  }
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label className="text-sm">Arka Plan Opaklığı</Label>
                <Slider
                  value={[textConfig.backgroundOpacity]}
                  onValueChange={([value]) =>
                    setTextConfig({
                      ...textConfig,
                      backgroundOpacity: value,
                    })
                  }
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-sm">Hizalama</Label>
                <Select
                  value={textConfig.textAlign}
                  onValueChange={(value: "left" | "center" | "right") =>
                    setTextConfig({ ...textConfig, textAlign: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Sol</SelectItem>
                    <SelectItem value="center">Orta</SelectItem>
                    <SelectItem value="right">Sağ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
