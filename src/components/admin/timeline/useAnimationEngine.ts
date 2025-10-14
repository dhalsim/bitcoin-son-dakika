import { useEffect, useRef } from "react";

import type { AnimatedObject, Keyframe } from "./types";

interface AnimationEngineProps {
  objects: AnimatedObject[];
  currentTime: number;
  isPlaying: boolean;
  onUpdateCanvas?: (objectId: string, properties: Record<string, any>) => void;
}

export function useAnimationEngine({
  objects,
  currentTime,
  isPlaying,
  onUpdateCanvas,
}: AnimationEngineProps) {
  const gsapTimelineRef = useRef<any>(null);

  // Interpolate value between keyframes
  const interpolateValue = (
    keyframes: Keyframe[],
    time: number,
    easing: string = "linear",
  ): any => {
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
      return after?.value;
    }

    if (!after) {
      return before.value;
    }

    // Calculate progress between keyframes
    const progress = (time - before.time) / (after.time - before.time);

    // Apply easing (simplified - GSAP will handle this in actual playback)
    let easedProgress = progress;
    if (typeof window !== "undefined" && window.gsap) {
      // Use GSAP's easing if available
      const ease = window.gsap.parseEase(before.easing || easing || "linear");
      easedProgress = ease(progress);
    }

    // Interpolate based on value type
    if (typeof before.value === "number" && typeof after.value === "number") {
      return before.value + (after.value - before.value) * easedProgress;
    }

    if (typeof before.value === "object" && typeof after.value === "object") {
      const result: any = {};
      for (const key in before.value) {
        if (typeof before.value[key] === "number" && typeof after.value[key] === "number") {
          result[key] = before.value[key] + (after.value[key] - before.value[key]) * easedProgress;
        } else {
          result[key] = before.value[key];
        }
      }

      return result;
    }

    return before.value;
  };

  // Get current property values for all objects at current time
  const getCurrentProperties = (obj: AnimatedObject) => {
    const properties: Record<string, any> = {};

    // Position
    if (obj.properties.position && obj.properties.position.length > 0) {
      properties.position = interpolateValue(obj.properties.position, currentTime);
    }

    // Scale
    if (obj.properties.scale && obj.properties.scale.length > 0) {
      properties.scale = interpolateValue(obj.properties.scale, currentTime);
    }

    // Rotation
    if (obj.properties.rotation && obj.properties.rotation.length > 0) {
      properties.rotation = interpolateValue(obj.properties.rotation, currentTime);
    }

    // Opacity
    if (obj.properties.opacity && obj.properties.opacity.length > 0) {
      properties.opacity = interpolateValue(obj.properties.opacity, currentTime);
    }

    return properties;
  };

  // Update canvas when time changes (scrubbing)
  useEffect(() => {
    if (isPlaying) {
      return;
    } // Don't update during playback, GSAP handles it

    objects.forEach((obj) => {
      // Check if object should be visible at current time
      if (currentTime < obj.startTime) {
        return;
      }

      if (obj.endTime && currentTime > obj.endTime) {
        return;
      }

      const properties = getCurrentProperties(obj);
      onUpdateCanvas?.(obj.id, properties);
    });
  }, [currentTime, objects, isPlaying]);

  // Build and control GSAP timeline for playback
  useEffect(() => {
    if (typeof window === "undefined" || !window.gsap) {
      return;
    }

    // Clean up previous timeline
    if (gsapTimelineRef.current) {
      gsapTimelineRef.current.kill();
    }

    // Create new GSAP timeline
    const tl = window.gsap.timeline({
      paused: true,
      onUpdate: () => {
        // Update canvas during playback
        const time = tl.time() * 1000; // Convert to ms
        objects.forEach((obj) => {
          if (time < obj.startTime) {
            return;
          }

          if (obj.endTime && time > obj.endTime) {
            return;
          }

          const properties = getCurrentProperties(obj);
          onUpdateCanvas?.(obj.id, properties);
        });
      },
    });

    // Add animations for each object
    objects.forEach((obj) => {
      // Position animations
      if (obj.properties.position && obj.properties.position.length > 0) {
        obj.properties.position.forEach((kf, idx) => {
          if (idx === 0) {
            return;
          } // Skip first keyframe as starting position

          const prevKf = obj.properties.position![idx - 1];
          const duration = (kf.time - prevKf.time) / 1000;

          tl.to(
            {},
            {
              duration,
              ease: kf.easing || "linear",
              onStart: () => {
                onUpdateCanvas?.(obj.id, { position: kf.value });
              },
            },
            prevKf.time / 1000,
          );
        });
      }

      // Similar for other properties...
      // (Simplified for now, full implementation would handle all properties)
    });

    gsapTimelineRef.current = tl;

    return () => {
      if (gsapTimelineRef.current) {
        gsapTimelineRef.current.kill();
      }
    };
  }, [objects, onUpdateCanvas]);

  // Control playback
  useEffect(() => {
    if (!gsapTimelineRef.current) {
      return;
    }

    if (isPlaying) {
      gsapTimelineRef.current.play();
    } else {
      gsapTimelineRef.current.pause();
    }
  }, [isPlaying]);

  // Seek when time changes externally
  useEffect(() => {
    if (!gsapTimelineRef.current || isPlaying) {
      return;
    }

    gsapTimelineRef.current.time(currentTime / 1000);
  }, [currentTime, isPlaying]);

  return {
    getCurrentProperties,
    interpolateValue,
  };
}
