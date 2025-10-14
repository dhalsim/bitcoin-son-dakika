import { useState, useCallback } from "react";

import type {
  TimelineState,
  AnimatedObject,
  PropertyType,
  Keyframe,
} from "@/components/admin/timeline/types";

/**
 * Pure timeline state management - no side effects
 * Single Responsibility: Manage timeline data
 */
export function useTimelineState() {
  const [state, setState] = useState<TimelineState>({
    objects: [],
    duration: 10000,
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    zoom: 100,
    scrollOffset: 0,
    history: { past: [], future: [] },
  });

  // Pure state mutations
  const actions = {
    seek: useCallback((time: number) => {
      setState((s) => ({ ...s, currentTime: time }));
    }, []),

    play: useCallback(() => {
      setState((s) => ({ ...s, isPlaying: true }));
    }, []),

    pause: useCallback(() => {
      setState((s) => ({ ...s, isPlaying: false }));
    }, []),

    setZoom: useCallback((zoom: number) => {
      setState((s) => ({ ...s, zoom }));
    }, []),

    setScroll: useCallback((scrollOffset: number) => {
      setState((s) => ({ ...s, scrollOffset }));
    }, []),

    addObject: useCallback((obj: AnimatedObject) => {
      setState((s) => ({ ...s, objects: [...s.objects, obj] }));
    }, []),

    removeObject: useCallback((objectId: string) => {
      setState((s) => ({
        ...s,
        objects: s.objects.filter((o) => o.id !== objectId),
      }));
    }, []),

    updateKeyframe: useCallback((objectId: string, property: PropertyType, keyframe: Keyframe) => {
      setState((s) => ({
        ...s,
        objects: s.objects.map((obj) => {
          if (obj.id !== objectId) {
            return obj;
          }

          const newProperties = { ...obj.properties };
          const existingKeyframes = newProperties[property] || [];

          // Check if keyframe already exists at this time
          const existingIndex = existingKeyframes.findIndex((kf) => kf.time === keyframe.time);

          if (existingIndex >= 0) {
            // Update existing keyframe
            existingKeyframes[existingIndex] = keyframe;
          } else {
            // Add new keyframe and sort by time
            existingKeyframes.push(keyframe);
            existingKeyframes.sort((a, b) => a.time - b.time);
          }

          newProperties[property] = existingKeyframes;

          return {
            ...obj,
            properties: newProperties,
          };
        }),
      }));
    }, []),

    removeKeyframe: useCallback((objectId: string, property: PropertyType, keyframeId: string) => {
      setState((s) => ({
        ...s,
        objects: s.objects.map((obj) => {
          if (obj.id !== objectId) {
            return obj;
          }

          const newProperties = { ...obj.properties };
          const existingKeyframes = newProperties[property] || [];

          newProperties[property] = existingKeyframes.filter((kf) => kf.id !== keyframeId);

          return {
            ...obj,
            properties: newProperties,
          };
        }),
      }));
    }, []),

    moveKeyframe: useCallback(
      (objectId: string, property: PropertyType, keyframeId: string, newTime: number) => {
        setState((s) => ({
          ...s,
          objects: s.objects.map((obj) => {
            if (obj.id !== objectId) {
              return obj;
            }

            const newProperties = { ...obj.properties };
            const existingKeyframes = newProperties[property] || [];

            newProperties[property] = existingKeyframes
              .map((kf) => (kf.id === keyframeId ? { ...kf, time: newTime } : kf))
              .sort((a, b) => a.time - b.time);

            return {
              ...obj,
              properties: newProperties,
            };
          }),
        }));
      },
      [],
    ),

    loadState: useCallback((newState: Partial<TimelineState>) => {
      setState((s) => ({ ...s, ...newState }));
    }, []),

    undo: useCallback(() => {
      setState((s) => {
        if (s.history.past.length === 0) {
          return s;
        }

        const previous = s.history.past[s.history.past.length - 1];
        const newPast = s.history.past.slice(0, -1);
        const newFuture = [s, ...s.history.future];

        return {
          ...previous,
          history: {
            past: newPast,
            future: newFuture,
          },
        };
      });
    }, []),

    redo: useCallback(() => {
      setState((s) => {
        if (s.history.future.length === 0) {
          return s;
        }

        const next = s.history.future[0];
        const newFuture = s.history.future.slice(1);
        const newPast = [...s.history.past, s];

        return {
          ...next,
          history: {
            past: newPast,
            future: newFuture,
          },
        };
      });
    }, []),
  };

  return { state, actions };
}
