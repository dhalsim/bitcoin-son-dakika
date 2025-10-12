import { useState, useRef } from "react";
import type { AnimatedObject, PropertyType, Keyframe } from "./types";

interface TimelineTracksProps {
  objects: AnimatedObject[];
  currentTime: number;
  zoom: number;
  selectedObjectId: string | null;
  onAddKeyframe: (objectId: string, property: PropertyType, keyframe: Keyframe) => void;
  onRemoveKeyframe: (objectId: string, property: PropertyType, keyframeId: string) => void;
  onMoveKeyframe: (
    objectId: string,
    property: PropertyType,
    keyframeId: string,
    newTime: number,
  ) => void;
  onSelectObject: (objectId: string) => void;
}

export function TimelineTracks({
  objects,
  currentTime,
  zoom,
  selectedObjectId,
  onAddKeyframe,
  onRemoveKeyframe,
  onMoveKeyframe,
  onSelectObject,
}: TimelineTracksProps) {
  const [draggingKeyframe, setDraggingKeyframe] = useState<{
    objectId: string;
    property: PropertyType;
    keyframeId: string;
    startX: number;
    startTime: number;
  } | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  const timeToPixel = (time: number) => (time / 1000) * zoom;

  const handleKeyframeMouseDown = (
    e: React.MouseEvent,
    objectId: string,
    property: PropertyType,
    keyframe: Keyframe,
  ) => {
    e.stopPropagation();
    setDraggingKeyframe({
      objectId,
      property,
      keyframeId: keyframe.id,
      startX: e.clientX,
      startTime: keyframe.time,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingKeyframe || !trackRef.current) return;

    const deltaX = e.clientX - draggingKeyframe.startX;
    const deltaTime = (deltaX / zoom) * 1000;
    const newTime = Math.max(0, draggingKeyframe.startTime + deltaTime);

    onMoveKeyframe(
      draggingKeyframe.objectId,
      draggingKeyframe.property,
      draggingKeyframe.keyframeId,
      newTime,
    );
  };

  const handleMouseUp = () => {
    setDraggingKeyframe(null);
  };

  // Add mouse move/up listeners when dragging
  if (draggingKeyframe) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  } else {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  const handleTrackClick = (e: React.MouseEvent, objectId: string, property: PropertyType) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, (x / zoom) * 1000);

    // Create a new keyframe at this time
    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time,
      value: getCurrentValue(objectId, property, time),
      easing: "linear",
    };

    onAddKeyframe(objectId, property, newKeyframe);
  };

  const getCurrentValue = (objectId: string, property: PropertyType, time: number): any => {
    const obj = objects.find((o) => o.id === objectId);
    if (!obj) return null;

    const keyframes = obj.properties[property] || [];
    if (keyframes.length === 0) {
      // Return default values
      switch (property) {
        case "position":
          return { x: 0, y: 0 };
        case "scale":
          return { x: 1, y: 1 };
        case "rotation":
          return 0;
        case "opacity":
          return 1;
        default:
          return null;
      }
    }

    // Find surrounding keyframes and interpolate
    const before = keyframes.filter((kf) => kf.time <= time).pop();
    const after = keyframes.find((kf) => kf.time > time);

    if (!before) return after?.value;
    if (!after) return before.value;

    // Simple linear interpolation
    const progress = (time - before.time) / (after.time - before.time);

    if (typeof before.value === "number" && typeof after.value === "number") {
      return before.value + (after.value - before.value) * progress;
    }

    if (typeof before.value === "object" && typeof after.value === "object") {
      const result: any = {};
      for (const key in before.value) {
        result[key] = before.value[key] + (after.value[key] - before.value[key]) * progress;
      }
      return result;
    }

    return before.value;
  };

  // Get all keyframes for an object (from all properties) with property info
  const getAllKeyframes = (obj: AnimatedObject) => {
    const keyframes: Array<{ property: PropertyType; keyframe: Keyframe }> = [];
    (["position", "scale", "rotation", "opacity"] as const).forEach((property) => {
      (obj.properties[property] || []).forEach((kf) => {
        keyframes.push({ property, keyframe: kf });
      });
    });
    return keyframes.sort((a, b) => a.keyframe.time - b.keyframe.time);
  };

  // Color coding for different properties
  const getPropertyColor = (property: PropertyType) => {
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
    <div ref={trackRef} className="relative">
      {objects.map((obj) => {
        const allKeyframes = getAllKeyframes(obj);
        const isSelected = selectedObjectId === obj.id;

        return (
          <div
            key={obj.id}
            className={`h-10 border-b relative cursor-pointer transition-colors ${
              isSelected ? "bg-blue-500/10 hover:bg-blue-500/15" : "hover:bg-muted/10"
            }`}
            onClick={() => onSelectObject(obj.id)}
          >
            {/* All keyframes for this object */}
            {allKeyframes.map(({ property, keyframe }) => (
              <div
                key={`${property}-${keyframe.id}`}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 ${getPropertyColor(property)} rounded-full cursor-move hover:scale-125 transition-transform border-2 border-background shadow-sm`}
                style={{
                  left: `${timeToPixel(keyframe.time)}px`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleKeyframeMouseDown(e, obj.id, property, keyframe);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${property} keyframe?`)) {
                    onRemoveKeyframe(obj.id, property, keyframe.id);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObject(obj.id);
                }}
                title={`${property}: ${(keyframe.time / 1000).toFixed(2)}s`}
              />
            ))}
          </div>
        );
      })}

      {objects.length === 0 && (
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          No objects to animate. Add layers to your canvas first.
        </div>
      )}
    </div>
  );
}
