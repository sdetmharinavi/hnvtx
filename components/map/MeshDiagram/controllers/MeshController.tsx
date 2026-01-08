'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

interface MeshControllerProps {
  bounds: L.LatLngBoundsExpression;
}

export const MeshController = ({ bounds }: MeshControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
    }
  }, [map, bounds]);

  return null;
};
