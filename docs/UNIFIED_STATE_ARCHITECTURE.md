# Unified State Architecture for Timeline + Canvas + Panel

## Problem

We have three independent systems that need to stay in sync:

1. **Canvas (Konva)** - Visual editing, dragging, rotating
2. **Timeline** - Keyframe management, animation
3. **Property Panel (UploadReels)** - Direct value editing

Currently, they don't communicate well. Changes in one don't reflect in others.

## Solution: Single Source of Truth with Event-Driven Updates

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         UploadReels Component                   │
│  ┌───────────────────────────────────────────┐  │
│  │    TimelineState (Single Source)          │  │
│  │    - objects: AnimatedObject[]            │  │
│  │    - currentTime: number                  │  │
│  │    - All keyframes                        │  │
│  └────────────────┬──────────────────────────┘  │
│                   │                             │
│    ┌──────────────┼──────────────┐             │
│    ▼              ▼              ▼             │
│  Canvas ◄──► Timeline ◄──► Property Panel      │
└─────────────────────────────────────────────────┘

All updates go through central state management
```

## Core Concept: Unified State Manager

### 1. State Structure

```typescript
// In UploadReels.tsx
interface UnifiedState {
  // Timeline data
  timeline: TimelineState;

  // Current selections
  selectedLayerId: string | null;
  currentTime: number;

  // Derived/computed
  currentLayerProperties: {
    [layerId: string]: {
      position: { x: number; y: number };
      rotation: number;
      scale: { x: number; y: number };
      opacity: number;
    };
  };
}
```

### 2. Central Update Function

```typescript
const useUnifiedStateManager = () => {
  const [state, setState] = useState<UnifiedState>(initialState);
  const canvasRef = useRef<CanvasEditorHandle>(null);

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
      const time = options.time ?? state.currentTime;

      // 1. Update state
      setState((prev) => {
        const newState = { ...prev };

        // Update current property value
        if (!newState.currentLayerProperties[layerId]) {
          newState.currentLayerProperties[layerId] = getDefaultProperties();
        }
        newState.currentLayerProperties[layerId][property] = value;

        // Add keyframe if requested
        if (options.createKeyframe) {
          const obj = newState.timeline.objects.find((o) => o.id === layerId);
          if (obj) {
            const keyframe: Keyframe = {
              id: generateId(),
              time,
              value,
              easing: "linear",
            };
            obj.properties[property] = [...(obj.properties[property] || []), keyframe].sort(
              (a, b) => a.time - b.time,
            );
          }
        }

        return newState;
      });

      // 2. Sync to canvas (if not from canvas)
      if (options.source !== "canvas") {
        syncPropertyToCanvas(layerId, property, value);
      }

      // 3. Timeline will re-render automatically via state
    },
    [state.currentTime],
  );

  // Sync state to canvas
  const syncPropertyToCanvas = (layerId: string, property: PropertyType, value: any) => {
    if (!canvasRef.current) return;

    switch (property) {
      case "rotation":
        canvasRef.current.setLayerRotation(layerId, value);
        break;
      case "opacity":
        canvasRef.current.setLayerOpacity(layerId, value);
        break;
      case "position":
        canvasRef.current.setLayerPosition(layerId, value.x, value.y);
        break;
      case "scale":
        canvasRef.current.setLayerScale(layerId, value.x, value.y);
        break;
    }
  };

  // Sync canvas to state (when user interacts with canvas)
  const handleCanvasChange = (layerId: string, property: PropertyType, value: any) => {
    updateProperty(layerId, property, value, {
      source: "canvas",
      createKeyframe: false, // Don't auto-create keyframes on drag
    });
  };

  // Apply timeline state at specific time
  const seekToTime = (time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));

    // Interpolate all properties for all objects at this time
    state.timeline.objects.forEach((obj) => {
      const properties = interpolatePropertiesAtTime(obj, time);
      Object.entries(properties).forEach(([prop, value]) => {
        syncPropertyToCanvas(obj.id, prop as PropertyType, value);
      });
    });
  };

  return {
    state,
    updateProperty,
    handleCanvasChange,
    seekToTime,
    canvasRef,
  };
};
```

### 3. Canvas Integration

Extend `CanvasEditor` with new methods and callbacks:

```typescript
// CanvasEditor.tsx additions
export type CanvasEditorHandle = {
  // ... existing methods

  // New: Set properties programmatically
  setLayerRotation: (layerId: string, rotation: number) => void;
  setLayerPosition: (layerId: string, x: number, y: number) => void;
  setLayerScale: (layerId: string, scaleX: number, scaleY: number) => void;

  // New: Get current property values
  getLayerTransform: (layerId: string) => {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
  } | null;
};

export interface CanvasEditorProps {
  // ... existing props

  // New: Transform change callback
  onTransformChange?: (
    layerId: string,
    transform: {
      x: number;
      y: number;
      rotation: number;
      scaleX: number;
      scaleY: number;
    },
  ) => void;
}

// Implementation
const CanvasEditor = forwardRef((props, ref) => {
  // ... existing code

  // Add transform listener
  useEffect(() => {
    if (!transformerRef.current || !props.onTransformChange) return;

    const handleTransformEnd = () => {
      const nodes = transformerRef.current.nodes();
      if (nodes.length === 1) {
        const node = nodes[0];
        props.onTransformChange(node.id(), {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        });
      }
    };

    const stage = stageRef.current;
    stage.on("transformend", handleTransformEnd);
    stage.on("dragend", handleTransformEnd);

    return () => {
      stage.off("transformend", handleTransformEnd);
      stage.off("dragend", handleTransformEnd);
    };
  }, [props.onTransformChange]);

  // Imperative methods
  useImperativeHandle(ref, () => ({
    // ... existing methods

    setLayerRotation: (layerId, rotation) => {
      const node = layersMapRef.current.get(layerId);
      if (node) {
        node.rotation(rotation);
        node.getLayer()?.batchDraw();
      }
    },

    setLayerPosition: (layerId, x, y) => {
      const node = layersMapRef.current.get(layerId);
      if (node) {
        node.position({ x, y });
        node.getLayer()?.batchDraw();
      }
    },

    setLayerScale: (layerId, scaleX, scaleY) => {
      const node = layersMapRef.current.get(layerId);
      if (node) {
        node.scale({ x: scaleX, y: scaleY });
        node.getLayer()?.batchDraw();
      }
    },

    getLayerTransform: (layerId) => {
      const node = layersMapRef.current.get(layerId);
      if (!node) return null;
      return {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        opacity: node.opacity(),
      };
    },
  }));
});
```

### 4. Timeline Integration

```typescript
// Timeline.tsx - Use external state
interface TimelineProps {
  state: TimelineState; // Controlled component
  onStateChange: (newState: TimelineState) => void;
  onTimeChange: (time: number) => void;
  onKeyframeChange: (objectId: string, property: PropertyType, keyframe: Keyframe) => void;
}

export function Timeline({
  state, // Now controlled from parent
  onStateChange,
  onTimeChange,
  onKeyframeChange,
}: TimelineProps) {
  // Use external state, emit changes via callbacks

  const handleKeyframeMove = (objId, prop, kfId, newTime) => {
    // Find keyframe
    const obj = state.objects.find((o) => o.id === objId);
    const keyframe = obj?.properties[prop]?.find((kf) => kf.id === kfId);

    if (keyframe) {
      onKeyframeChange(objId, prop, { ...keyframe, time: newTime });
    }
  };

  // ...
}
```

### 5. UploadReels Integration

```typescript
// UploadReels.tsx
export default function UploadReels() {
  const {
    state,
    updateProperty,
    handleCanvasChange,
    seekToTime,
    canvasRef
  } = useUnifiedStateManager();

  const selectedLayer = state.selectedLayerId
    ? state.currentLayerProperties[state.selectedLayerId]
    : null;

  return (
    <Dialog>
      {/* Timeline */}
      <Timeline
        state={state.timeline}
        onStateChange={(newState) => {
          // Update full timeline state
        }}
        onTimeChange={seekToTime}
        onKeyframeChange={(objId, prop, kf) => {
          updateProperty(objId, prop, kf.value, {
            source: 'timeline',
            createKeyframe: false,
            time: kf.time
          });
        }}
      />

      {/* Canvas */}
      <CanvasEditor
        ref={canvasRef}
        onTransformChange={(layerId, transform) => {
          handleCanvasChange(layerId, 'position', { x: transform.x, y: transform.y });
          handleCanvasChange(layerId, 'rotation', transform.rotation);
          handleCanvasChange(layerId, 'scale', { x: transform.scaleX, y: transform.scaleY });
        }}
      />

      {/* Property Panel */}
      {selectedLayer && (
        <div className="property-panel">
          <Label>Rotation</Label>
          <Input
            type="number"
            value={selectedLayer.rotation}
            onChange={(e) => {
              updateProperty(state.selectedLayerId!, 'rotation', parseFloat(e.target.value), {
                source: 'panel',
                createKeyframe: true
              });
            }}
          />

          <Label>Opacity</Label>
          <Slider
            value={[selectedLayer.opacity]}
            onValueChange={([value]) => {
              updateProperty(state.selectedLayerId!, 'opacity', value, {
                source: 'panel',
                createKeyframe: true
              });
            }}
          />

          {/* ... other properties */}
        </div>
      )}
    </Dialog>
  );
}
```

## Data Flow Examples

### Example 1: User Rotates Layer on Canvas

```
1. User drags rotation handle on Konva canvas
2. Canvas fires onTransformChange({ rotation: 45 })
3. handleCanvasChange('layer1', 'rotation', 45)
4. State updates: currentLayerProperties.layer1.rotation = 45
5. Timeline re-renders showing updated state
6. Property panel shows new value: 45°
```

### Example 2: User Edits Value in Property Panel

```
1. User types "90" in rotation input
2. onChange fires updateProperty('layer1', 'rotation', 90, { source: 'panel', createKeyframe: true })
3. State updates:
   - currentLayerProperties.layer1.rotation = 90
   - New keyframe added at currentTime
4. syncPropertyToCanvas('layer1', 'rotation', 90)
5. Canvas layer rotates to 90°
6. Timeline shows new keyframe at current time
```

### Example 3: User Moves Playhead on Timeline

```
1. User drags playhead to 2.5s
2. seekToTime(2500) called
3. For each object:
   - Interpolate all properties at t=2.5s
   - syncPropertyToCanvas for each property
4. Canvas updates to show interpolated state
5. Property panel updates to show interpolated values
```

### Example 4: User Moves Keyframe on Timeline

```
1. User drags keyframe from 2s to 3s
2. onKeyframeChange('layer1', 'opacity', { ...kf, time: 3000 })
3. updateProperty called with new time
4. State updates keyframe time
5. If playhead is at affected time range:
   - Re-interpolate properties
   - Update canvas
   - Update property panel
```

## Benefits

✅ **Single Source of Truth**

- All data in one place
- No sync bugs
- Clear data ownership

✅ **Bidirectional Sync**

- Canvas → State → Timeline → Panel
- Timeline → State → Canvas → Panel
- Panel → State → Canvas → Timeline

✅ **GSAP Integration**

- **Professional easing functions**: power, bounce, elastic, back, etc.
- **Smooth playback** with GSAP timeline
- **Optimized performance** with GSAP's tweening engine
- **Consistent interpolation** across all properties
- **Manual interpolation** for scrubbing (when paused)

✅ **Undo/Redo Support**

- All changes go through central state
- Easy to track history
- Can implement undo stack

✅ **Timeline Scrubbing**

- Seek to any time
- All systems update automatically
- GSAP interpolation when playing, manual when scrubbing

✅ **Property Editing**

- Edit anywhere (canvas/timeline/panel)
- Changes reflect everywhere
- Keyframes created on demand

## Implementation Checklist

- [x] Create `useUnifiedStateManager` hook
- [x] Extend `CanvasEditor` with new methods
- [x] Add `onTransformChange` callback to Canvas
- [x] Make Timeline controlled component
- [x] **Integrate GSAP for professional easing and smooth playback**
- [x] **Add GSAP timeline management**
- [x] **Update UploadReels to use unified system**
- [x] **Remove manual interpolation from UploadReels**
- [ ] Add property panel to UploadReels
- [ ] Add keyframe creation from panel
- [ ] Test all data flow paths
- [ ] Add undo/redo support

## Next Steps

1. Start with `useUnifiedStateManager` hook
2. Extend `CanvasEditor` with setters/getters
3. Add transform callbacks
4. Connect property panel
5. Test bidirectional sync
6. Add timeline scrubbing
7. Polish UX

---

**Status**: ✅ Implemented with GSAP Integration  
**Priority**: High - Core functionality  
**Complexity**: Medium-High  
**GSAP Integration**: ✅ Complete
