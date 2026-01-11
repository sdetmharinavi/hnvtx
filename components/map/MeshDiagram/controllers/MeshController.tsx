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
  const rafRef = useRef<number | null>(null);

  // 1. Handle Container Resizing
  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();

    const resizeObserver = new ResizeObserver(() => {
      // Cancel previous frame to prevent stacking updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        // Safety check: ensure map container still exists (not unmounted)
        if (map && map.getContainer()) {
          try {
            map.invalidateSize();
          } catch (e) {
            // Suppress Leaflet internal errors if resizing happens during unmount
            console.warn('Leaflet resize warning:', e);
          }
        }
      });
    });

    resizeObserver.observe(container);

    // Initial kick
    const timer = setTimeout(() => {
      if (map && map.getContainer()) {
        map.invalidateSize();
      }
    }, 400);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [map]);

  // 2. Handle Bounds Fitting
  useEffect(() => {
    if (bounds && map) {
      const animate = isMounted.current;

      try {
        map.fitBounds(bounds, {
          padding: [100, 100],
          animate: animate,
          duration: 0.5,
        });
      } catch (e) {
        console.warn('Leaflet fitBounds warning:', e);
      }

      isMounted.current = true;
    }
  }, [map, bounds]);

  return null;
};
