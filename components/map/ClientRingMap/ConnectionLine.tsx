'use client';

import { Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ButtonSpinner } from '@/components/common/ui';
import { Ruler } from 'lucide-react';
import { PopupFiberRow } from '../PopupFiberRow';
import { fetchOrsDistance, isColocated, getCurvedPath } from '@/utils/mapUtils';
import { PathConfig } from './types';
import { RingMapNode } from '@/components/map/types/node';

interface ConnectionLineProps {
  start: RingMapNode;
  end: RingMapNode;
  startPos: L.LatLng;
  endPos: L.LatLng;
  type: 'solid' | 'dashed';
  theme: string;
  showPopup: boolean;
  setPolylineRef: (key: string, el: L.Polyline | null) => void;
  config?: PathConfig;
  customColor?: string;
  hasReverse: boolean;
}

export const ConnectionLine = ({
  start,
  end,
  startPos,
  endPos,
  type,
  theme,
  showPopup,
  setPolylineRef,
  config,
  customColor,
  hasReverse,
}: ConnectionLineProps) => {
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = showPopup || isInteracted;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ors-distance', start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const defaultColor =
    type === 'solid'
      ? theme === 'dark'
        ? '#3b82f6'
        : '#2563eb'
      : theme === 'dark'
      ? '#ef4444'
      : '#dc2626';

  const color = customColor || defaultColor;

  const distanceText = isLoading ? (
    <span className="flex items-center gap-2 text-gray-500 text-xs">
      <ButtonSpinner size="xs" /> Calc...
    </span>
  ) : isError ? (
    <span className="text-red-500 text-xs">Failed</span>
  ) : data?.distance_km ? (
    <span className="font-bold">{data.distance_km} km</span>
  ) : (
    'N/A'
  );

  const hasConfig =
    config &&
    (config.source ||
      (config.fiberMetrics && config.fiberMetrics.length > 0) ||
      config.cableName ||
      config.fiberInfo);

  // CURVE LOGIC
  const isCluster = isColocated(startPos, endPos, 0.005);

  let positions;
  if (isCluster) {
    positions = getCurvedPath(startPos, endPos, 0.5);
  } else if (hasReverse) {
    positions = getCurvedPath(startPos, endPos, 0.15);
  } else {
    positions = [startPos, endPos];
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: type === 'solid' ? 4 : 2.5,
        opacity: type === 'solid' ? 1 : 0.7,
        dashArray: type === 'dashed' ? '6' : undefined,
      }}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}
      ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
    >
      <Popup
        autoClose={false}
        closeOnClick={false}
        className={theme === 'dark' ? 'dark-popup' : ''}
        minWidth={320}
        maxWidth={400}
      >
        <div className="text-sm w-full">
          <div className="font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300">
            {type === 'solid' ? 'Segment Details' : 'Spur Connection'}
          </div>

          {hasConfig ? (
            <div className="mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <PopupFiberRow config={config} />
              </div>
            </div>
          ) : (
            type === 'solid' && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}

          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2">
            <div className="mt-1 flex justify-between items-center px-1">
              <span className="font-medium flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Road Distance
              </span>
              <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {distanceText}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Polyline>
  );
};
