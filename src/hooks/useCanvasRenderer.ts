import { useEffect } from "react";

import type { CanvasEditorHandle } from "@/components/CanvasEditor";

import type { RenderFrame } from "./useAnimationEngine";

/**
 * Pure canvas renderer - no side effects
 * Single Responsibility: Render frame to canvas
 */
export function useCanvasRenderer(
  canvasRef: React.RefObject<CanvasEditorHandle | null>,
  frame: RenderFrame[],
  objects: any[], // AnimatedObject[] - need canvas nodes
) {
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    frame.forEach((item) => {
      // Get canvas node from objects
      const obj = objects.find((o) => o.id === item.id);
      const node = obj?.canvasNode;
      if (!node) {
        return;
      }

      const isOnCanvas = node.getParent() !== null;

      if (item.visible && !isOnCanvas) {
        canvasRef.current?.addNodeToCanvas?.(node);
      } else if (!item.visible && isOnCanvas) {
        canvasRef.current?.removeNodeFromCanvas?.(node);
      }

      // Apply properties (only if visible)
      if (item.visible) {
        canvasRef.current?.setLayerPosition?.(
          item.id,
          item.properties.position.x,
          item.properties.position.y,
        );
        canvasRef.current?.setLayerRotation?.(item.id, item.properties.rotation);
        canvasRef.current?.setLayerScale?.(
          item.id,
          item.properties.scale.x,
          item.properties.scale.y,
        );
        canvasRef.current?.setLayerOpacity?.(item.id, item.properties.opacity);
      }
    });
  }, [frame, canvasRef, objects]);
}
