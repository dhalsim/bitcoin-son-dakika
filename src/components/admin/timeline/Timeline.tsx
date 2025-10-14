import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimelineState } from "./useTimelineState";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineTracks } from "./TimelineTracks";
import type { AnimatedObject, TimelineState, PropertyType, Keyframe } from "./types";

interface TimelineProps {
  width?: number;
  height?: number;
  // Controlled state from parent
  state?: TimelineState;
  selectedObjectId?: string | null;
  // Callbacks
  onTimeUpdate?: (time: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onKeyframeAdd?: (objectId: string, property: PropertyType, keyframe: Keyframe) => void;
  onKeyframeRemove?: (objectId: string, property: PropertyType, keyframeId: string) => void;
  onKeyframeMove?: (
    objectId: string,
    property: PropertyType,
    keyframeId: string,
    newTime: number,
  ) => void;
  onSelectObject?: (objectId: string | null) => void;
  onDeleteObject?: (objectId: string) => void;
}

export function Timeline({
  width = 800,
  height = 300,
  state: externalState,
  selectedObjectId: externalSelectedId,
  onTimeUpdate,
  onPlayingChange,
  onKeyframeAdd,
  onKeyframeRemove,
  onKeyframeMove,
  onSelectObject,
  onDeleteObject,
}: TimelineProps) {
  // Always use internal state for playback to avoid render loops
  const { state: internalState, actions } = useTimelineState();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Sync external state to internal (one-way: external -> internal)
  useEffect(() => {
    if (externalState) {
      // Only sync non-time properties to avoid playback interference
      actions.setZoom(externalState.zoom);
      actions.setScroll(externalState.scrollOffset);

      // Sync objects if they changed
      if (JSON.stringify(externalState.objects) !== JSON.stringify(internalState.objects)) {
        actions.loadState(externalState);
      }

      // Sync playing state
      if (externalState.isPlaying !== internalState.isPlaying) {
        externalState.isPlaying ? actions.play() : actions.pause();
      }
    }
  }, [
    externalState?.objects,
    externalState?.zoom,
    externalState?.scrollOffset,
    externalState?.isPlaying,
  ]);

  // Sync time only when not playing
  useEffect(() => {
    if (
      externalState &&
      !internalState.isPlaying &&
      externalState.currentTime !== internalState.currentTime
    ) {
      actions.seek(externalState.currentTime);
    }
  }, [externalState?.currentTime, internalState.isPlaying]);

  const state = externalState || internalState; // Use external state if provided

  // Use external selection if provided
  const currentSelectedId =
    externalSelectedId !== undefined ? externalSelectedId : selectedObjectId;

  const handleSelectObject = (id: string | null) => {
    if (onSelectObject) {
      onSelectObject(id);
    } else {
      setSelectedObjectId(id);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(state.currentTime);

  // Keep ref in sync with state
  useEffect(() => {
    currentTimeRef.current = state.currentTime;
  }, [state.currentTime]);

  // Seek handler that updates both internal and external state
  const handleSeek = useCallback(
    (time: number) => {
      if (externalState && onTimeUpdate) {
        // Use external state - just call the callback
        onTimeUpdate(time);
      } else {
        // Use internal state
        actions.seek(time);
        onTimeUpdate?.(time);
      }
    },
    [actions, onTimeUpdate, externalState],
  );

  // Play/pause handlers
  const handlePlay = useCallback(() => {
    actions.play();
    onPlayingChange?.(true);
  }, [actions, onPlayingChange]);

  const handlePause = useCallback(() => {
    actions.pause();
    onPlayingChange?.(false);
    // Notify parent of current time when pausing
    onTimeUpdate?.(state.currentTime);
  }, [actions, onPlayingChange, onTimeUpdate, state.currentTime]);

  // Playback loop - completely independent during playback
  useEffect(() => {
    if (!state.isPlaying) return;

    let lastTime = performance.now();
    let animationFrame: number;

    const tick = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      const newTime = currentTimeRef.current + deltaTime * state.playbackSpeed;

      if (newTime >= state.duration) {
        actions.seek(state.duration);
        onTimeUpdate?.(state.duration);
        actions.pause();
        onPlayingChange?.(false);
        return;
      }

      // Update internal state only
      actions.seek(newTime);
      // Update the ref for next frame
      currentTimeRef.current = newTime;

      // Notify parent so it can update canvas interpolation
      onTimeUpdate?.(newTime);

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    state.isPlaying,
    state.duration,
    state.playbackSpeed,
    actions,
    onTimeUpdate,
    onPlayingChange,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          state.isPlaying ? handlePause() : handlePlay();
          break;
        case "Home":
          e.preventDefault();
          handleSeek(0);
          break;
        case "End":
          e.preventDefault();
          handleSeek(state.duration);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, state.currentTime - (e.shiftKey ? 1000 : 100)));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(state.duration, state.currentTime + (e.shiftKey ? 1000 : 100)));
          break;
        case "z":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.shiftKey ? actions.redo() : actions.undo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.isPlaying,
    state.currentTime,
    state.duration,
    actions,
    handleSeek,
    handlePlay,
    handlePause,
  ]);

  const timeToPixel = (time: number) => {
    return (time / 1000) * state.zoom;
  };

  return (
    <div className="timeline-container border-t bg-background">
      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <Button size="sm" variant="ghost" onClick={() => handleSeek(0)} title="Skip to start">
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={state.isPlaying ? "default" : "ghost"}
          onClick={() => (state.isPlaying ? handlePause() : handlePlay())}
          title={state.isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="text-xs text-muted-foreground font-mono min-w-[100px]">
          {(state.currentTime / 1000).toFixed(2)}s / {(state.duration / 1000).toFixed(2)}s
        </div>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => actions.undo()}
          disabled={state.history.past.length === 0}
          title="Undo (Cmd+Z)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => actions.redo()}
          disabled={state.history.future.length === 0}
          title="Redo (Cmd+Shift+Z)"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <div className="border-l pl-2 ml-2 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => actions.setZoom(state.zoom - 20)}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground min-w-[60px] text-center">
            {Math.round(state.zoom)}px/s
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => actions.setZoom(state.zoom + 20)}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline area */}
      <div ref={containerRef} className="relative overflow-auto" style={{ height: `${height}px` }}>
        <div className="flex">
          {/* Track labels */}
          <div className="w-40 flex-shrink-0 border-r bg-muted/10">
            <div className="h-8 border-b bg-muted/30" /> {/* Ruler space */}
            {state.objects.map((obj) => (
              <div
                key={obj.id}
                className={`h-10 border-b px-2 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                  currentSelectedId === obj.id
                    ? "bg-blue-500/20 hover:bg-blue-500/30"
                    : "hover:bg-muted/20"
                }`}
                onClick={() => handleSelectObject(obj.id)}
              >
                <span className="truncate flex-1">{obj.name || obj.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteObject) {
                      onDeleteObject(obj.id);
                    }
                  }}
                  className="ml-1 p-0.5 hover:bg-red-500/20 rounded"
                  title="Delete layer"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {/* Timeline content */}
          <div className="flex-1 relative">
            {/* Ruler */}
            <TimelineRuler duration={state.duration} zoom={state.zoom} onSeek={handleSeek} />

            {/* Tracks */}
            <TimelineTracks
              objects={state.objects}
              currentTime={state.currentTime}
              zoom={state.zoom}
              selectedObjectId={currentSelectedId}
              onAddKeyframe={onKeyframeAdd || actions.addKeyframe}
              onRemoveKeyframe={onKeyframeRemove || actions.removeKeyframe}
              onMoveKeyframe={onKeyframeMove || actions.moveKeyframe}
              onSelectObject={handleSelectObject}
            />

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none z-10"
              style={{
                left: `${timeToPixel(state.currentTime)}px`,
              }}
            >
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-background" />
            </div>
          </div>

          {/* Selected Layer Properties Panel */}
          {currentSelectedId && (
            <div className="w-64 flex-shrink-0 border-l bg-muted/5 overflow-y-auto">
              {(() => {
                const selectedObj = state.objects.find((o) => o.id === currentSelectedId);
                if (!selectedObj) return null;

                const getPropertyColor = (property: string) => {
                  switch (property) {
                    case "position":
                      return "bg-blue-500";
                    case "scale":
                      return "bg-green-500";
                    case "rotation":
                      return "bg-purple-500";
                    case "opacity":
                      return "bg-orange-500";
                    default:
                      return "bg-gray-500";
                  }
                };

                return (
                  <div className="p-3 space-y-3">
                    <div className="font-semibold text-sm border-b pb-2">
                      {selectedObj.name || selectedObj.id}
                    </div>

                    {/* Properties */}
                    {(["position", "scale", "rotation", "opacity"] as const).map((property) => {
                      const keyframes = selectedObj.properties[property] || [];
                      if (keyframes.length === 0) return null;

                      return (
                        <div key={property} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getPropertyColor(property)}`} />
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                              {property}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {keyframes.map((kf) => (
                              <div
                                key={kf.id}
                                className="text-[11px] bg-muted/30 px-2 py-1 rounded flex justify-between items-center"
                              >
                                <span>{(kf.time / 1000).toFixed(2)}s</span>
                                <button
                                  onClick={() =>
                                    actions.removeKeyframe(selectedObj.id, property, kf.id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete keyframe"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
