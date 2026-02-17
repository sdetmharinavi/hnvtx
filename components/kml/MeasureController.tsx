// components/kml/MeasureController.tsx
'use client';

import { useState, useMemo } from 'react';
import { useMapEvents, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { haversineDistance } from '@/utils/distance';
import { X, Undo, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';

interface MeasureControllerProps {
  isActive: boolean;
  onClose: () => void;
}

export const MeasureController = ({ isActive, onClose }: MeasureControllerProps) => {
  const [points, setPoints] = useState<LatLng[]>([]);
  const map = useMap();

  // Change cursor when active
  if (isActive) {
    map.getContainer().style.cursor = 'crosshair';
  } else {
    map.getContainer().style.cursor = '';
  }

  // Handle Map Clicks
  useMapEvents({
    click(e) {
      if (!isActive) return;
      setPoints((prev) => [...prev, e.latlng]);
    },
  });

  // Calculate Distances
  const measurements = useMemo(() => {
    if (points.length < 2) return { segments: [], total: 0 };

    let total = 0;
    const segments: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Use existing utility
      const dist = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng); // Returns KM
      segments.push(dist);
      total += dist;
    }

    return { segments, total };
  }, [points]);

  // Actions
  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPoints([]);
  };

  // Render logic
  if (!isActive) return null;

  return (
    <>
      {/* 1. Visual Elements on Map */}
      {points.map((point, idx) => (
        <Marker
          key={`pt-${idx}`}
          position={point}
          icon={L.divIcon({
            className: 'bg-transparent border-none',
            html: `<div style="background-color: white; border: 2px solid #3b82f6; width: 12px; height: 12px; border-radius: 50%;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
        >
           {/* Only show tooltip for last point or if it's the only point */}
           {(idx === points.length - 1 && idx > 0) && (
             <Tooltip permanent direction="right" offset={[10, 0]} className="font-bold text-blue-600 border-blue-200">
               {measurements.total.toFixed(3)} km
             </Tooltip>
           )}
        </Marker>
      ))}

      {points.length > 1 && (
        <Polyline
          positions={points}
          pathOptions={{ color: '#3b82f6', dashArray: '5, 10', weight: 3 }}
        />
      )}

      {/* 2. Floating UI Control Panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-2 min-w-[250px] animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 mb-1">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Measurement Tool</span>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Points: {points.length}</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {measurements.total.toFixed(3)} <span className="text-xs text-gray-500 font-normal">km</span>
            </span>
        </div>

        <div className="flex gap-2 mt-1">
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={handleUndo}
            disabled={points.length === 0}
            className="flex-1"
            title="Remove last point"
          >
            <Undo className="w-3 h-3 mr-1" /> Undo
          </Button>
          <Button 
            size="xs" 
            variant="danger" 
            onClick={handleClear}
            disabled={points.length === 0}
            className="flex-1"
            title="Clear all points"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
        
        <div className="text-[10px] text-gray-400 text-center italic">
            Click on map to measure
        </div>
      </div>
    </>
  );
};