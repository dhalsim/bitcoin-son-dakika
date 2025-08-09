import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";

export type CanvasEditorHandle = {
  exportAsDataURL: () => string | null;
  exportAsBlob: () => Promise<Blob | null>;
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
      const stageRef = useRef<any>(null);
      const layerRef = useRef<any>(null);
      const backgroundRef = useRef<any>(null);
      const mainImageRef = useRef<any>(null);
      const logoRef = useRef<any>(null);
      const captionGroupRef = useRef<any>(null);
      const captionRectRef = useRef<any>(null);
      const captionTextRef = useRef<any>(null);

      useImperativeHandle(ref, () => ({
        exportAsDataURL: () => {
          if (!stageRef.current) {
            return null;
          }

          return stageRef.current.toDataURL({
            mimeType: "image/png",
            pixelRatio: 1,
            quality: 1,
          });
        },
        exportAsBlob: async () => {
          if (!stageRef.current) {
            return null;
          }

          const dataUrl = stageRef.current.toDataURL({
            mimeType: "image/png",
            pixelRatio: 1,
            quality: 1,
          });
          const res = await fetch(dataUrl);

          return await res.blob();
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
          logoRef.current = null;
          captionGroupRef.current = null;
          captionRectRef.current = null;
          captionTextRef.current = null;
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
        <div className="w-full overflow-auto">
          <div
            ref={containerRef}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: 6,
              border: "1px solid var(--border-color, #e5e7eb)",
            }}
          />
        </div>
      );
    },
  ),
);

export default CanvasEditor;
