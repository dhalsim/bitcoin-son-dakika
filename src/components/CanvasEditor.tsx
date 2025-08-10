import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";

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
      fontSize?: number;
      fill?: string;
      fontFamily?: string;
      stroke?: string;
      strokeWidth?: number;
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
          const fontSize = options?.fontSize ?? 28;
          const node = new K.Text({
            text: text ?? "",
            x: options?.x ?? 24,
            y: options?.y ?? 24,
            fontSize,
            fontFamily: options?.fontFamily ?? "Inter, ui-sans-serif, system-ui",
            fill: options?.fill ?? "#ffffff",
            stroke: options?.stroke ?? "#000000",
            strokeWidth: options?.strokeWidth ?? 0,
            shadowColor: "#000000",
            shadowBlur: 6,
            shadowOpacity: 0.4,
            draggable: true,
            listening: true,
          });
          overlayLayerRef.current.add(node);
          if (transformerRef.current) {
            transformerRef.current.nodes([node]);
          }

          overlayLayerRef.current.draw();
        },
        clearOverlays: () => {
          if (!overlayLayerRef.current) {
            return;
          }

          overlayLayerRef.current.destroyChildren();
          if (transformerRef.current) {
            transformerRef.current.nodes([]);
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

            transformerRef.current.nodes([target]);
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

      // Keyboard: Delete selected overlay with Delete/Backspace
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
          if (e.key !== "Delete" && e.key !== "Backspace") {
            return;
          }

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

          nodes.forEach((n: any) => n.destroy());
          transformer.nodes([]);
          overlayLayer.draw();
          e.preventDefault();
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
      }, [imageUrl, width, height]);

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
              border: "1px solid var(--border-color, #e5e7eb)",
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
