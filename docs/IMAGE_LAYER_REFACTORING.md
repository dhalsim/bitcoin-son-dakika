# Image Layer Refactoring

## Problem

Previously, the `CanvasEditor` handled images in two different ways:

1. **`imageUrl` prop** - Static background image, NOT a tracked layer
   - Could not be animated via timeline
   - Not in `layersMapRef`
   - No layer callbacks
2. **`addOverlayImageFromUrl()`** - Tracked image layers
   - Proper layer tracking
   - Timeline-animatable
   - Layer callbacks work

This inconsistency made it impossible to:

- Fade out the background
- Swap the background image mid-animation
- Treat all images uniformly

## Solution: Unified Image Layer System

### New API: `addImageLayer()`

All images are now layers - including backgrounds.

```typescript
addImageLayer: (
  url: string,
  options?: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    layerId?: string; // Custom ID (e.g. "background-image")
    name?: string; // Display name
    draggable?: boolean; // false for backgrounds
    scalingMode?: "cover" | "contain" | "fill" | "scale-down";
  },
) => Promise<string>; // Returns layerId
```

### Key Features

1. **Unified Behavior**
   - All images are tracked layers
   - All images can be animated
   - All images trigger layer callbacks

2. **Background Images**

   ```typescript
   canvas.addImageLayer(url, {
     layerId: "background-image",
     name: "Background Image",
     draggable: false,
     scalingMode: "cover",
   });
   ```

3. **Logo/Overlay Images**

   ```typescript
   canvas.addImageLayer(url, {
     width: 120,
     height: 120,
     x: 20,
     y: 20,
     name: "Logo",
     draggable: true,
   });
   ```

4. **Backward Compatibility**
   - `addOverlayImageFromUrl()` still works
   - Internally calls `addImageLayer()`
   - No breaking changes for existing code

### Benefits

✅ **Timeline Control**

- Background can be faded in/out
- Background can be swapped
- All properties animatable

✅ **Consistency**

- All images work the same way
- Same API for all image operations
- Predictable behavior

✅ **Flexibility**

- Custom layer IDs
- Optional draggability
- Scaling modes for backgrounds
- Z-index control (coming soon)

### Migration Guide

#### Before (old way)

```tsx
<CanvasEditor
  imageUrl={backgroundUrl}
  // ... other props
/>;

// Later, add logo
canvas.addOverlayImageFromUrl(logoUrl, { width: 120, height: 120 });
```

#### After (new way)

```tsx
<CanvasEditor
// No imageUrl prop needed
// ... other props
/>;

// Add background as a layer
canvas.addImageLayer(backgroundUrl, {
  layerId: "background-image",
  name: "Background",
  draggable: false,
  scalingMode: "cover",
});

// Add logo
canvas.addImageLayer(logoUrl, {
  width: 120,
  height: 120,
  name: "Logo",
});
```

### Implementation Details

#### Layer Metadata

```typescript
{
  id: "background-image",  // Custom or auto-generated
  type: "image",            // Changed from "overlay"
  rotation: 0,
  opacity: 1
}
```

#### Scaling Modes

When `scalingMode` is specified, the image fills the canvas:

- **cover**: Fill canvas, crop if needed (like CSS background-size: cover)
- **contain**: Fit within canvas, maintain aspect ratio (like CSS background-size: contain)
- **fill**: Stretch to exact canvas size
- **scale-down**: Shrink only if larger

#### Z-Order

Layers are added in order:

1. Background image (added first, appears behind)
2. Text/logo layers (added later, appear on top)

Use `moveToTop()` / `moveToBottom()` to reorder (TODO).

### Usage in UploadReels

```typescript
// On initialization
useEffect(() => {
  if (imageUrl && canvasRef.current) {
    canvasRef.current.addImageLayer(imageUrl, {
      layerId: "background-image",
      name: "Background Image",
      draggable: false,
      scalingMode: imageScalingMode,
    });
  }
}, [imageUrl, imageScalingMode]);
```

### Timeline Integration

The background now appears in the timeline:

```
Timeline:
┌─────────────────────────────┐
│ Background Image            │ ← Animatable!
│  ├─ opacity ●───────────●   │
│  └─ scale   ●───────────●   │
├─────────────────────────────┤
│ Text Layer 1                │
│  ├─ position ●──────●───●   │
│  ├─ rotation ●──────●       │
│  └─ opacity  ●──────●───●   │
└─────────────────────────────┘
```

### Future Enhancements

- [ ] `moveLayerUp(layerId)` / `moveLayerDown(layerId)`
- [ ] `setLayerZIndex(layerId, zIndex)`
- [ ] `duplicateLayer(layerId)`
- [ ] Image filters/effects
- [ ] Blend modes

### Breaking Changes

**None!** The old API still works:

- `imageUrl` prop still supported (for now)
- `addOverlayImageFromUrl()` still works
- Existing code unaffected

### Testing

Test scenarios:

1. ✅ Add background image as layer
2. ✅ Background appears in timeline
3. ✅ Animate background opacity
4. ✅ Add logo layer on top
5. ✅ Both layers animate independently
6. ✅ Backward compatibility with `addOverlayImageFromUrl()`

---

**Version**: 1.0.0  
**Date**: October 2025  
**Status**: ✅ Implemented
