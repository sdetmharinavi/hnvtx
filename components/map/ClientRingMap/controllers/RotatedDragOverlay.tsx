'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

interface RotatedDragOverlayProps {
  rotation: number;
}

export const RotatedDragOverlay = ({ rotation }: RotatedDragOverlayProps) => {
  const map = useMap();
  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapWithTap = map as L.Map & { tap?: any };

  useEffect(() => {
    if (rotation !== 0) {
      map.dragging.disable();
      if (mapWithTap.tap) mapWithTap.tap.disable();
    } else {
      map.dragging.enable();
      if (mapWithTap.tap) mapWithTap.tap.enable();
    }
  }, [map, rotation, mapWithTap]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (rotation === 0) return;
    // Only capture left click
    if (e.button !== 0) return;

    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !lastPos.current || rotation === 0) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    let panX = 0;
    let panY = 0;

    const r = ((rotation % 360) + 360) % 360;

    if (r === 90) {
      panX = -dy;
      panY = dx;
    } else if (r === 180) {
      panX = -dx;
      panY = -dy;
    } else if (r === 270) {
      panX = dy;
      panY = -dx;
    } else {
      panX = -dx;
      panY = -dy;
    }

    map.panBy([panX, panY], { animate: false });
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    lastPos.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (rotation === 0) return null;

  return (
    <div
      // Z-index 200 places it above tiles (0) but below overlays/markers (400-600)
      // allowing markers to be clicked/dragged while background handles map panning
      className="absolute inset-0 z-200 cursor-move"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }}
    />
  );
};
