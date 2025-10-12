# Timeline UI Refactoring

## Problem

The previous timeline implementation showed **one track per property**, which created too many rows:

```
❌ OLD LAYOUT:
Background Image · position
Background Image · scale
Background Image · rotation
Background Image · opacity
Logo · position
Logo · scale
Logo · rotation
Logo · opacity
Text Layer · position
Text Layer · scale
Text Layer · rotation
Text Layer · opacity
```

This resulted in:

- 12+ tracks for just 3 objects
- Cluttered interface
- Hard to see overall animation structure
- No way to see property details

## Solution: One Track Per Object + Properties Panel

### New Layout

```
✅ NEW LAYOUT:

┌─────────────┬──────────────────────────────┬─────────────────┐
│ Layer Names │    Timeline (keyframes)      │  Properties     │
├─────────────┼──────────────────────────────┼─────────────────┤
│Background ▶ │ ●──●────●──────●─────────●   │ ┌─────────────┐ │
│Logo         │ ●──────●──────────●──────●   │ │ Background  │ │
│Text Layer   │ ●──●──────●──────────●──●   │ ├─────────────┤ │
│             │                              │ │● position   │ │
│             │                              │ │  0.00s      │ │
│             │                              │ │  2.00s      │ │
│             │                              │ │● opacity    │ │
│             │                              │ │  0.00s      │ │
│             │                              │ │  1.50s      │ │
│             │                              │ └─────────────┘ │
└─────────────┴──────────────────────────────┴─────────────────┘
```

### Key Features

#### 1. **One Track Per Object**

- Each layer/object gets ONE horizontal track
- All keyframes from all properties shown on the same track
- Much cleaner, easier to see animation flow

#### 2. **Color-Coded Keyframes**

Keyframes are color-coded by property type:

- 🔵 **Blue** = Position
- 🟢 **Green** = Scale
- 🟣 **Purple** = Rotation
- 🟠 **Orange** = Opacity

#### 3. **Selected Layer Panel (Right Side)**

When you click on a layer track:

- Properties panel appears on the right
- Shows all properties with keyframes
- Color dot next to each property name
- List of keyframes with timestamps
- Delete button for each keyframe

#### 4. **Visual Selection**

- Selected layer highlighted in timeline (blue background)
- Matching highlight in layer name column
- Clear visual feedback

## User Interaction

### Selecting a Layer

- Click on layer name (left column) OR
- Click on the track (timeline area)
- Selected layer highlights + properties panel opens

### Working with Keyframes

- **View**: All keyframes visible on track, color-coded
- **Drag**: Click and drag keyframe to change time
- **Delete**: Double-click keyframe OR use × button in properties panel
- **Hover**: Tooltip shows property type and time

### Properties Panel

Shows details for selected layer:

- Layer name at top
- Each property section shows:
  - Color dot indicator
  - Property name
  - List of keyframes with timestamps
  - Delete button per keyframe

## Technical Implementation

### Timeline.tsx Changes

```typescript
// Added selected object state
const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

// Simplified track labels - one per object
{state.objects.map((obj) => (
  <div onClick={() => setSelectedObjectId(obj.id)}>
    {obj.name}
  </div>
))}

// Added properties panel
{selectedObjectId && (
  <div className="w-64 border-l">
    {/* Property details */}
  </div>
)}
```

### TimelineTracks.tsx Changes

```typescript
// Combined all keyframes from all properties
const getAllKeyframes = (obj: AnimatedObject) => {
  const keyframes = [];
  ["position", "scale", "rotation", "opacity"].forEach((property) => {
    obj.properties[property]?.forEach((kf) => {
      keyframes.push({ property, keyframe: kf });
    });
  });
  return keyframes;
};

// Color coding function
const getPropertyColor = (property: PropertyType) => {
  switch (property) {
    case "position": return "bg-blue-500";
    case "scale": return "bg-green-500";
    case "rotation": return "bg-purple-500";
    case "opacity": return "bg-orange-500";
  }
};

// Single track per object
<div className="h-10 border-b" onClick={() => onSelectObject(obj.id)}>
  {allKeyframes.map(({ property, keyframe }) => (
    <div className={getPropertyColor(property)} />
  ))}
</div>
```

## Benefits

✅ **Much Cleaner**

- 3 layers = 3 tracks (not 12!)
- Can see all layers at once
- Clear visual hierarchy

✅ **Better UX**

- Industry-standard layout (like Premiere/After Effects)
- Selected layer concept = familiar to users
- Properties on demand, not cluttering timeline

✅ **Scalable**

- Works with 10+ layers
- Can add more properties without bloating UI
- Properties panel scrollable if needed

✅ **Visual Clarity**

- Color coding = instant property identification
- Selection feedback = always know what's selected
- Clean separation of concerns

## Comparison

### Before

- 12 tracks for 3 objects
- No way to focus on one object
- All properties always visible
- Hard to see animation flow
- Lots of scrolling

### After

- 3 tracks for 3 objects ✅
- Click to select/focus ✅
- Properties shown on demand ✅
- Clear animation timeline ✅
- Minimal scrolling ✅

## Future Enhancements

Possible additions:

- [ ] Property value editing in panel (not just timestamps)
- [ ] "Add keyframe" button per property in panel
- [ ] Easing curve selector
- [ ] Keyframe value preview (e.g., "x: 100, y: 200")
- [ ] Group keyframes (select multiple)
- [ ] Copy/paste keyframes between layers
- [ ] Property visibility toggle (show/hide certain properties on timeline)

---

**Version**: 2.0.0  
**Date**: October 2025  
**Status**: ✅ Implemented
