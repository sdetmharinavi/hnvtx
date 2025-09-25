// components/route-manager/ui/RouteVisualization.tsx
'use client';

import { useMemo } from 'react';
import { Equipment, RouteDetailsPayload } from '@/components/route-manager/types';
import { Button } from '@/components/common/ui';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface Props {
  routeDetails: RouteDetailsPayload;
  onJcClick: (jc: Equipment) => void;
  onEditJc: (jc: Equipment) => void;
  onDeleteJc: (jc: Equipment) => void;
}

export default function RouteVisualization({ routeDetails, onJcClick, onEditJc, onDeleteJc }: Props) {
  const { route, equipment } = routeDetails;

  // Combine start node, sorted equipment (JCs), and end node into a single array of points
  const points = useMemo(() => [
    { type: 'node' as const, id: route.start_site.id, name: route.start_site.name, position: 0 },
    ...[...equipment].sort((a, b) => a.attributes.position_on_route - b.attributes.position_on_route)
                     .map(jc => ({ 
                       type: 'jc' as const, 
                       id: jc.id, 
                       name: jc.name, 
                       position: (route.distance_km ?? 0 * jc.attributes.position_on_route) / 100,
                       originalEquipment: jc
                     })),
    { type: 'node' as const, id: route.end_site.id, name: route.end_site.name, position: route.distance_km },
  ], [route, equipment]);

  const totalDistance = route.distance_km || 1;

  const getJcColor = (jcType: string) => {
    switch (jcType) {
      case 'branching': return 'bg-orange-500';
      case 'terminal': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-12">
        Route Topology
      </h3>
      <div className="relative w-full h-1 bg-gray-300 dark:bg-gray-600 my-8">
          <div className="relative flex justify-between w-full h-full">
            {points.map((point) => {
              const leftPercentage = Math.min(100, Math.max(0, (point.position ?? 0 / totalDistance) * 100));
              return (
                <div
                  key={`${point.type}-${point.id}`}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                  style={{ left: `${leftPercentage}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${point.type === 'node' ? 'bg-blue-600 border-white dark:border-gray-800' : `${getJcColor(point.originalEquipment?.attributes.jc_type || 'inline')} border-white dark:border-gray-800 cursor-pointer hover:scale-110 transition-transform`}`}
                    onClick={() => point.type === 'jc' && point.originalEquipment && onJcClick(point.originalEquipment)}
                  >
                    <span className="text-white font-bold text-sm">{point.type === 'node' ? 'N' : 'JC'}</span>
                  </div>
                  <div className="absolute top-12 text-center w-28">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={point.name ?? ''}>{point.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{point.position?.toFixed(2)} km</p>
                  </div>
                  {point.type === 'jc' && point.originalEquipment && (
                    <div className="absolute -top-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); onEditJc(point.originalEquipment!)}} title="Edit JC"> <FiEdit className="h-3 w-3" /> </Button>
                        <Button size="xs" variant="danger" onClick={(e) => { e.stopPropagation(); onDeleteJc(point.originalEquipment!)}} title="Delete JC"> <FiTrash2 className="h-3 w-3" /> </Button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}