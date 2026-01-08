'use client';

import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export const MapController = ({ isFullScreen }: { isFullScreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);
  return null;
};
