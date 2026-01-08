'use client';

import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

interface FullscreenControlProps {
  isFullScreen: boolean;
  setIsFullScreen: (fs: boolean) => void;
}

export const FullscreenControl = ({ isFullScreen, setIsFullScreen }: FullscreenControlProps) => {
  const map = useMap();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Fullscreen = (L.Control as any).extend({
      onAdd: function () {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control leaflet-control-custom'
        );
        container.style.backgroundColor = 'white';
        container.style.color = 'black';
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.borderRadius = '4px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.title = isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen';
        const iconHTML = isFullScreen
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
        container.innerHTML = iconHTML;
        L.DomEvent.on(container, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          setIsFullScreen(!isFullScreen);
        });
        return container;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const control = new (Fullscreen as any)({ position: 'topleft' });
    map.whenReady(() => {
      control.addTo(map);
    });
    return () => {
      control.remove();
    };
  }, [map, isFullScreen, setIsFullScreen]);
  return null;
};
