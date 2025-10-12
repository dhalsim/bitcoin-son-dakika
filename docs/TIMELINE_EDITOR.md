# Timeline Editor Documentation

## Overview

The Timeline Editor is a full-featured animation system built on top of **Konva.js** (canvas) and **GSAP** (animations). It allows users to create complex keyframe-based animations for reels content.

## Features

### ✅ Completed Features

1. **Timeline UI**
   - Time ruler with adaptive tick marks (adjusts based on zoom level)
   - Multi-track layout (one track per object/property)
   - Playhead with scrubbing support
   - Horizontal scrolling for long animations

2. **Keyframe System**
   - Visual keyframe markers (draggable blue dots)
   - Click to add keyframes at any time
   - Drag to move keyframes horizontally
   - Double-click to delete keyframes
   - Connection lines between keyframes
   - Support for multiple property types

3. **Property Tracks**
   - Position (x, y coordinates)
   - Scale (x, y scale factors)
   - Rotation (degrees)
   - Opacity (0-1)
   - Custom properties (extensible)

4. **Playback Controls**
   - Play/Pause button
   - Skip to start button
   - Real-time playhead movement
   - Time display (current/total)
   - Playback speed control

5. **Zoom & Navigation**
   - Zoom in/out buttons
   - Zoom level display (pixels per second)
   - Range: 10px/s to 1000px/s
   - Maintains scroll position during zoom

6. **Undo/Redo**
   - History stack for all timeline actions
   - Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)
   - Visual indication of undo/redo availability

7. **Keyboard Shortcuts**
   - **Space**: Play/Pause
   - **Home**: Jump to start
   - **End**: Jump to end
   - **←/→**: Seek backward/forward (100ms)
   - **Shift+←/→**: Seek backward/forward (1s)
   - **Cmd+Z**: Undo
   - **Cmd+Shift+Z**: Redo

8. **GSAP Integration**
   - Smooth interpolation between keyframes
   - Support for multiple easing functions
   - Real-time canvas updates during playback

9. **Export/Import**
   - Export timeline as JSON
   - Import previously saved animations
   - Versioned format for compatibility

## Architecture

### Component Structure

```
src/components/admin/timeline/
├── types.ts                    # TypeScript types and interfaces
├── useTimelineState.ts         # State management hook
├── useAnimationEngine.ts       # GSAP animation engine
├── Timeline.tsx                # Main timeline component
├── TimelineRuler.tsx          # Time ruler with tick marks
├── TimelineTracks.tsx         # Track rendering with keyframes
└── index.ts                    # Public exports
```

### Data Model

```typescript
interface AnimatedObject {
  id: string;
  type: "text" | "image" | "overlay";
  name: string;
  properties: {
    position?: Keyframe<{ x: number; y: number }>[];
    scale?: Keyframe<{ x: number; y: number }>[];
    rotation?: Keyframe<number>[];
    opacity?: Keyframe<number>[];
  };
  startTime: number;
  endTime?: number;
}

interface Keyframe<T = any> {
  time: number; // milliseconds
  value: T;
  easing?: EasingType;
  id: string;
}
```

### State Management

The timeline uses a reducer pattern for state management:

```typescript
const { state, actions } = useTimelineState();

// State includes:
state.objects; // Array of animated objects
state.duration; // Total animation duration
state.currentTime; // Current playhead position
state.isPlaying; // Playback status
state.zoom; // Zoom level
state.history; // Undo/redo stacks

// Actions available:
actions.addKeyframe(objectId, property, keyframe);
actions.removeKeyframe(objectId, property, keyframeId);
actions.moveKeyframe(objectId, property, keyframeId, newTime);
actions.play();
actions.pause();
actions.seek(time);
actions.setZoom(zoom);
actions.undo();
actions.redo();
actions.exportTimeline();
```

## Usage

### Basic Integration

```tsx
import { Timeline } from "@/components/admin/timeline";

function MyComponent() {
  return (
    <Timeline
      width={800}
      height={300}
      onTimeUpdate={(time) => {
        // Update canvas when timeline scrubs
        console.log("Current time:", time);
      }}
      onObjectsChange={(objects) => {
        // React to timeline changes
        console.log("Objects:", objects);
      }}
    />
  );
}
```

### In UploadReels

The timeline is integrated into UploadReels and can be toggled with a button:

```tsx
<Button onClick={() => setShowTimeline(!showTimeline)}>
  <Film className="h-4 w-4 mr-2" />
  {showTimeline ? "Hide Timeline" : "Show Timeline"}
</Button>;

{
  showTimeline && <Timeline width={800} height={250} />;
}
```

## Animation Workflow

### 1. Create Layers

First, add layers to your canvas (text, images, logos).

### 2. Show Timeline

Click the "Show Timeline" button to reveal the timeline editor.

### 3. Add Keyframes

- Click on a track at any time position to add a keyframe
- The keyframe captures the current property value at that time
- Drag keyframes horizontally to adjust timing

### 4. Edit Properties

- Move layers on canvas
- Rotate layers
- Adjust opacity
- Timeline automatically creates/updates keyframes

### 5. Preview Animation

- Click Play to preview your animation
- Use scrubbing to move through the timeline
- Adjust keyframe timing by dragging

### 6. Export

- Use `actions.exportTimeline()` to save your animation as JSON
- Import it later to continue editing

## Example Animation

```typescript
// Create a fade-in animation
const textLayer: AnimatedObject = {
  id: "text1",
  type: "text",
  name: "Headline",
  properties: {
    position: [
      { id: "p1", time: 0, value: { x: 100, y: 800 }, easing: "power2.out" },
      { id: "p2", time: 2000, value: { x: 300, y: 400 }, easing: "linear" },
    ],
    opacity: [
      { id: "o1", time: 0, value: 0, easing: "linear" },
      { id: "o2", time: 500, value: 1, easing: "linear" },
      { id: "o3", time: 2500, value: 0, easing: "linear" },
    ],
  },
  startTime: 0,
};
```

## Supported Easing Functions

- `linear`
- `power1.in`, `power1.out`, `power1.inOut`
- `power2.in`, `power2.out`, `power2.inOut`
- `power3.in`, `power3.out`, `power3.inOut`
- `back.in`, `back.out`, `back.inOut`
- `elastic.in`, `elastic.out`, `elastic.inOut`
- `bounce.in`, `bounce.out`, `bounce.inOut`

## Performance

- Handles 20-30 layers smoothly
- Efficient keyframe interpolation
- Optimized canvas updates during playback
- Request animation frame for smooth scrubbing

## Future Enhancements

### Planned Features

1. **Property Inspector**
   - Edit keyframe values directly
   - Visual curve editor for easing
   - Color picker for color properties

2. **Advanced Editing**
   - Copy/paste keyframes
   - Keyframe snapping to grid
   - Multi-select keyframes
   - Group operations

3. **Templates**
   - Preset animations (fade in, slide up, etc.)
   - Save custom animation templates
   - Template marketplace

4. **Audio**
   - Audio track support
   - Waveform visualization
   - Sync animations to audio beats

5. **Effects**
   - Blur effects
   - Color filters
   - Particle systems

## Troubleshooting

### Timeline doesn't show

- Make sure GSAP is loaded (`window.gsap` should exist)
- Check that layers exist in CanvasEditor
- Verify the timeline toggle button is clicked

### Keyframes not dragging

- Ensure mouse events aren't blocked
- Check browser console for errors
- Try refreshing the page

### Animation stuttering

- Reduce number of keyframes
- Simplify property animations
- Check browser performance

### Export not working

- Check browser console for errors
- Verify all keyframes have valid data
- Try exporting to console first

## API Reference

### Timeline Component Props

```typescript
interface TimelineProps {
  width?: number; // Default: 800
  height?: number; // Default: 300
  onTimeUpdate?: (time: number) => void;
  onObjectsChange?: (objects: AnimatedObject[]) => void;
}
```

### useTimelineState Hook

Returns:

```typescript
{
  state: TimelineState;
  actions: {
    addKeyframe: (objectId, property, keyframe) => void;
    removeKeyframe: (objectId, property, keyframeId) => void;
    moveKeyframe: (objectId, property, keyframeId, newTime) => void;
    updateKeyframe: (objectId, property, keyframeId, updates) => void;
    addObject: (object) => void;
    removeObject: (objectId) => void;
    seek: (time) => void;
    play: () => void;
    pause: () => void;
    setZoom: (zoom) => void;
    setScroll: (offset) => void;
    undo: () => void;
    redo: () => void;
    loadState: (state) => void;
    exportTimeline: () => AnimationExport;
  };
}
```

## Credits

Built with:

- **Konva.js** - Canvas manipulation
- **GSAP** - Animation engine
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

---

**Version**: 1.0.0
**Last Updated**: October 2025
