// Animation Timeline Types

export type EasingType =
  | "linear"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3.in"
  | "power3.out"
  | "power3.inOut"
  | "back.in"
  | "back.out"
  | "back.inOut"
  | "elastic.in"
  | "elastic.out"
  | "elastic.inOut"
  | "bounce.in"
  | "bounce.out"
  | "bounce.inOut";

export type PropertyType = "position" | "scale" | "rotation" | "opacity" | "custom";

export interface Keyframe<T = any> {
  time: number; // milliseconds
  value: T;
  easing?: EasingType;
  id: string;
}

export interface PropertyTrack {
  property: PropertyType;
  keyframes: Keyframe[];
}

export interface AnimatedObject {
  id: string;
  type: "text" | "image" | "overlay";
  name: string;
  properties: {
    position?: Keyframe<{ x: number; y: number }>[];
    scale?: Keyframe<{ x: number; y: number }>[];
    rotation?: Keyframe<number>[];
    opacity?: Keyframe<number>[];
    [key: string]: Keyframe<any>[] | undefined;
  };
  startTime: number; // When object first appears
  endTime?: number; // When object disappears (optional)
  // Reference to the actual Konva node
  canvasNode?: any; // Konva.Node (Group, Image, etc.)
}

export interface TimelineState {
  objects: AnimatedObject[];
  duration: number; // Total animation duration in ms
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  zoom: number; // Pixels per second
  scrollOffset: number; // Horizontal scroll position
  history: TimelineHistory;
}

export interface TimelineAction {
  type:
    | "ADD_KEYFRAME"
    | "REMOVE_KEYFRAME"
    | "MOVE_KEYFRAME"
    | "UPDATE_KEYFRAME"
    | "ADD_OBJECT"
    | "REMOVE_OBJECT"
    | "UPDATE_OBJECT";
  payload: any;
  timestamp: number;
}

export interface TimelineHistory {
  past: TimelineState[];
  future: TimelineState[];
}

// Helper type for keyframe with computed properties
export interface RenderedKeyframe extends Keyframe {
  x: number; // Pixel position on timeline
  selected: boolean;
  property: PropertyType;
  objectId: string;
}

// Timeline selection state
export interface TimelineSelection {
  objectIds: string[];
  keyframeIds: string[];
}

// Export format
export interface AnimationExport {
  version: string;
  timeline: TimelineState;
  metadata: {
    createdAt: string;
    updatedAt: string;
    name?: string;
    description?: string;
  };
}
