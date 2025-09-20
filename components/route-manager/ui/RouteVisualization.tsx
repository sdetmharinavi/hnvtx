// components/route-manager/ui/RouteVisualization.tsx
'use client';

import {
  Equipment,
  RouteDetailsPayload,
} from '@/components/route-manager/types';
import { OfcConnectionRowsWithCount } from '@/types/view-row-types';

interface Props {
  routeConnections: OfcConnectionRowsWithCount[];
  isLoading: boolean;
  equipment: Equipment[];
  onRemoveJc: (jcId: string) => void;
}

export default function RouteVisualization({
  routeConnections,
  isLoading,
  equipment,
  onRemoveJc,
}: Props) {
  const sortedEquipment = [...equipment].sort(
    (a, b) => a.attributes.position_on_route - b.attributes.position_on_route
  );

  const getJcColor = (jcType: string) => {
    switch (jcType) {
      case 'branching':
        return 'bg-orange-500';
      case 'straight':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Route Topology
      </h3>
      <>
        {!isLoading &&
          routeConnections.map((connection) => {
            return (
              <div className="space-y-4" key={connection.id}>
                {/* Route Path Diagram */}
                <div className="relative">
                  <div className="flex items-center space-x-2 overflow-x-auto pb-4">
                    {/* Start Node */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        SITE
                      </div>
                      <div
                        className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate"
                        title={connection.sn_name || ''}
                      >
                        {connection.sn_name || ''}
                      </div>
                      <div className="text-xs text-gray-500">0 km</div>
                    </div>

                    {/* JCs along the route */}
                    {sortedEquipment.map((jc) => (
                      <div key={jc.id} className="flex items-center">
                        <div className="w-16 h-0.5 bg-gray-400 dark:bg-gray-600"></div>
                        <div className="flex-shrink-0 text-center relative group">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${getJcColor(
                              connection.connection_type || ''
                            )} ${
                              connection.connection_type === 'planned'
                                ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-400'
                                : ''
                            }`}
                          >
                            JC
                          </div>
                          <div
                            className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate"
                            title={connection.connection_type || ''}
                          >
                            {connection.connection_type}
                          </div>
                          {connection.connection_type === 'branching' && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              T-branch
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            ~{connection.otdr_distance_sn_km || ''} km
                          </div>

                          {/* Show remove button only for PLANNED JCs */}
                          {connection.connection_type === 'planned' && (
                            <button
                              onClick={() => onRemoveJc(jc.id)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove JC"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* End Node */}
                    <div className="flex items-center">
                      <div className="w-16 h-0.5 bg-gray-400 dark:bg-gray-600"></div>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          SITE
                        </div>
                        <div
                          className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate"
                          title={connection.en_name || ''}
                        >
                          {connection.en_name || ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {connection.otdr_distance_en_km || ''} km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </>
    </div>
  );
}
