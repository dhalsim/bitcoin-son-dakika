import { useMemo, useState, useEffect } from "react";

import type { CanvasEditorHandle } from "@/components/CanvasEditor";

import { useAnimationEngine } from "./useAnimationEngine";
import { useCanvasRenderer } from "./useCanvasRenderer";
import { useOptimizedTimelineState } from "./useOptimizedTimelineState";

/**
 * Animation Controller - Facade pattern
 * Single Responsibility: Coordinate modules
 */
export function useAnimationController(canvasRef: React.RefObject<CanvasEditorHandle | null>) {
  // Optimized state management with split state
  const timeline = useOptimizedTimelineState();

  // Animation engine
  const engine = useAnimationEngine(
    timeline.state,
    (time) => {
      // Use optimized seek that doesn't trigger React re-renders during playback
      timeline.playbackActions.seek(time);
    },
    timeline.refs.currentTime,
  );

  // Force re-renders during playback by using a counter
  const [renderCounter, setRenderCounter] = useState(0);

  // Update render counter when playing to force re-renders
  useEffect(() => {
    if (!timeline.state.isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setRenderCounter((prev) => prev + 1);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [timeline.state.isPlaying]);

  // Get current frame - use ref for high-frequency updates during playback
  const currentFrame = useMemo(() => {
    // Use ref time during playback, state time during manual seeking
    const currentTime = timeline.state.isPlaying
      ? timeline.refs.currentTime.current
      : timeline.state.currentTime;

    return engine.getFrameAt(currentTime);
  }, [timeline.state.currentTime, timeline.state.isPlaying, renderCounter, engine]);

  useCanvasRenderer(canvasRef, currentFrame, timeline.timelineData.objects);

  // Simple API for UI
  return {
    canvasRef,

    // Timeline controls
    play: timeline.playbackActions.play,
    pause: timeline.playbackActions.pause,
    seek: timeline.playbackActions.forceSeek, // Use forceSeek for manual seeking (triggers re-render)
    setZoom: timeline.timelineActions.setZoom,
    setScroll: timeline.timelineActions.setScroll,

    // State
    state: timeline.state,
    currentFrame, // What should be rendered

    // Object management
    addObject: timeline.timelineActions.addObject,
    removeObject: timeline.timelineActions.removeObject,
    updateKeyframe: timeline.timelineActions.updateKeyframe,
    removeKeyframe: timeline.timelineActions.removeKeyframe,
    moveKeyframe: timeline.timelineActions.moveKeyframe,

    // History
    undo: timeline.timelineActions.undo,
    redo: timeline.timelineActions.redo,
    loadState: timeline.timelineActions.loadState,

    // Engine utilities
    getFrameAt: engine.getFrameAt,
    interpolateProperty: engine.interpolateProperty,

    // Refs for high-frequency access
    refs: timeline.refs,
  };
}
