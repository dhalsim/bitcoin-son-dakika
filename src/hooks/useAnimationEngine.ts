import { useCallback, useEffect, useRef } from "react";

import type { TimelineState, Keyframe } from "@/components/admin/timeline/types";

export interface RenderFrame {
  id: string;
  visible: boolean;
  properties: {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    opacity: number;
  };
}

/**
 * Pure animation engine - no side effects
 * Single Responsibility: Interpolation and playback
 */
export function useAnimationEngine(
  state: TimelineState,
  onTimeUpdate?: (time: number, frame: RenderFrame[]) => void,
  currentTimeRef?: React.RefObject<number>,
) {
  const gsapTimelineRef = useRef<any>(null);

  // Pure function - no side effects
  const interpolateProperty = useCallback(
    (keyframes: Keyframe[] | undefined, time: number): any => {
      if (!keyframes || keyframes.length === 0) {
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
    },
    [],
  );

  // Get all object properties at a specific time
  const getFrameAt = useCallback(
    (time: number): RenderFrame[] => {
      return state.objects.map((obj) => {
        const position = interpolateProperty(obj.properties.position, time) || { x: 0, y: 0 };
        const rotation = interpolateProperty(obj.properties.rotation, time) || 0;
        const scale = interpolateProperty(obj.properties.scale, time) || { x: 1, y: 1 };
        const opacity = interpolateProperty(obj.properties.opacity, time) || 1;

        return {
          id: obj.id,
          visible: time >= obj.startTime,
          properties: {
            position,
            rotation,
            scale,
            opacity,
          },
        };
      });
    },
    [state.objects, interpolateProperty],
  );

  // Get current frame using ref if available, otherwise use state
  const getCurrentFrame = useCallback((): RenderFrame[] => {
    const currentTime = currentTimeRef?.current ?? state.currentTime;

    return getFrameAt(currentTime);
  }, [getFrameAt, state.currentTime, currentTimeRef]);

  // Create GSAP timeline once
  useEffect(() => {
    if (typeof window === "undefined" || !window.gsap) {
      return;
    }

    console.log("🎬 Creating GSAP timeline:", {
      duration: state.duration,
    });

    // Kill existing timeline
    if (gsapTimelineRef.current) {
      console.log("💀 Killing existing timeline");
      gsapTimelineRef.current.kill();
    }

    // Create new GSAP timeline
    const tl = window.gsap.timeline({
      paused: true,
      onUpdate: () => {
        const time = tl.time() * 1000; // Convert to ms
        // Only log occasionally to avoid spam
        if (Math.floor(time) % 1000 === 0) {
          console.log("⏰ GSAP onUpdate:", {
            gsapTime: tl.time(),
            convertedTime: time,
            refTime: currentTimeRef?.current,
            stateTime: state.currentTime,
          });
        }

        const frame = getFrameAt(time);
        onTimeUpdate?.(time, frame);
      },
    });

    // Set timeline duration
    const durationInSeconds = state.duration / 1000;

    // Create a simple animation to give the timeline duration
    tl.to({}, { duration: durationInSeconds, ease: "none" });

    console.log("▶️ GSAP timeline created:", {
      duration: tl.duration(),
      totalDuration: state.duration,
      durationInSeconds,
    });

    gsapTimelineRef.current = tl;

    return () => {
      if (gsapTimelineRef.current) {
        gsapTimelineRef.current.kill();
      }
    };
  }, [state.duration]); // Only recreate when duration changes

  // Control playback and time
  useEffect(() => {
    if (!gsapTimelineRef.current) {
      return;
    }

    const tl = gsapTimelineRef.current;

    if (state.isPlaying) {
      // Set the timeline to the current time and play
      const currentTimeInSeconds = (currentTimeRef?.current ?? state.currentTime) / 1000;
      tl.time(currentTimeInSeconds);
      console.log("▶️ Playing timeline at time:", currentTimeInSeconds);
      tl.play();
    } else {
      // Pause and update the current time
      tl.pause();
      const pausedTime = tl.time() * 1000;
      console.log("⏸️ Paused timeline at time:", pausedTime);
      // Update the ref with the paused time
      if (currentTimeRef) {
        currentTimeRef.current = pausedTime;
      }
    }
  }, [state.isPlaying, currentTimeRef]);

  // Seek when time changes externally (manual seeking)
  useEffect(() => {
    if (!gsapTimelineRef.current || state.isPlaying) {
      return;
    }

    const timeInSeconds = state.currentTime / 1000;
    gsapTimelineRef.current.time(timeInSeconds);
    console.log("🎯 Manual seek to:", timeInSeconds);
  }, [state.currentTime, state.isPlaying]);

  return {
    getFrameAt,
    getCurrentFrame,
    interpolateProperty,
    // Expose GSAP timeline for external control if needed
    gsapTimeline: gsapTimelineRef.current,
  };
}
