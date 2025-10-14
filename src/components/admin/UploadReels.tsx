import { Loader2, Video, RotateCcw, RotateCw, Move, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle, type LayerInfo } from "@/components/CanvasEditor";
import { Timeline } from "@/components/admin/timeline";
import type { AnimatedObject, TimelineState } from "@/components/admin/timeline";
import { useAnimationController } from "@/hooks/useAnimationController";
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

  // Use new animation controller for timeline and layer management
  const controller = useAnimationController(canvasRef);

  // Use the optimized currentTime ref from the controller
  const currentTimeRef = controller.refs?.currentTime || { current: controller.state.currentTime };

  // Layer management - controller.state.objects is the source of truth
  // Convert AnimatedObject[] to LayerInfo[] for UI display
  const layers = useMemo(() => {
    return controller.state.objects.map((obj) => ({
      id: obj.id,
      type: obj.type === "text" ? "text" : "overlay",
      rotation: obj.properties.rotation?.[0]?.value ?? 0,
      opacity: obj.properties.opacity?.[0]?.value ?? 1,
      createdAt: obj.startTime,
      canvasNode: obj.canvasNode,
    }));
  }, [controller.state.objects]);
  const [imageScalingMode, setImageScalingMode] = useState<ImageScalingMode>("cover");

  // Flag to prevent interpolation during keyframe updates
  const isUpdatingKeyframesRef = useRef(false);

  // Expose timeline state to window for debugging
  useEffect(() => {
    (window as any).debugTimelineState = () => {
      console.log("=== Timeline State ===");
      console.log("Current Time:", controller.state.currentTime);
      console.log("Duration:", controller.state.duration);
      console.log("Is Playing:", controller.state.isPlaying);
      console.log("Objects:", controller.state.objects);
      console.log("Current Frame:", controller.currentFrame);
      console.log("Ref Time:", controller.refs?.currentTime?.current);
      return controller.state;
    };
    (window as any).debugLayers = () => {
      console.log("=== Layers ===");
      console.log("Layers:", layers);
      return layers;
    };
    (window as any).debugPlayback = () => {
      console.log("=== Playback Debug ===");
      console.log("State Time:", controller.state.currentTime);
      console.log("Ref Time:", controller.refs?.currentTime?.current);
      console.log("Is Playing:", controller.state.isPlaying);
      console.log("Ref Is Playing:", controller.refs?.isPlaying?.current);
      console.log("Duration:", controller.state.duration);
    };
  }, [controller.state, layers, controller.currentFrame]);

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

  // Initialize background image in timeline state
  useEffect(() => {
    if (imageUrl && !controller.state.objects.find((obj) => obj.id === "background-image")) {
      const backgroundObject: AnimatedObject = {
        id: "background-image",
        type: "image",
        name: "Background Image",
        properties: {
          opacity: [
            {
              id: "bg-op-0",
              time: 0,
              value: 1,
              easing: "linear",
            },
          ],
          scale: [
            {
              id: "bg-scale-0",
              time: 0,
              value: { x: 1, y: 1 },
              easing: "linear",
            },
          ],
          position: [
            {
              id: "bg-pos-0",
              time: 0,
              value: { x: 0, y: 0 },
              easing: "linear",
            },
          ],
          rotation: [
            {
              id: "bg-rot-0",
              time: 0,
              value: 0,
              easing: "linear",
            },
          ],
        },
        startTime: 0,
      };

      controller.addObject(backgroundObject);
    }
  }, [imageUrl, controller]);

  const isUploading = reelsPublishData?.type === "loading";

  // Helper function to convert LayerInfo to AnimatedObject
  const convertLayerToAnimatedObject = useCallback(
    (layer: LayerInfo, currentTime: number): AnimatedObject => {
      const createdAt = layer.createdAt ?? currentTime;

      // Get actual values from canvas node if available
      const nodeX = layer.canvasNode?.x?.() ?? 0;
      const nodeY = layer.canvasNode?.y?.() ?? 0;
      const nodeScaleX = layer.canvasNode?.scaleX?.() ?? 1;
      const nodeScaleY = layer.canvasNode?.scaleY?.() ?? 1;
      const nodeRotation = layer.canvasNode?.rotation?.() ?? layer.rotation;
      const nodeOpacity = layer.canvasNode?.opacity?.() ?? layer.opacity;

      return {
        id: layer.id,
        type: layer.type === "text" ? "text" : "overlay",
        name: layer.type === "text" ? "Text Layer" : "Logo",
        properties: {
          position: [
            {
              id: `${layer.id}-pos-0`,
              time: createdAt,
              value: { x: nodeX, y: nodeY },
              easing: "linear",
            },
          ],
          rotation: [
            {
              id: `${layer.id}-rot-0`,
              time: createdAt,
              value: nodeRotation,
              easing: "linear",
            },
          ],
          opacity: [
            {
              id: `${layer.id}-op-0`,
              time: createdAt,
              value: nodeOpacity,
              easing: "linear",
            },
          ],
          scale: [
            {
              id: `${layer.id}-scale-0`,
              time: createdAt,
              value: { x: nodeScaleX, y: nodeScaleY },
              easing: "linear",
            },
          ],
        },
        startTime: createdAt,
        canvasNode: layer.canvasNode,
      };
    },
    [],
  );

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

    // Layer will be added to state via onLayerAdded callback
    // Selection is handled by the timeline component
  };

  const addLogoLayer = async () => {
    if (!canvasRef.current) {
      return;
    }

    const layerId = await canvasRef.current.addOverlayImageFromUrl(
      "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png",
      { width: 120, height: 120, x: 20, y: 20 },
    );

    // Layer will be added to state via onLayerAdded callback
    // Selection is handled by the timeline component
  };

  const removeLayer = (layerId: string) => {
    canvasRef.current?.removeLayer(layerId);
    // Layer will be removed from timeline state via onLayerRemoved callback
    // Selection is handled by the timeline component
  };

  const rotateLayer = (layerId: string, direction: "left" | "right") => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || !canvasRef.current) return;

    const rotationStep = direction === "left" ? -15 : 15;
    const newRotation = (layer.rotation + rotationStep) % 360;

    canvasRef.current.rotateLayer(layerId, newRotation);
    // Layer will be updated in timeline state via onLayerUpdated callback
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    canvasRef.current?.setLayerOpacity(layerId, opacity);
    // Layer will be updated in timeline state via onLayerUpdated callback
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

        {/* Timeline Editor - At Top */}
        <div className="border-b pb-4 mb-4">
          <Timeline
            width={1000}
            height={200}
            state={controller.state}
            selectedObjectId={null} // Selection handled by timeline internally
            onTimeUpdate={controller.seek}
            onPlayingChange={(isPlaying) => {
              isPlaying ? controller.play() : controller.pause();
            }}
            onSelectObject={(objectId) => {
              // Selection handled by timeline internally
            }}
            onDeleteObject={(objectId) => {
              if (objectId === "background-image") {
                setImageUrl("");
              } else {
                removeLayer(objectId);
              }
            }}
          />
        </div>

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
                onValueChange={(value: ImageScalingMode) => {
                  console.log("Image scaling mode changed to:", value);
                  setImageScalingMode(value);
                }}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Ölçekleme modunu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (Kırp)</SelectItem>
                  <SelectItem value="contain">Contain (Sığdır)</SelectItem>
                  <SelectItem value="fill">Fill (Doldur)</SelectItem>
                  <SelectItem value="scale-down">Scale Down (Küçült)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
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
                    // Layers will be removed from timeline state via onLayerRemoved callbacks
                    // Selection is handled by the timeline component
                  }}
                  disabled={isUploading || layers.length === 0}
                  className="flex-1"
                >
                  Temizle
                </Button>
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
              getCurrentTime={() => controller.state.currentTime}
              onLayerAdded={(layer) => {
                // Convert LayerInfo to AnimatedObject and add to timeline state
                const animatedObject = convertLayerToAnimatedObject(
                  layer,
                  controller.state.currentTime,
                );
                controller.addObject(animatedObject);
              }}
              onLayerRemoved={(layerId) => {
                controller.removeObject(layerId);
              }}
              onLayerUpdated={(layerId, updates) => {
                // Update the canvasNode reference in the timeline state
                const object = controller.state.objects.find((obj) => obj.id === layerId);
                if (object && updates.canvasNode) {
                  controller.addObject({ ...object, canvasNode: updates.canvasNode });
                }
              }}
              onTransformChange={useCallback(
                (layerId, transform) => {
                  // Get fresh state at the time of the callback using ref
                  const currentTime = currentTimeRef.current;

                  console.log("🔄 onTransformChange called:", {
                    layerId,
                    transform,
                    currentTime,
                    refTime: currentTimeRef.current,
                    stateTime: controller.state.currentTime,
                  });

                  // Debug: Check if timeline state is correct
                  if (currentTime === 0) {
                    console.warn(
                      "⚠️ Timeline currentTime is 0! This should be the timeline position.",
                    );
                    return; // Don't create keyframes at time 0
                  }

                  const generateId = () =>
                    `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                  // Only create position keyframe for now (since that's what we're testing)
                  const keyframeId = generateId();
                  controller.updateKeyframe(layerId, "position", keyframeId, {
                    id: keyframeId,
                    time: currentTime,
                    value: { x: transform.x, y: transform.y },
                    easing: "linear",
                  });

                  console.log("✅ Created position keyframe at time:", currentTime);
                },
                [controller],
              )}
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
                  <SelectContent className="z-[1000]">
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
