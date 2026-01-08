'use client';

import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { formatIP } from '@/utils/formatters';
import { PortDisplayInfo, RingMapNode } from '@/components/map/ClientRingMap/types';
import { getReadableTextColor } from '@/components/map/ClientRingMap/utils/labelUtils';

interface MeshNodeMarkerProps {
  node: RingMapNode;
  position: L.LatLng;
  portsList: PortDisplayInfo[];
  theme: string;
}

export const MeshNodeMarker = ({ node, position, portsList }: MeshNodeMarkerProps) => {
  return (
    <Marker position={position} icon={getNodeIcon(node.system_type, node.type, false)}>
      <Tooltip
        direction="bottom"
        offset={[0, 10]}
        opacity={1}
        permanent
        className="bg-transparent border-none shadow-none p-0"
      >
        <div className="flex flex-col items-center">
          <div className="px-1 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-xs whitespace-nowrap">
            {node.name}
          </div>
          <div className="px-1 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-xs whitespace-nowrap">
            {formatIP(node.ip)}
          </div>
          {portsList.length > 0 && (
            <div className="mt-0.5 flex flex-row gap-px items-center">
              {portsList.slice(0, 6).map((p, idx) => (
                <div
                  key={idx}
                  className="px-1 font-bold py-px text-[14px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap"
                  style={{
                    backgroundColor: p.color ? p.color : '#3b82f6',
                    color: getReadableTextColor(p.color),
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <span>{p.port}</span>
                </div>
              ))}
              {portsList.length > 6 && (
                <div className="text-[9px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">
                  +{portsList.length - 6} more
                </div>
              )}
            </div>
          )}
        </div>
      </Tooltip>

      <Popup className="custom-popup">
        <div className="text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
          <div className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">{node.name}</h3>
          </div>

          <div className="space-y-2 p-3 text-slate-600 dark:text-slate-300">
            {node.ip && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">IP:</span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-100 break-all">
                  {formatIP(node.ip)}
                </span>
              </div>
            )}

            {node.system_type && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">Type:</span>
                <span className="text-xs">{node.system_type}</span>
              </div>
            )}

            {portsList.length > 0 && (
              <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Active Interfaces
                </div>
                <div className="flex flex-wrap gap-1">
                  {portsList.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-[16px] px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: p.color + '15',
                        borderColor: p.color + '40',
                        color: getReadableTextColor(p.color),
                      }}
                      title={p.targetNodeName ? `→ ${p.targetNodeName}` : 'Endpoint'}
                    >
                      <span className="font-mono font-bold">{p.port}</span>
                      {p.targetNodeName && (
                        <span className="ml-1 opacity-70">→ {p.targetNodeName}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {node.is_hub && (
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-600">
                <span className="inline-block px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md">
                  🔗 HUB NODE
                </span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
