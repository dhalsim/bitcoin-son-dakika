import { Loader2, Video, RotateCcw, RotateCw, Move, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle, type LayerInfo } from "@/components/CanvasEditor";
import { Timeline } from "@/components/admin/timeline";
import type { AnimatedObject, TimelineState } from "@/components/admin/timeline";
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

  // Timeline state - controlled
  const [timelineState, setTimelineState] = useState<TimelineState>({
    objects: [],
    duration: 10000,
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    zoom: 100,
    scrollOffset: 0,
    history: { past: [], future: [] },
  });

  // Flag to prevent interpolation during keyframe updates
  const isUpdatingKeyframesRef = useRef(false);

  // Expose timeline state to window for debugging
  useEffect(() => {
    (window as any).debugTimelineState = () => {
      console.log("=== Timeline State ===");
      console.log("Current Time:", timelineState.currentTime);
      console.log("Duration:", timelineState.duration);
      console.log("Is Playing:", timelineState.isPlaying);
      console.log("Objects:", timelineState.objects);
      console.log(
        "Selected Object:",
        timelineState.objects.find((obj) => obj.id === selectedLayerId),
      );
      return timelineState;
    };
    (window as any).debugLayers = () => {
      console.log("=== Layers ===");
      console.log("Layers:", layers);
      return layers;
    };
  }, [timelineState, layers, selectedLayerId]);

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

  // Sync layers to timeline objects (including background image)
  useEffect(() => {
    const animatedObjects: AnimatedObject[] = [];

    // Add background image as first layer if it exists
    if (imageUrl) {
      animatedObjects.push({
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
      });
    }

    // Add all other layers
    layers.forEach((layer) => {
      const createdAt = layer.createdAt ?? 0;

      // Get actual values from canvas node if available
      const nodeX = layer.canvasNode?.x?.() ?? 0;
      const nodeY = layer.canvasNode?.y?.() ?? 0;
      const nodeScaleX = layer.canvasNode?.scaleX?.() ?? 1;
      const nodeScaleY = layer.canvasNode?.scaleY?.() ?? 1;
      const nodeRotation = layer.canvasNode?.rotation?.() ?? layer.rotation;
      const nodeOpacity = layer.canvasNode?.opacity?.() ?? layer.opacity;

      animatedObjects.push({
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
      });
    });

    setTimelineState((prev) => ({
      ...prev,
      objects: animatedObjects,
    }));
  }, [layers, imageUrl]);

  // Helper function to interpolate between keyframes
  const interpolateValue = (keyframes: any[], time: number): any => {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].value;

    const before = keyframes.filter((kf) => kf.time <= time).pop();
    const after = keyframes.find((kf) => kf.time > time);

    if (!before) return keyframes[0].value;
    if (!after) return before.value;

    const progress = (time - before.time) / (after.time - before.time);

    if (typeof before.value === "number") {
      return before.value + (after.value - before.value) * progress;
    }

    if (typeof before.value === "object" && before.value !== null) {
      const result: any = {};
      Object.keys(before.value).forEach((key) => {
        result[key] = before.value[key] + (after.value[key] - before.value[key]) * progress;
      });
      return result;
    }

    return before.value;
  };

  // Add/remove layers from canvas and interpolate properties based on timeline position
  useEffect(() => {
    if (!canvasRef.current) return;

    if (isUpdatingKeyframesRef.current) {
      console.log("⏸️ Skipping interpolation - updating keyframes");
      return;
    }

    const currentTime = timelineState.currentTime;

    if (timelineState.isPlaying) {
      console.log("🎬 Interpolation during playback at:", currentTime);
    }

    timelineState.objects.forEach((obj) => {
      // Background image should always be visible
      if (obj.id === "background-image") return;

      const shouldBeOnCanvas =
        currentTime >= obj.startTime && (!obj.endTime || currentTime <= obj.endTime);

      if (obj.canvasNode) {
        const isOnCanvas = obj.canvasNode.getParent() !== null;

        if (shouldBeOnCanvas && !isOnCanvas) {
          // Add node to canvas
          canvasRef.current?.addNodeToCanvas?.(obj.canvasNode);
        } else if (!shouldBeOnCanvas && isOnCanvas) {
          // Remove node from canvas
          canvasRef.current?.removeNodeFromCanvas?.(obj.canvasNode);
        }

        // Interpolate and apply properties if on canvas
        // Only interpolate if there are multiple keyframes (meaning user has animated this property)
        if (shouldBeOnCanvas) {
          const positionKeyframes = obj.properties.position || [];
          const rotationKeyframes = obj.properties.rotation || [];
          const scaleKeyframes = obj.properties.scale || [];
          const opacityKeyframes = obj.properties.opacity || [];

          // Only apply interpolation if there are 2+ keyframes for that property
          if (positionKeyframes.length >= 2) {
            const position = interpolateValue(positionKeyframes, currentTime);
            if (position) {
              canvasRef.current?.setLayerPosition?.(obj.id, position.x, position.y);
            }
          }
          if (rotationKeyframes.length >= 2) {
            const rotation = interpolateValue(rotationKeyframes, currentTime);
            if (rotation !== null) {
              canvasRef.current?.setLayerRotation?.(obj.id, rotation);
            }
          }
          if (scaleKeyframes.length >= 2) {
            const scale = interpolateValue(scaleKeyframes, currentTime);
            if (scale) {
              canvasRef.current?.setLayerScale?.(obj.id, scale.x, scale.y);
            }
          }
          if (opacityKeyframes.length >= 2) {
            const opacity = interpolateValue(opacityKeyframes, currentTime);
            if (opacity !== null) {
              canvasRef.current?.setLayerOpacity?.(obj.id, opacity);
            }
          }
        }
      }
    });
  }, [timelineState.objects, timelineState.currentTime]);

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

        {/* Timeline Editor - At Top */}
        <div className="border-b pb-4 mb-4">
          <Timeline
            width={1000}
            height={200}
            state={timelineState}
            selectedObjectId={selectedLayerId}
            onTimeUpdate={(time) => {
              // During playback, don't update the state - let Timeline own the time
              // Only update for manual seeks (when not playing)
              if (!timelineState.isPlaying) {
                setTimelineState((prev) => {
                  // Only update if time actually changed to prevent infinite loops
                  if (prev.currentTime === time) return prev;
                  return {
                    ...prev,
                    currentTime: time,
                  };
                });
              } else {
                // During playback, trigger canvas interpolation without state update
                // Force the interpolation effect to run by updating a separate ref
                if (canvasRef.current) {
                  const currentTime = time;

                  timelineState.objects.forEach((obj) => {
                    if (obj.id === "background-image") return;

                    const shouldBeOnCanvas =
                      currentTime >= obj.startTime && (!obj.endTime || currentTime <= obj.endTime);

                    if (shouldBeOnCanvas && obj.canvasNode) {
                      const positionKeyframes = obj.properties.position || [];
                      const rotationKeyframes = obj.properties.rotation || [];
                      const scaleKeyframes = obj.properties.scale || [];
                      const opacityKeyframes = obj.properties.opacity || [];

                      if (positionKeyframes.length >= 2) {
                        const position = interpolateValue(positionKeyframes, currentTime);
                        if (position) {
                          canvasRef.current?.setLayerPosition?.(obj.id, position.x, position.y);
                        }
                      }
                      if (rotationKeyframes.length >= 2) {
                        const rotation = interpolateValue(rotationKeyframes, currentTime);
                        if (rotation !== null) {
                          canvasRef.current?.setLayerRotation?.(obj.id, rotation);
                        }
                      }
                      if (scaleKeyframes.length >= 2) {
                        const scale = interpolateValue(scaleKeyframes, currentTime);
                        if (scale) {
                          canvasRef.current?.setLayerScale?.(obj.id, scale.x, scale.y);
                        }
                      }
                      if (opacityKeyframes.length >= 2) {
                        const opacity = interpolateValue(opacityKeyframes, currentTime);
                        if (opacity !== null) {
                          canvasRef.current?.setLayerOpacity?.(obj.id, opacity);
                        }
                      }
                    }
                  });
                }
              }
            }}
            onPlayingChange={(isPlaying) => {
              setTimelineState((prev) => ({
                ...prev,
                isPlaying,
              }));
            }}
            onSelectObject={(objectId) => {
              setSelectedLayerId(objectId);
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
              getCurrentTime={() => timelineState.currentTime}
              onLayerAdded={(layer) => {
                setLayers((prev) => [...prev, layer]);

                // If layer was created after current timeline position, remove it from canvas immediately
                const createdAt = layer.createdAt ?? 0;
                if (
                  createdAt > timelineState.currentTime &&
                  layer.canvasNode &&
                  canvasRef.current
                ) {
                  canvasRef.current.removeNodeFromCanvas?.(layer.canvasNode);
                }
              }}
              onLayerRemoved={(layerId) =>
                setLayers((prev) => prev.filter((l) => l.id !== layerId))
              }
              onLayerUpdated={(layerId, updates) =>
                setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l)))
              }
              onTransformChange={(layerId, transform) => {
                console.log("🔄 onTransformChange called:", {
                  layerId,
                  transform,
                });

                isUpdatingKeyframesRef.current = true;
                setTimelineState((prev) => {
                  // Read current time from the state, not from closure
                  const currentTime = prev.currentTime;

                  console.log("⏱️ Current time from state:", currentTime);

                  const newObjects = prev.objects.map((obj) => {
                    if (obj.id !== layerId) return obj;

                    const generateId = () =>
                      `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    // Get the current interpolated values at this time to check if anything changed
                    const getCurrentValue = (keyframes: any[]) => {
                      return interpolateValue(keyframes, currentTime);
                    };

                    // Add/update keyframes for position, rotation, and scale
                    const newProperties = { ...obj.properties };

                    // Position keyframe - only if position changed
                    const currentPos = getCurrentValue(obj.properties.position || []);
                    const posChanged =
                      !currentPos ||
                      Math.abs(currentPos.x - transform.x) > 0.1 ||
                      Math.abs(currentPos.y - transform.y) > 0.1;

                    if (posChanged) {
                      const posKeyframes = [...(newProperties.position || [])];
                      const existingPosIndex = posKeyframes.findIndex(
                        (kf) => kf.time === currentTime,
                      );

                      console.log("📍 Position keyframes before:", posKeyframes);
                      console.log("📍 Adding/updating at time:", currentTime, "value:", {
                        x: transform.x,
                        y: transform.y,
                      });

                      if (existingPosIndex >= 0) {
                        posKeyframes[existingPosIndex] = {
                          ...posKeyframes[existingPosIndex],
                          value: { x: transform.x, y: transform.y },
                        };
                      } else {
                        posKeyframes.push({
                          id: generateId(),
                          time: currentTime,
                          value: { x: transform.x, y: transform.y },
                          easing: "linear",
                        });
                        posKeyframes.sort((a, b) => a.time - b.time);
                      }

                      console.log("📍 Position keyframes after:", posKeyframes);
                      newProperties.position = posKeyframes;
                    }

                    // Rotation keyframe - only if rotation changed
                    const currentRot = getCurrentValue(obj.properties.rotation || []);
                    const rotChanged =
                      currentRot === null || Math.abs(currentRot - transform.rotation) > 0.1;

                    if (rotChanged) {
                      const rotKeyframes = [...(newProperties.rotation || [])];
                      const existingRotIndex = rotKeyframes.findIndex(
                        (kf) => kf.time === currentTime,
                      );
                      console.log(
                        "🔄 Rotation changed at time:",
                        currentTime,
                        "from",
                        currentRot,
                        "to",
                        transform.rotation,
                      );
                      if (existingRotIndex >= 0) {
                        rotKeyframes[existingRotIndex] = {
                          ...rotKeyframes[existingRotIndex],
                          value: transform.rotation,
                        };
                      } else {
                        rotKeyframes.push({
                          id: generateId(),
                          time: currentTime,
                          value: transform.rotation,
                          easing: "linear",
                        });
                        rotKeyframes.sort((a, b) => a.time - b.time);
                      }
                      newProperties.rotation = rotKeyframes;
                    }

                    // Scale keyframe - only if scale changed
                    const currentScale = getCurrentValue(obj.properties.scale || []);
                    const scaleChanged =
                      !currentScale ||
                      Math.abs(currentScale.x - transform.scaleX) > 0.01 ||
                      Math.abs(currentScale.y - transform.scaleY) > 0.01;

                    if (scaleChanged) {
                      const scaleKeyframes = [...(newProperties.scale || [])];
                      const existingScaleIndex = scaleKeyframes.findIndex(
                        (kf) => kf.time === currentTime,
                      );
                      console.log(
                        "📏 Scale changed at time:",
                        currentTime,
                        "from",
                        currentScale,
                        "to",
                        { x: transform.scaleX, y: transform.scaleY },
                      );
                      if (existingScaleIndex >= 0) {
                        scaleKeyframes[existingScaleIndex] = {
                          ...scaleKeyframes[existingScaleIndex],
                          value: { x: transform.scaleX, y: transform.scaleY },
                        };
                      } else {
                        scaleKeyframes.push({
                          id: generateId(),
                          time: currentTime,
                          value: { x: transform.scaleX, y: transform.scaleY },
                          easing: "linear",
                        });
                        scaleKeyframes.sort((a, b) => a.time - b.time);
                      }
                      newProperties.scale = scaleKeyframes;
                    }

                    return {
                      ...obj,
                      properties: newProperties,
                    };
                  });

                  const result = {
                    ...prev,
                    objects: newObjects,
                  };

                  const updatedObj = newObjects.find((obj) => obj.id === layerId);
                  console.log("✅ Keyframes created. Updated object:", updatedObj);

                  return result;
                });

                // Also update the canvas node directly to ensure it reflects the new transform
                // This ensures the canvas and timeline are in sync
                if (canvasRef.current) {
                  canvasRef.current.setLayerPosition?.(layerId, transform.x, transform.y);
                  canvasRef.current.setLayerRotation?.(layerId, transform.rotation);
                  canvasRef.current.setLayerScale?.(layerId, transform.scaleX, transform.scaleY);
                }

                // Reset flag after state update completes
                setTimeout(() => {
                  isUpdatingKeyframesRef.current = false;
                }, 0);
              }}
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
