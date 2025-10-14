import { useCallback, useEffect, useReducer, useRef } from "react";

import type {
  TimelineState,
  TimelineHistory,
  AnimatedObject,
  Keyframe,
  PropertyType,
} from "@/components/admin/timeline/types";

// Split state: Static timeline data vs Dynamic playback state
interface TimelineData {
  objects: AnimatedObject[];
  duration: number;
  zoom: number;
  scrollOffset: number;
  history: TimelineHistory;
  // Add missing properties to match TimelineState
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

// Actions for static timeline data (expensive, rare updates)
type TimelineDataAction =
  | { type: "ADD_OBJECT"; payload: AnimatedObject }
  | { type: "REMOVE_OBJECT"; payload: { objectId: string } }
  | {
      type: "ADD_KEYFRAME";
      payload: { objectId: string; property: PropertyType; keyframe: Keyframe };
    }
  | {
      type: "REMOVE_KEYFRAME";
      payload: { objectId: string; property: PropertyType; keyframeId: string };
    }
  | {
      type: "MOVE_KEYFRAME";
      payload: { objectId: string; property: PropertyType; keyframeId: string; newTime: number };
    }
  | {
      type: "UPDATE_KEYFRAME";
      payload: {
        objectId: string;
        property: PropertyType;
        keyframeId: string;
        updates: Partial<Keyframe>;
      };
    }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_SCROLL"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_STATE"; payload: Partial<TimelineData> };

// Actions for playback state (cheap, frequent updates)
type PlaybackAction =
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_PLAYBACK_SPEED"; payload: number };

const initialTimelineData: TimelineData = {
  objects: [],
  duration: 10000,
  zoom: 100,
  scrollOffset: 0,
  history: { past: [], future: [] },
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
};

const initialPlaybackState: PlaybackState = {
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
};

// Reducer for static timeline data
function timelineDataReducer(state: TimelineData, action: TimelineDataAction): TimelineData {
  switch (action.type) {
    case "ADD_OBJECT":
      return {
        ...state,
        objects: [...state.objects, action.payload],
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };

    case "REMOVE_OBJECT": {
      const { objectId } = action.payload;

      return {
        ...state,
        objects: state.objects.filter((obj) => obj.id !== objectId),
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };
    }

    case "ADD_KEYFRAME": {
      const { objectId, property, keyframe } = action.payload;
      const objects = state.objects.map((obj) => {
        if (obj.id === objectId) {
          const propertyKeyframes = obj.properties[property] || [];

          return {
            ...obj,
            properties: {
              ...obj.properties,
              [property]: [...propertyKeyframes, keyframe].sort((a, b) => a.time - b.time),
            },
          };
        }

        return obj;
      });

      return {
        ...state,
        objects,
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };
    }

    case "REMOVE_KEYFRAME": {
      const { objectId, property, keyframeId } = action.payload;
      const objects = state.objects.map((obj) => {
        if (obj.id === objectId) {
          const propertyKeyframes = obj.properties[property] || [];

          return {
            ...obj,
            properties: {
              ...obj.properties,
              [property]: propertyKeyframes.filter((kf) => kf.id !== keyframeId),
            },
          };
        }

        return obj;
      });

      return {
        ...state,
        objects,
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };
    }

    case "MOVE_KEYFRAME": {
      const { objectId, property, keyframeId, newTime } = action.payload;
      const objects = state.objects.map((obj) => {
        if (obj.id === objectId) {
          const propertyKeyframes = obj.properties[property] || [];

          return {
            ...obj,
            properties: {
              ...obj.properties,
              [property]: propertyKeyframes
                .map((kf) => (kf.id === keyframeId ? { ...kf, time: newTime } : kf))
                .sort((a, b) => a.time - b.time),
            },
          };
        }

        return obj;
      });

      return {
        ...state,
        objects,
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };
    }

    case "UPDATE_KEYFRAME": {
      const { objectId, property, keyframeId, updates } = action.payload;
      const objects = state.objects.map((obj) => {
        if (obj.id === objectId) {
          const propertyKeyframes = obj.properties[property] || [];

          return {
            ...obj,
            properties: {
              ...obj.properties,
              [property]: propertyKeyframes.map((kf) =>
                kf.id === keyframeId ? { ...kf, ...updates } : kf,
              ),
            },
          };
        }

        return obj;
      });

      return {
        ...state,
        objects,
        history: {
          past: [...state.history.past, state],
          future: [],
        },
      };
    }

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(10, Math.min(action.payload, 1000)) };

    case "SET_SCROLL":
      return { ...state, scrollOffset: Math.max(0, action.payload) };

    case "SET_DURATION":
      return { ...state, duration: action.payload };

    case "UNDO": {
      if (state.history.past.length === 0) {
        return state;
      }

      const previousState = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      const newFuture = [state, ...state.history.future];

      return {
        ...previousState,
        history: {
          past: newPast,
          future: newFuture,
        },
      };
    }

    case "REDO": {
      if (state.history.future.length === 0) {
        return state;
      }

      const nextState = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      const newPast = [...state.history.past, state];

      return {
        ...nextState,
        history: {
          past: newPast,
          future: newFuture,
        },
      };
    }

    case "LOAD_STATE":
      return {
        ...state,
        ...action.payload,
        history: { past: [], future: [] },
      };

    default:
      return state;
  }
}

// Reducer for playback state
function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: Math.max(0, action.payload) };

    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };

    case "SET_PLAYBACK_SPEED":
      return { ...state, playbackSpeed: action.payload };

    default:
      return state;
  }
}

/**
 * Optimized timeline state management with split state architecture
 * - Static timeline data (objects, keyframes, etc.) - expensive updates, rare
 * - Dynamic playback state (time, playing) - cheap updates, frequent
 */
export function useOptimizedTimelineState() {
  // Static timeline data (expensive updates)
  const [timelineData, dispatchTimelineData] = useReducer(timelineDataReducer, initialTimelineData);

  // Dynamic playback state (cheap updates)
  const [playbackState, dispatchPlayback] = useReducer(playbackReducer, initialPlaybackState);

  // Ref for high-frequency time updates during playback (avoids React re-renders)
  const currentTimeRef = useRef(playbackState.currentTime);
  const isPlayingRef = useRef(playbackState.isPlaying);

  // Update refs when state changes
  useEffect(() => {
    currentTimeRef.current = playbackState.currentTime;
    isPlayingRef.current = playbackState.isPlaying;
    console.log("🔄 Updated refs:", {
      currentTime: currentTimeRef.current,
      isPlaying: isPlayingRef.current,
    });
  }, [playbackState.currentTime, playbackState.isPlaying]);

  // Actions for static timeline data
  const timelineActions = {
    addObject: useCallback((obj: AnimatedObject) => {
      dispatchTimelineData({ type: "ADD_OBJECT", payload: obj });
    }, []),

    removeObject: useCallback((objectId: string) => {
      dispatchTimelineData({ type: "REMOVE_OBJECT", payload: { objectId } });
    }, []),

    addKeyframe: useCallback((objectId: string, property: PropertyType, keyframe: Keyframe) => {
      dispatchTimelineData({ type: "ADD_KEYFRAME", payload: { objectId, property, keyframe } });
    }, []),

    removeKeyframe: useCallback((objectId: string, property: PropertyType, keyframeId: string) => {
      dispatchTimelineData({
        type: "REMOVE_KEYFRAME",
        payload: { objectId, property, keyframeId },
      });
    }, []),

    moveKeyframe: useCallback(
      (objectId: string, property: PropertyType, keyframeId: string, newTime: number) => {
        dispatchTimelineData({
          type: "MOVE_KEYFRAME",
          payload: { objectId, property, keyframeId, newTime },
        });
      },
      [],
    ),

    updateKeyframe: useCallback(
      (
        objectId: string,
        property: PropertyType,
        keyframeId: string,
        updates: Partial<Keyframe>,
      ) => {
        dispatchTimelineData({
          type: "UPDATE_KEYFRAME",
          payload: { objectId, property, keyframeId, updates },
        });
      },
      [],
    ),

    setZoom: useCallback((zoom: number) => {
      dispatchTimelineData({ type: "SET_ZOOM", payload: zoom });
    }, []),

    setScroll: useCallback((scrollOffset: number) => {
      dispatchTimelineData({ type: "SET_SCROLL", payload: scrollOffset });
    }, []),

    setDuration: useCallback((duration: number) => {
      dispatchTimelineData({ type: "SET_DURATION", payload: duration });
    }, []),

    undo: useCallback(() => {
      dispatchTimelineData({ type: "UNDO" });
    }, []),

    redo: useCallback(() => {
      dispatchTimelineData({ type: "REDO" });
    }, []),

    loadState: useCallback((newState: Partial<TimelineData>) => {
      dispatchTimelineData({ type: "LOAD_STATE", payload: newState });
    }, []),
  };

  // Actions for playback state
  const playbackActions = {
    // High-frequency time updates use ref to avoid React re-renders
    seek: useCallback(
      (time: number) => {
        const clampedTime = Math.max(0, Math.min(time, timelineData.duration));
        console.log("🎯 seek called:", {
          inputTime: time,
          clampedTime,
          isPlaying: isPlayingRef.current,
          refTime: currentTimeRef.current,
          stateTime: playbackState.currentTime,
          duration: timelineData.duration,
        });

        if (isPlayingRef.current) {
          // During playback, update ref only (no React re-render)
          currentTimeRef.current = clampedTime;
          console.log("📝 Updated ref time:", currentTimeRef.current);
        } else {
          // Manual seeking updates React state
          console.log("🔄 Updating React state time:", clampedTime);
          dispatchPlayback({
            type: "SET_CURRENT_TIME",
            payload: clampedTime,
          });
        }
      },
      [timelineData.duration, playbackState.currentTime],
    ),

    // Force React state update (for UI components that need to re-render)
    forceSeek: useCallback(
      (time: number) => {
        dispatchPlayback({
          type: "SET_CURRENT_TIME",
          payload: Math.max(0, Math.min(time, timelineData.duration)),
        });
      },
      [timelineData.duration],
    ),

    play: useCallback(() => {
      console.log("▶️ Play action called, current time:", currentTimeRef.current);
      dispatchPlayback({ type: "SET_PLAYING", payload: true });
    }, []),

    pause: useCallback(() => {
      console.log("⏸️ Pause action called, current time:", currentTimeRef.current);
      dispatchPlayback({ type: "SET_PLAYING", payload: false });
    }, []),

    setPlaybackSpeed: useCallback((speed: number) => {
      dispatchPlayback({ type: "SET_PLAYBACK_SPEED", payload: speed });
    }, []),
  };

  // Combined state for components that need everything
  const combinedState: TimelineState = {
    ...timelineData,
    ...playbackState,
  };

  return {
    // Split state
    timelineData,
    playbackState,

    // Combined state (for backward compatibility)
    state: combinedState,

    // Split actions
    timelineActions,
    playbackActions,

    // Combined actions (for backward compatibility)
    actions: {
      ...timelineActions,
      ...playbackActions,
    },

    // Refs for high-frequency access
    refs: {
      currentTime: currentTimeRef,
      isPlaying: isPlayingRef,
    },
  };
}
