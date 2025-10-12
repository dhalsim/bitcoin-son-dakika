import { useCallback, useReducer, useRef } from "react";

import type {
  TimelineState,
  // TimelineAction,
  TimelineHistory,
  AnimatedObject,
  Keyframe,
  PropertyType,
} from "./types";

interface TimelineReducerState extends TimelineState {
  history: TimelineHistory;
}

type TimelineReducerAction =
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
  | { type: "ADD_OBJECT"; payload: AnimatedObject }
  | { type: "REMOVE_OBJECT"; payload: { objectId: string } }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_SCROLL"; payload: number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_STATE"; payload: TimelineState };

const initialState: TimelineReducerState = {
  objects: [],
  duration: 10000,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  zoom: 100, // 100 pixels per second
  scrollOffset: 0,
  history: {
    past: [],
    future: [],
  },
};

function timelineReducer(
  state: TimelineReducerState,
  action: TimelineReducerAction,
): TimelineReducerState {
  switch (action.type) {
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
          past: [
            ...state.history.past,
            { type: "ADD_KEYFRAME", payload: action.payload, timestamp: Date.now() },
          ],
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
          past: [
            ...state.history.past,
            { type: "REMOVE_KEYFRAME", payload: action.payload, timestamp: Date.now() },
          ],
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
          past: [
            ...state.history.past,
            { type: "MOVE_KEYFRAME", payload: action.payload, timestamp: Date.now() },
          ],
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

      return { ...state, objects };
    }

    case "ADD_OBJECT": {
      return {
        ...state,
        objects: [...state.objects, action.payload],
        history: {
          past: [
            ...state.history.past,
            { type: "ADD_OBJECT", payload: action.payload, timestamp: Date.now() },
          ],
          future: [],
        },
      };
    }

    case "REMOVE_OBJECT": {
      return {
        ...state,
        objects: state.objects.filter((obj) => obj.id !== action.payload.objectId),
        history: {
          past: [
            ...state.history.past,
            { type: "REMOVE_OBJECT", payload: action.payload, timestamp: Date.now() },
          ],
          future: [],
        },
      };
    }

    case "SET_CURRENT_TIME":
      return { ...state, currentTime: Math.max(0, Math.min(action.payload, state.duration)) };

    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(10, Math.min(action.payload, 1000)) };

    case "SET_SCROLL":
      return { ...state, scrollOffset: Math.max(0, action.payload) };

    case "UNDO": {
      if (state.history.past.length === 0) {
        return state;
      }

      const lastAction = state.history.past[state.history.past.length - 1];
      // TODO: Implement proper undo logic based on action type

      return {
        ...state,
        history: {
          past: state.history.past.slice(0, -1),
          future: [lastAction, ...state.history.future],
        },
      };
    }

    case "REDO": {
      if (state.history.future.length === 0) {
        return state;
      }

      const nextAction = state.history.future[0];
      // TODO: Implement proper redo logic based on action type

      return {
        ...state,
        history: {
          past: [...state.history.past, nextAction],
          future: state.history.future.slice(1),
        },
      };
    }

    case "LOAD_STATE":
      return {
        ...action.payload,
        history: { past: [], future: [] },
      };

    default:
      return state;
  }
}

export function useTimelineState() {
  const [state, dispatch] = useReducer(timelineReducer, initialState);
  const animationFrameRef = useRef<number>(0);

  const addKeyframe = useCallback(
    (objectId: string, property: PropertyType, keyframe: Keyframe) => {
      dispatch({ type: "ADD_KEYFRAME", payload: { objectId, property, keyframe } });
    },
    [dispatch],
  );

  const removeKeyframe = useCallback(
    (objectId: string, property: PropertyType, keyframeId: string) => {
      dispatch({ type: "REMOVE_KEYFRAME", payload: { objectId, property, keyframeId } });
    },
    [],
  );

  const moveKeyframe = useCallback(
    (objectId: string, property: PropertyType, keyframeId: string, newTime: number) => {
      dispatch({ type: "MOVE_KEYFRAME", payload: { objectId, property, keyframeId, newTime } });
    },
    [],
  );

  const updateKeyframe = useCallback(
    (objectId: string, property: PropertyType, keyframeId: string, updates: Partial<Keyframe>) => {
      dispatch({ type: "UPDATE_KEYFRAME", payload: { objectId, property, keyframeId, updates } });
    },
    [],
  );

  const addObject = useCallback((object: AnimatedObject) => {
    dispatch({ type: "ADD_OBJECT", payload: object });
  }, []);

  const removeObject = useCallback((objectId: string) => {
    dispatch({ type: "REMOVE_OBJECT", payload: { objectId } });
  }, []);

  const seek = useCallback((time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time });
  }, []);

  const play = useCallback(() => {
    dispatch({ type: "SET_PLAYING", payload: true });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "SET_PLAYING", payload: false });
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const setScroll = useCallback((offset: number) => {
    dispatch({ type: "SET_SCROLL", payload: offset });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const loadState = useCallback((newState: TimelineState) => {
    dispatch({ type: "LOAD_STATE", payload: newState });
  }, []);

  const exportTimeline = useCallback(() => {
    return {
      version: "1.0.0",
      timeline: {
        objects: state.objects,
        duration: state.duration,
        currentTime: state.currentTime,
        isPlaying: false,
        playbackSpeed: state.playbackSpeed,
        zoom: state.zoom,
        scrollOffset: state.scrollOffset,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }, [state]);

  return {
    state,
    actions: {
      addKeyframe,
      removeKeyframe,
      moveKeyframe,
      updateKeyframe,
      addObject,
      removeObject,
      seek,
      play,
      pause,
      setZoom,
      setScroll,
      undo,
      redo,
      loadState,
      exportTimeline,
    },
  };
}
