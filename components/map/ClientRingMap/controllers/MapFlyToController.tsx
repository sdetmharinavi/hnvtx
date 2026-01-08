'use client';

import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

interface MapFlyToControllerProps {
  coords: [number, number] | null;
}

export const MapFlyToController = ({ coords }: MapFlyToControllerProps) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 16);
    }
  }, [coords, map]);
  return null;
};
