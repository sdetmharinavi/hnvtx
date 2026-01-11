'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

interface MeshControllerProps {
  bounds: L.LatLngBoundsExpression;
}

export const MeshController = ({ bounds }: MeshControllerProps) => {
  const map = useMap();
  const isMounted = useRef(false);

  // 1. Handle Container Resizing (The fix for disappearing lines)
  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();

    // Create observer to watch the map div dimensions
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to throttle and prevent
      // "ResizeObserver loop limit exceeded" errors
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    resizeObserver.observe(container);

    // Initial "kick" to ensure size is correct after mount/animation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [map]);

  // 2. Handle Bounds Fitting (Data updates)
  useEffect(() => {
    if (bounds && map) {
      // If this is the very first fit, do it instantly.
      // Otherwise animate it for smooth transitions.
      const animate = isMounted.current;

      map.fitBounds(bounds, {
        padding: [100, 100],
        animate: animate,
        duration: 0.5,
      });

      isMounted.current = true;
    }
  }, [map, bounds]);

  return null;
};
