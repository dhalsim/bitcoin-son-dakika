# UploadReels Component Development Plan

## Overview

This document outlines the development plan for creating an `UploadReels` component similar to the existing `UploadToX` component, specifically designed for creating short-form video content optimized for platforms like TikTok, YouTube Shorts, and Instagram Reels.

## Requirements Analysis

### Core Requirements

- **9:16 aspect ratio** (vertical format) for optimal mobile viewing
- **Image scaling/cropping options** with `object-cover` and `object-contain` modes
- **Layer rotation capabilities** for text and image elements
- **Custom font support** with TTF font file uploads and management
- **Video generation** using ffmpeg.wasm for client-side video creation
- **Blossom integration** for video file uploads

### Platform Specifications

- **TikTok**: 9:16 ratio, 1080x1920px recommended
- **YouTube Shorts**: 9:16 ratio, 1080x1920px recommended
- **Instagram Reels**: 9:16 ratio, 1080x1920px recommended

## Technical Architecture

### 1. Component Structure

```
src/components/admin/UploadReels.tsx
├── Canvas Editor (9:16 ratio)
├── Layer Management Panel
├── Font Management System
├── Video Generation Controls
└── Upload Integration
```

### 2. Enhanced CanvasEditor Extensions

#### Current CanvasEditor Limitations

- Fixed aspect ratio (800x600)
- Limited font selection (system fonts only)
- No rotation capabilities
- No image scaling modes

#### Required Extensions

- **Dynamic aspect ratio support** (9:16 for reels)
- **Custom font loading** from TTF files
- **Layer rotation** with transform controls
- **Image scaling modes** (cover, contain, fill, scale-down)
- **Enhanced layer management** with z-index control

### 3. Font Management System

#### Font Storage Structure

```
public/fonts/
├── custom-fonts.json          # Font metadata
├── uploaded-fonts/            # TTF files
│   ├── font1.ttf
│   ├── font2.ttf
│   └── ...
└── system-fonts.json          # System font fallbacks
```

#### Font Configuration Schema

```typescript
interface FontConfig {
  id: string;
  name: string;
  family: string;
  file?: string; // TTF file path
  isCustom: boolean;
  weights?: number[];
  styles?: string[];
  preview?: string; // Preview text
}
```

#### Font Loading Implementation

- **Dynamic font loading** using `@font-face` CSS
- **Font validation** for TTF file format
- **Font preview** generation for selection UI
- **Fallback handling** for failed font loads

### 4. Layer Management System

#### Layer Types

- **Background Image** (with scaling modes)
- **Text Layers** (with rotation, styling)
- **Overlay Images** (logos, graphics)
- **Shape Layers** (rectangles, circles for backgrounds)

#### Layer Properties

```typescript
interface Layer {
  id: string;
  type: "image" | "text" | "overlay" | "shape";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number; // degrees
  opacity: number; // 0-1
  zIndex: number;
  visible: boolean;
  // Type-specific properties
  properties: LayerProperties;
}
```

#### Image Scaling Modes

- **object-cover**: Crop to fill frame, maintain aspect ratio
- **object-contain**: Scale to fit frame, maintain aspect ratio
- **object-fill**: Stretch to fill frame exactly
- **object-scale-down**: Scale down only if larger than frame

### 5. ffmpeg.wasm Integration

#### Video Generation Pipeline

1. **Canvas Export** → High-resolution PNG sequence
2. **Image Sequence Processing** → Optimize for video
3. **Video Encoding** → MP4 with H.264 codec
4. **Audio Integration** → Optional background music/sound
5. **Final Output** → Optimized video file

#### ffmpeg.wasm Configuration

```typescript
interface VideoConfig {
  width: 1080;
  height: 1920;
  fps: 30;
  duration: number; // seconds
  codec: "libx264";
  bitrate: string; // e.g., '2M'
  audioCodec?: "aac";
  audioBitrate?: string; // e.g., '128k'
}
```

#### Performance Considerations

- **Chunked processing** for large videos
- **Progress tracking** for long operations
- **Memory management** for browser limitations
- **Error handling** for encoding failures

### 6. Blossom Integration

#### Upload Flow

1. **Video Generation** → Blob/File object
2. **Blossom Authentication** → Nostr auth event
3. **File Upload** → Blossom server
4. **URL Generation** → Shareable link
5. **Metadata Storage** → Video properties

#### Upload Configuration

```typescript
interface BlossomUploadConfig {
  filename: string;
  contentType: "video/mp4";
  metadata: {
    platform: "tiktok" | "youtube" | "instagram";
    aspectRatio: "9:16";
    resolution: "1080x1920";
    duration: number;
    createdAt: string;
  };
}
```

## Implementation Phases

### Phase 1: Core Component Structure (Week 1)

- [ ] Create `UploadReels.tsx` component
- [ ] Implement 9:16 canvas with Konva.js
- [ ] Basic layer management (add, remove, reorder)
- [ ] Image scaling modes (cover, contain)
- [ ] Text layer with basic styling

### Phase 2: Font Management System (Week 2)

- [ ] Font upload interface
- [ ] TTF file validation and processing
- [ ] Dynamic font loading system
- [ ] Font preview generation
- [ ] Font selection UI with custom fonts

### Phase 3: Advanced Layer Features (Week 3)

- [ ] Layer rotation controls
- [ ] Layer opacity and visibility
- [ ] Z-index management
- [ ] Transform handles for interactive editing
- [ ] Layer duplication and grouping

### Phase 4: Video Generation (Week 4)

- [ ] ffmpeg.wasm integration
- [ ] Canvas to video pipeline
- [ ] Video encoding configuration
- [ ] Progress tracking and error handling
- [ ] Video preview functionality

### Phase 5: Blossom Integration (Week 5)

- [ ] Video upload to Blossom
- [ ] Authentication flow
- [ ] Upload progress tracking
- [ ] URL generation and sharing
- [ ] Error handling and retry logic

### Phase 6: Polish and Optimization (Week 6)

- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Mobile responsiveness
- [ ] Accessibility features
- [ ] Testing and bug fixes

## File Structure

### New Files to Create

```
src/components/admin/
├── UploadReels.tsx                    # Main component
├── ReelsCanvasEditor.tsx             # Enhanced canvas editor
├── LayerManager.tsx                  # Layer management UI
├── FontManager.tsx                   # Font upload and selection
├── VideoGenerator.tsx                 # Video generation controls
└── utils/
    ├── fontLoader.ts                 # Font loading utilities
    ├── videoEncoder.ts               # ffmpeg.wasm wrapper
    └── layerUtils.ts                 # Layer manipulation utilities

public/
├── fonts/
│   ├── custom-fonts.json             # Font metadata
│   ├── system-fonts.json             # System font definitions
│   └── uploaded-fonts/               # TTF file storage
└── templates/
    └── reel-templates.json           # Predefined templates

api/
└── font-upload.ts                    # Font upload endpoint
```

### Modified Files

```
src/components/CanvasEditor.tsx       # Extend for rotation and scaling
src/lib/utils.ts                      # Add font and video utilities
package.json                          # Add ffmpeg.wasm dependency
```

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1",
    "fontfaceobserver": "^2.3.0"
  }
}
```

### Configuration Updates

- **Vite config**: Add font file handling
- **TypeScript**: Add video and font type definitions
- **Tailwind**: Add custom font classes

## Technical Considerations

### Performance

- **Canvas optimization**: Use offscreen canvas for heavy operations
- **Memory management**: Clean up resources after video generation
- **Chunked processing**: Break large operations into smaller chunks
- **Caching**: Cache font loads and processed images

### Browser Compatibility

- **WebAssembly support**: Required for ffmpeg.wasm
- **Canvas API**: Modern browsers with 2D context support
- **File API**: For font uploads and video downloads
- **Blob API**: For video generation and uploads

### Security

- **Font validation**: Ensure uploaded files are valid TTF
- **File size limits**: Prevent memory exhaustion
- **CORS handling**: Proper cross-origin configuration
- **Content validation**: Verify video content before upload

## Testing Strategy

### Unit Tests

- Font loading and validation
- Layer manipulation functions
- Video encoding utilities
- Canvas export functionality

### Integration Tests

- End-to-end video generation
- Blossom upload flow
- Font management system
- Cross-browser compatibility

### Performance Tests

- Large video generation
- Memory usage monitoring
- Font loading performance
- Canvas rendering speed

## Future Enhancements

### Advanced Features

- **Animation support**: Keyframe-based animations
- **Template system**: Predefined layouts and styles
- **Batch processing**: Multiple video generation
- **Cloud rendering**: Server-side video generation
- **AI integration**: Automatic content optimization

### Platform-Specific Features

- **TikTok optimization**: Trending hashtags and effects
- **YouTube Shorts**: SEO optimization and thumbnails
- **Instagram Reels**: Story integration and AR filters

## Success Metrics

### Technical Metrics

- Video generation time < 30 seconds for 15-second clips
- Font loading time < 2 seconds
- Canvas rendering performance > 60 FPS
- Upload success rate > 95%

### User Experience Metrics

- Component load time < 3 seconds
- Intuitive layer manipulation
- Smooth video preview
- Error recovery mechanisms

## Risk Mitigation

### Technical Risks

- **ffmpeg.wasm limitations**: Fallback to server-side processing
- **Browser memory limits**: Implement chunked processing
- **Font loading failures**: Robust fallback system
- **Video encoding errors**: Multiple codec options

### User Experience Risks

- **Complex UI**: Progressive disclosure of advanced features
- **Performance issues**: Loading states and progress indicators
- **Mobile compatibility**: Responsive design and touch controls
- **Accessibility**: Screen reader support and keyboard navigation

## Conclusion

The UploadReels component will provide a comprehensive solution for creating short-form video content optimized for modern social media platforms. The phased implementation approach ensures steady progress while maintaining code quality and user experience standards.

The integration of ffmpeg.wasm for client-side video generation and Blossom for decentralized file storage creates a powerful, self-contained solution that aligns with the project's decentralized architecture principles.
