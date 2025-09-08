import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CanvasEditorHandle = {
  exportAsDataURL: () => string | null;
  exportAsBlob: () => Promise<Blob | null>;
  addOverlayImageFromUrl: (
    url: string,
    options?: { width?: number; height?: number; x?: number; y?: number },
  ) => Promise<void>;
  addOverlayText: (
    text: string,
    options?: {
      x?: number;
      y?: number;
      fontSize: number;
      fontFamily: string;
      fill: string;
      shadowColor: string;
      shadowBlur: number;
      shadowOpacity: number;
      backgroundColor: string;
      backgroundOpacity: number; // 0..1
      backgroundPaddingX?: number;
      backgroundPaddingY?: number;
      textAlign?: "left" | "center" | "right";
      backgroundFixedWidth?: number; // if provided, rect uses this width and text aligns within
      backgroundVerticalOffset?: number; // fine-tune vertical centering (px)
    },
  ) => void;
  clearOverlays: () => void;
};

type CanvasEditorProps = {
  imageUrl?: string;
  captionText?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
};

function loadScriptOnce(src: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve();

      return;
    }

    if (id) {
      const existingById = document.getElementById(id) as HTMLScriptElement | null;
      if (existingById) {
        if (existingById.getAttribute("data-loaded") === "true") {
          resolve();

          return;
        }

        existingById.addEventListener("load", () => resolve());
        existingById.addEventListener("error", () =>
          reject(new Error(`Failed to load script: ${src}`)),
        );

        return;
      }
    }

    const existingBySrc = Array.from(document.getElementsByTagName("script")).find(
      (s) => s.src === src,
    ) as HTMLScriptElement | undefined;
    if (existingBySrc) {
      if (existingBySrc.getAttribute("data-loaded") === "true") {
        resolve();

        return;
      }

      existingBySrc.addEventListener("load", () => resolve());
      existingBySrc.addEventListener("error", () =>
        reject(new Error(`Failed to load script: ${src}`)),
      );

      return;
    }

    const script = document.createElement("script");
    if (id) {
      script.id = id;
    }

    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };

    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    Konva: any;
  }
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

const CanvasEditor = memo(
  forwardRef<CanvasEditorHandle, CanvasEditorProps>(
    (
      {
        imageUrl,
        captionText = "",
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        backgroundColor = "#000000",
      },
      ref,
    ) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const wrapperRef = useRef<HTMLDivElement | null>(null);
      const stageRef = useRef<any>(null);
      const layerRef = useRef<any>(null);
      const overlayLayerRef = useRef<any>(null);
      const backgroundRef = useRef<any>(null);
      const mainImageRef = useRef<any>(null);
      const logoRef = useRef<any>(null);
      const captionGroupRef = useRef<any>(null);
      const captionRectRef = useRef<any>(null);
      const captionTextRef = useRef<any>(null);
      const transformerRef = useRef<any>(null);

      // Visual scale factor to fit the canvas inside its parent container (e.g., Dialog column)
      // Exported bitmap remains at the original logical size (width x height)
      const [displayScale, setDisplayScale] = useState(1);
      const [konvaReady, setKonvaReady] = useState(false);

      useImperativeHandle(ref, () => ({
        exportAsDataURL: () => {
          if (!stageRef.current) {
            return null;
          }

          // Hide transformer visuals during export
          const transformer = transformerRef.current;
          const wasVisible = transformer ? transformer.visible() : false;
          if (transformer) {
            transformer.visible(false);
            overlayLayerRef.current?.draw();
          }

          const dataUrl = stageRef.current.toDataURL({
            mimeType: "image/png",
            pixelRatio: 1,
            quality: 1,
          });

          if (transformer) {
            transformer.visible(wasVisible);
            overlayLayerRef.current?.draw();
          }

          return dataUrl;
        },
        exportAsBlob: async () => {
          if (!stageRef.current) {
            return null;
          }

          // Hide transformer visuals during export
          const transformer = transformerRef.current;
          const wasVisible = transformer ? transformer.visible() : false;
          if (transformer) {
            transformer.visible(false);
            overlayLayerRef.current?.draw();
          }

          const dataUrl = stageRef.current.toDataURL({
            mimeType: "image/png",
            pixelRatio: 1,
            quality: 1,
          });

          if (transformer) {
            transformer.visible(wasVisible);
            overlayLayerRef.current?.draw();
          }

          const res = await fetch(dataUrl);

          return await res.blob();
        },
        addOverlayImageFromUrl: async (url, options) => {
          if (!overlayLayerRef.current || typeof window === "undefined") {
            return;
          }

          await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const naturalW = img.width || 1;
              const naturalH = img.height || 1;
              let targetW = options?.width;
              let targetH = options?.height;

              if (!targetW && !targetH) {
                // default: 25% of canvas width, preserving aspect ratio
                targetW = Math.min(naturalW, width * 0.25);
              }

              if (targetW && !targetH) {
                const scale = targetW / naturalW;
                targetH = naturalH * scale;
              } else if (!targetW && targetH) {
                const scale = targetH / naturalH;
                targetW = naturalW * scale;
              }

              const x = options?.x ?? 16;
              const y = options?.y ?? 16;

              const K = window.Konva;
              const node = new K.Image({
                image: img,
                x,
                y,
                width: targetW,
                height: targetH,
                draggable: true,
                listening: true,
              });
              overlayLayerRef.current.add(node);
              // Select the newly added node for immediate resize if desired
              if (transformerRef.current) {
                transformerRef.current.nodes([node]);
              }

              overlayLayerRef.current.draw();
              resolve();
            };

            img.src = url;
          });
        },
        addOverlayText: (text, options) => {
          if (!overlayLayerRef.current || typeof window === "undefined" || !window.Konva) {
            return;
          }

          const K = window.Konva;

          const group = new K.Group({
            x: options?.x ?? 24,
            y: options?.y ?? 24,
            draggable: true,
            listening: true,
            name: "overlay-item",
          });

          const textNode = new K.Text({
            text,
            x: 0,
            y: 0,
            fontSize: options.fontSize,
            fontFamily: options.fontFamily,
            fill: options.fill,
            shadowColor: options.shadowColor,
            shadowBlur: options.shadowBlur,
            shadowOpacity: options.shadowOpacity,
            listening: true,
            name: "overlay-item-text",
            align: options.textAlign ?? "left",
            wrap: "word",
          });

          // Compute background strip properties
          const bgOpacity =
            typeof options.backgroundOpacity === "number" ? options.backgroundOpacity : 0;
          const bgColor = options.backgroundColor ?? "#000000";
          const padX = options.backgroundPaddingX ?? 10;
          const padY = options.backgroundPaddingY ?? 4;

          let rectNode: any | null = null;
          if (bgOpacity > 0) {
            // Measure text and create rect behind it with padding
            // If a fixed background width is provided, enforce it and align text within
            const fixedWidth = options.backgroundFixedWidth;
            if (typeof fixedWidth === "number" && fixedWidth > 0) {
              const contentWidth = Math.max(0, fixedWidth - padX * 2);
              textNode.width(contentWidth);
              // ensure align respected
              textNode.align(options.textAlign ?? "center");
            }

            // Use pure text metrics to eliminate extra font leading and center vertically
            const pureTextWidth =
              typeof (textNode as any).textWidth === "function"
                ? (textNode as any).textWidth()
                : textNode.width();
            const pureTextHeight =
              typeof (textNode as any).textHeight === "function"
                ? (textNode as any).textHeight()
                : textNode.height();
            const fullTextHeight = textNode.height();
            const baselineExtra = Math.max(0, fullTextHeight - pureTextHeight);
            const baselineOffset = baselineExtra / 2; // centers the glyph box vertically

            // Offset text so that the rect can be centered around it
            textNode.y(baselineOffset);

            const rectWidth =
              typeof fixedWidth === "number" && fixedWidth > 0
                ? fixedWidth
                : pureTextWidth + padX * 2;

            const verticalFineTune = options.backgroundVerticalOffset ?? 0;

            rectNode = new K.Rect({
              x: -padX,
              y: -(padY + baselineOffset) + verticalFineTune,
              width: rectWidth,
              height: pureTextHeight + padY * 2,
              fill: bgColor,
              opacity: Math.max(0, Math.min(1, bgOpacity)),
              listening: false,
              name: "overlay-item-bg",
            });
            group.add(rectNode);
          }

          group.add(textNode);
          overlayLayerRef.current.add(group);

          if (transformerRef.current) {
            transformerRef.current.nodes([group]);
          }

          overlayLayerRef.current.draw();
        },
        clearOverlays: () => {
          if (!overlayLayerRef.current) {
            return;
          }

          // Remove all overlay items but keep the transformer node intact
          const children = overlayLayerRef.current.getChildren();
          children.forEach((child: any) => {
            if (transformerRef.current && child === transformerRef.current) {
              return;
            }

            child.destroy();
          });

          if (transformerRef.current) {
            transformerRef.current.nodes([]);
            // Ensure transformer stays on top
            transformerRef.current.moveToTop();
          }

          overlayLayerRef.current.draw();
        },
      }));

      // Load Konva lazily in browser and initialize when available
      useEffect(() => {
        let cancelled = false;
        async function ensureKonva() {
          if (typeof window === "undefined") {
            return;
          }

          if (!window.Konva) {
            await loadScriptOnce("https://unpkg.com/konva@9/konva.min.js", "konva-cdn");
          }

          if (cancelled) {
            return;
          }

          if (!containerRef.current || !window.Konva) {
            return;
          }

          const K = window.Konva;

          // Create stage and layer if not yet created
          if (!stageRef.current) {
            stageRef.current = new K.Stage({
              container: containerRef.current,
              width,
              height,
            });
          }

          if (!layerRef.current) {
            layerRef.current = new K.Layer();
            stageRef.current.add(layerRef.current);
          }

          if (!overlayLayerRef.current) {
            overlayLayerRef.current = new K.Layer();
            stageRef.current.add(overlayLayerRef.current);
            overlayLayerRef.current.moveToTop();
          }

          if (!transformerRef.current) {
            transformerRef.current = new K.Transformer({
              nodes: [],
              rotateEnabled: false,
              keepRatio: true,
              enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
              boundBoxFunc: (oldBox: any, newBox: any) => {
                const minSize = 16;
                if (newBox.width < minSize || newBox.height < minSize) {
                  return oldBox;
                }

                return newBox;
              },
            });
            overlayLayerRef.current.add(transformerRef.current);
          }

          // Selection handling
          overlayLayerRef.current.on("click tap", (evt: any) => {
            const target = evt.target;
            if (!target || target === overlayLayerRef.current) {
              return;
            }

            // If a child inside a group is clicked, select the parent group named 'overlay-item'
            let nodeToSelect = target;
            if (typeof target.findAncestor === "function") {
              const groupAncestor = target.findAncestor(".overlay-item", true);
              if (groupAncestor) {
                nodeToSelect = groupAncestor;
              }
            } else if (target.getParent && target.getParent()) {
              const parent = target.getParent();
              if (parent && parent.name && parent.name() === "overlay-item") {
                nodeToSelect = parent;
              }
            }

            transformerRef.current.nodes([nodeToSelect]);
            overlayLayerRef.current.draw();
          });
          stageRef.current.on("click tap", (evt: any) => {
            const t = evt.target;
            if (t === stageRef.current || t === backgroundRef.current) {
              transformerRef.current.nodes([]);
              overlayLayerRef.current.draw();
            }
          });

          // Background rectangle
          if (!backgroundRef.current) {
            backgroundRef.current = new K.Rect({
              x: 0,
              y: 0,
              width,
              height,
              fill: backgroundColor,
              listening: false,
            });
            layerRef.current.add(backgroundRef.current);
          }

          layerRef.current.draw();
          setKonvaReady(true);
        }

        ensureKonva();

        return () => {
          cancelled = true;
          // Cleanup stage on unmount
          if (stageRef.current) {
            stageRef.current.destroy();
            stageRef.current = null as any;
          }

          layerRef.current = null;
          backgroundRef.current = null;
          mainImageRef.current = null;
          overlayLayerRef.current = null;
          logoRef.current = null;
          captionGroupRef.current = null;
          captionRectRef.current = null;
          captionTextRef.current = null;
          transformerRef.current = null;
        };
      }, [width, height, backgroundColor]);

      // Update background color and size if props change
      useEffect(() => {
        if (!stageRef.current || !backgroundRef.current) {
          return;
        }

        stageRef.current.size({ width, height });
        backgroundRef.current.width(width);
        backgroundRef.current.height(height);
        backgroundRef.current.fill(backgroundColor);
        layerRef.current?.draw();
      }, [width, height, backgroundColor]);

      // Responsively scale the canvas to fit inside the wrapper width while preserving aspect ratio
      useEffect(() => {
        if (typeof window === "undefined") {
          return;
        }

        const recomputeScale = () => {
          if (!wrapperRef.current) {
            return;
          }

          const availableWidth = wrapperRef.current.clientWidth || 0;
          if (!availableWidth) {
            return;
          }

          const nextScale = Math.min(1, availableWidth / width);
          setDisplayScale(nextScale > 0 ? nextScale : 1);
        };

        // initial compute
        recomputeScale();

        let ro: ResizeObserver | null = null;
        if ("ResizeObserver" in window && wrapperRef.current) {
          ro = new ResizeObserver(() => recomputeScale());
          ro.observe(wrapperRef.current);
        }

        window.addEventListener("resize", recomputeScale);

        return () => {
          window.removeEventListener("resize", recomputeScale);
          if (ro) {
            ro.disconnect();
          }
        };
      }, [width, height]);

      // Keyboard: Delete selected overlay with Delete/Backspace, and arrow key navigation
      useEffect(() => {
        if (typeof window === "undefined") {
          return;
        }

        const isEditableTarget = (el: Element | null): boolean => {
          if (!el) {
            return false;
          }

          const tag = (el as HTMLElement).tagName;
          if (tag === "INPUT" || tag === "TEXTAREA") {
            return true;
          }

          if ((el as HTMLElement).isContentEditable) {
            return true;
          }

          return false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
          const active = document.activeElement;
          if (isEditableTarget(active)) {
            return;
          } // don't interfere with typing

          const transformer = transformerRef.current;
          const overlayLayer = overlayLayerRef.current;
          if (!transformer || !overlayLayer) {
            return;
          }

          const nodes = transformer.nodes();
          if (!nodes || nodes.length === 0) {
            return;
          }

          // Handle Delete/Backspace
          if (e.key === "Delete" || e.key === "Backspace") {
            nodes.forEach((n: any) => n.destroy());
            transformer.nodes([]);
            overlayLayer.draw();
            e.preventDefault();
            return;
          }

          // Handle arrow key navigation
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();

            const moveAmount = e.shiftKey ? 10 : 1; // Shift + arrow = 10px, just arrow = 1px

            nodes.forEach((node: any) => {
              const currentX = node.x();
              const currentY = node.y();

              switch (e.key) {
                case "ArrowUp":
                  node.y(currentY - moveAmount);
                  break;
                case "ArrowDown":
                  node.y(currentY + moveAmount);
                  break;
                case "ArrowLeft":
                  node.x(currentX - moveAmount);
                  break;
                case "ArrowRight":
                  node.x(currentX + moveAmount);
                  break;
              }
            });

            overlayLayer.draw();
          }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
      }, []);

      // Load or update main image when imageUrl changes
      useEffect(() => {
        if (!layerRef.current || typeof window === "undefined" || !window.Konva) {
          return;
        }

        const K = window.Konva;

        if (!imageUrl) {
          if (mainImageRef.current) {
            mainImageRef.current.destroy();
            mainImageRef.current = null;
            layerRef.current.draw();
          }

          return;
        }

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // compute contain fit
          const imgW = img.width;
          const imgH = img.height;
          const canvasW = width;
          const canvasH = height;
          const scale = Math.min(canvasW / imgW, canvasH / imgH);
          const drawW = imgW * scale;
          const drawH = imgH * scale;
          const dx = (canvasW - drawW) / 2;
          const dy = (canvasH - drawH) / 2;

          if (!mainImageRef.current) {
            const node = new K.Image({
              image: img,
              x: dx,
              y: dy,
              width: drawW,
              height: drawH,
              listening: false,
            });
            mainImageRef.current = node;
            layerRef.current.add(node);
          } else {
            mainImageRef.current.image(img);
            mainImageRef.current.position({ x: dx, y: dy });
            mainImageRef.current.size({ width: drawW, height: drawH });
          }

          layerRef.current.draw();
        };

        img.src = imageUrl;

        return () => {
          // no-op cleanup; node destroyed in stage cleanup
        };
      }, [imageUrl, width, height, konvaReady]);

      // Update caption text and resize background
      useEffect(() => {
        if (!captionTextRef.current || !captionRectRef.current) {
          return;
        }

        captionTextRef.current.text(captionText || "");
        // measure
        const paddingX = 12;
        const paddingY = 8;
        const tw = captionTextRef.current.width();
        const th = captionTextRef.current.height();
        captionRectRef.current.width(tw + paddingX * 2);
        captionRectRef.current.height(th + paddingY * 2);
        layerRef.current?.draw();
      }, [captionText]);

      return (
        <div ref={wrapperRef} className="w-full" style={{ height: height * displayScale }}>
          <div
            ref={containerRef}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: 6,
              border: "none",
              transform: `scale(${displayScale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      );
    },
  ),
);

export default CanvasEditor;
