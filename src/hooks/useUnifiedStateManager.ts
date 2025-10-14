import { useState, useCallback, useRef, useEffect } from "react";

import type {
  TimelineState,
  AnimatedObject,
  PropertyType,
  Keyframe,
} from "@/components/admin/timeline/types";
import type { CanvasEditorHandle } from "@/components/CanvasEditor";

export interface UnifiedState {
  timeline: TimelineState;
  selectedLayerId: string | null;
  // Current property values for each layer (interpolated at timeline.currentTime)
  currentLayerProperties: {
    [layerId: string]: {
      position: { x: number; y: number };
      rotation: number;
      scale: { x: number; y: number };
      opacity: number;
    };
  };
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getDefaultProperties = () => ({
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
  opacity: 1,
});

/**
 * Apply visibility rules to all objects at a specific time
 * This consolidates the visibility logic that was duplicated in 3 places
 */
const applyVisibilityRules = (
  objects: AnimatedObject[],
  time: number,
  canvasRef: React.RefObject<CanvasEditorHandle | null>,
  interpolatePropertyValue: (keyframes: Keyframe[], time: number) => any,
  syncPropertyToCanvas: (layerId: string, property: PropertyType, value: any) => void,
) => {
  if (!canvasRef.current) {
    return;
  }

  objects.forEach((obj) => {
    const shouldBeVisible = time >= obj.startTime;
    const properties = getDefaultProperties();

    // Interpolate all properties
    (["position", "scale", "rotation", "opacity"] as const).forEach((prop) => {
      const keyframes = obj.properties[prop];
      if (keyframes && keyframes.length > 0) {
        const interpolated = interpolatePropertyValue(keyframes, time);
        if (interpolated !== null) {
          properties[prop] = interpolated;
        }
      }
    });

    // Manage canvas node visibility
    if (obj.canvasNode) {
      const isOnCanvas = obj.canvasNode.getParent() !== null;

      if (shouldBeVisible && !isOnCanvas) {
        // Add node to canvas
        canvasRef.current?.addNodeToCanvas?.(obj.canvasNode);
      } else if (!shouldBeVisible && isOnCanvas) {
        // Remove node from canvas
        canvasRef.current?.removeNodeFromCanvas?.(obj.canvasNode);
      }
    }

    // Sync to canvas (only if visible)
    if (shouldBeVisible) {
      Object.entries(properties).forEach(([prop, value]) => {
        syncPropertyToCanvas(obj.id, prop as PropertyType, value);
      });
    }
  });
};

export function useUnifiedStateManager() {
  const canvasRef = useRef<CanvasEditorHandle | null>(null);
  const gsapTimelineRef = useRef<any>(null);

  const [state, setState] = useState<UnifiedState>({
    timeline: {
      objects: [],
      duration: 10000,
      currentTime: 0,
      isPlaying: false,
      playbackSpeed: 1,
      zoom: 100,
      scrollOffset: 0,
      history: { past: [], future: [] },
    },
    selectedLayerId: null,
    currentLayerProperties: {},
  });

  // Interpolate a property value at a given time with GSAP easing
  const interpolatePropertyValue = useCallback((keyframes: Keyframe[], time: number): any => {
    if (keyframes.length === 0) {
      return null;
    }

    if (keyframes.length === 1) {
      return keyframes[0].value;
    }

    // Find surrounding keyframes
    const before = keyframes.filter((kf) => kf.time <= time).pop();
    const after = keyframes.find((kf) => kf.time > time);

    if (!before) {
      return keyframes[0].value;
    }

    if (!after) {
      return before.value;
    }

    // GSAP-powered interpolation
    const progress = (time - before.time) / (after.time - before.time);

    // Use GSAP's easing if available
    let easedProgress = progress;
    if (typeof window !== "undefined" && window.gsap) {
      const ease = window.gsap.parseEase(before.easing || after.easing || "linear");
      easedProgress = ease(progress);
    }

    // Handle different value types
    if (typeof before.value === "number") {
      return before.value + (after.value - before.value) * easedProgress;
    }

    if (typeof before.value === "object" && before.value !== null) {
      const result: any = {};
      Object.keys(before.value).forEach((key) => {
        const beforeVal = before.value[key];
        const afterVal = after.value[key];
        result[key] = beforeVal + (afterVal - beforeVal) * easedProgress;
      });

      return result;
    }

    return before.value;
  }, []);

  // Sync property to canvas
  const syncPropertyToCanvas = useCallback(
    (layerId: string, property: PropertyType, value: any) => {
      if (!canvasRef.current) {
        return;
      }

      try {
        switch (property) {
          case "rotation":
            if (canvasRef.current.rotateLayer) {
              canvasRef.current.setLayerRotation?.(layerId, value);
            }

            break;
          case "opacity":
            canvasRef.current.setLayerOpacity?.(layerId, value);
            break;
          case "position":
            if (value && typeof value === "object") {
              canvasRef.current.setLayerPosition?.(layerId, value.x, value.y);
            }

            break;
          case "scale":
            if (value && typeof value === "object") {
              canvasRef.current.setLayerScale?.(layerId, value.x, value.y);
            }

            break;
        }
      } catch (error) {
        console.warn(`Failed to sync ${property} to canvas:`, error);
      }
    },
    [],
  );

  // Build GSAP timeline from keyframes
  const buildGSAPTimeline = useCallback(() => {
    if (typeof window === "undefined" || !window.gsap) {
      return null;
    }

    // Kill existing timeline
    if (gsapTimelineRef.current) {
      gsapTimelineRef.current.kill();
    }

    // Create new GSAP timeline
    const tl = window.gsap.timeline({
      paused: true,
      onUpdate: () => {
        const time = tl.time() * 1000; // Convert to ms
        // Update currentTime state
        setState((prev) => ({ ...prev, timeline: { ...prev.timeline, currentTime: time } }));

        // Use consolidated visibility helper
        applyVisibilityRules(
          state.timeline.objects,
          time,
          canvasRef,
          interpolatePropertyValue,
          syncPropertyToCanvas,
        );
      },
    });

    // Set timeline duration
    tl.duration(state.timeline.duration / 1000);

    gsapTimelineRef.current = tl;

    return tl;
  }, [
    state.timeline.objects,
    state.timeline.duration,
    interpolatePropertyValue,
    syncPropertyToCanvas,
  ]);

  // Play/pause/seek with GSAP
  const play = useCallback(() => {
    if (!gsapTimelineRef.current) {
      buildGSAPTimeline();
    }

    gsapTimelineRef.current?.play();
    setState((prev) => ({
      ...prev,
      timeline: { ...prev.timeline, isPlaying: true },
    }));
  }, [buildGSAPTimeline]);

  const pause = useCallback(() => {
    gsapTimelineRef.current?.pause();
    setState((prev) => ({
      ...prev,
      timeline: { ...prev.timeline, isPlaying: false },
    }));
  }, []);

  const seekWithGSAP = useCallback(
    (time: number) => {
      if (!gsapTimelineRef.current) {
        buildGSAPTimeline();
      }

      gsapTimelineRef.current?.time(time / 1000);
      // This will trigger onUpdate which updates state
    },
    [buildGSAPTimeline],
  );

  // Master update function
  const updateProperty = useCallback(
    (
      layerId: string,
      property: PropertyType,
      value: any,
      options: {
        source: "canvas" | "timeline" | "panel";
        createKeyframe?: boolean;
        time?: number;
      },
    ) => {
      const time = options.time ?? state.timeline.currentTime;

      setState((prev) => {
        const newState = { ...prev };

        // Update current property value
        if (!newState.currentLayerProperties[layerId]) {
          newState.currentLayerProperties[layerId] = getDefaultProperties();
        }

        newState.currentLayerProperties[layerId][property] = value;

        // Add keyframe if requested
        if (options.createKeyframe) {
          const objIndex = newState.timeline.objects.findIndex((o) => o.id === layerId);
          if (objIndex !== -1) {
            const obj = { ...newState.timeline.objects[objIndex] };
            const keyframe: Keyframe = {
              id: generateId(),
              time,
              value,
              easing: "linear",
            };

            // Add keyframe and sort by time
            obj.properties = {
              ...obj.properties,
              [property]: [...(obj.properties[property] || []), keyframe].sort(
                (a, b) => a.time - b.time,
              ),
            };

            newState.timeline.objects[objIndex] = obj;
          }
        }

        return newState;
      });

      // Sync to canvas (if not from canvas)
      if (options.source !== "canvas") {
        syncPropertyToCanvas(layerId, property, value);
      }
    },
    [state.timeline.currentTime, syncPropertyToCanvas],
  );

  // Handle transform changes from canvas
  const handleCanvasTransform = useCallback(
    (
      layerId: string,
      transform: { x: number; y: number; rotation: number; scaleX: number; scaleY: number },
    ) => {
      // Update all transformed properties
      updateProperty(
        layerId,
        "position",
        { x: transform.x, y: transform.y },
        {
          source: "canvas",
          createKeyframe: true,
        },
      );
      updateProperty(layerId, "rotation", transform.rotation, {
        source: "canvas",
        createKeyframe: true,
      });
      updateProperty(
        layerId,
        "scale",
        { x: transform.scaleX, y: transform.scaleY },
        {
          source: "canvas",
          createKeyframe: true,
        },
      );
    },
    [updateProperty],
  );

  // Seek to a specific time and interpolate all properties
  const seekToTime = useCallback(
    (time: number) => {
      if (state.timeline.isPlaying) {
        // If playing, use GSAP timeline
        seekWithGSAP(time);
      } else {
        // If scrubbing, manual interpolation is fine
        setState((prev) => {
          const newState = { ...prev };
          newState.timeline.currentTime = time;

          // Use consolidated visibility helper
          applyVisibilityRules(
            prev.timeline.objects,
            time,
            canvasRef,
            interpolatePropertyValue,
            syncPropertyToCanvas,
          );

          return newState;
        });
      }
    },
    [state.timeline.isPlaying, interpolatePropertyValue, syncPropertyToCanvas, seekWithGSAP],
  );

  // Add a new animated object
  const addAnimatedObject = useCallback((object: AnimatedObject) => {
    setState((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        objects: [...prev.timeline.objects, object],
      },
      currentLayerProperties: {
        ...prev.currentLayerProperties,
        [object.id]: getDefaultProperties(),
      },
    }));
  }, []);

  // Remove an animated object
  const removeAnimatedObject = useCallback((objectId: string) => {
    setState((prev) => {
      const newProperties = { ...prev.currentLayerProperties };
      delete newProperties[objectId];

      return {
        ...prev,
        timeline: {
          ...prev.timeline,
          objects: prev.timeline.objects.filter((o) => o.id !== objectId),
        },
        currentLayerProperties: newProperties,
      };
    });
  }, []);

  // Select a layer
  const selectLayer = useCallback((layerId: string | null) => {
    setState((prev) => ({ ...prev, selectedLayerId: layerId }));
  }, []);

  // Update timeline state
  const updateTimelineState = useCallback((updates: Partial<TimelineState>) => {
    setState((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        ...updates,
      },
    }));
  }, []);

  // Rebuild GSAP timeline when objects/keyframes change
  useEffect(() => {
    buildGSAPTimeline();
  }, [state.timeline.objects, state.timeline.duration, buildGSAPTimeline]);

  // Apply visibility rules when timeline changes or current time changes
  useEffect(() => {
    applyVisibilityRules(
      state.timeline.objects,
      state.timeline.currentTime,
      canvasRef,
      interpolatePropertyValue,
      syncPropertyToCanvas,
    );
  }, [
    state.timeline.objects,
    state.timeline.currentTime,
    interpolatePropertyValue,
    syncPropertyToCanvas,
  ]);

  return {
    state,
    canvasRef,
    updateProperty,
    handleCanvasTransform,
    seekToTime,
    addAnimatedObject,
    removeAnimatedObject,
    selectLayer,
    updateTimelineState,
    play,
    pause,
  };
}
