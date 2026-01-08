'use client';

import { Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Router, Activity } from 'lucide-react';
import { getCurvedPath } from '@/utils/mapUtils';
import { PathConfig } from '@/components/map/ClientRingMap/types';

interface MeshConnectionLineProps {
  startPos: L.LatLng;
  endPos: L.LatLng;
  isSpur: boolean;
  config?: PathConfig;
  theme: string;
  startNodeName: string;
  endNodeName: string;
  nodesLength: number;
  customColor?: string;
}

export const MeshConnectionLine = ({
  startPos,
  endPos,
  isSpur,
  config,
  theme,
  startNodeName,
  endNodeName,
  nodesLength,
  customColor,
}: MeshConnectionLineProps) => {
  const isDark = theme === 'dark';

  let color = isSpur ? (isDark ? '#b4083f' : '#ff0066') : isDark ? '#60a5fa' : '#3b82f6';
  if (customColor) {
    color = customColor;
  }

  const hasConfig =
    config &&
    (config.source || (config.fiberMetrics && config.fiberMetrics.length > 0) || config.cableName);

  const positions =
    isSpur || nodesLength !== 2 ? [startPos, endPos] : getCurvedPath(startPos, endPos, 0.15);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: isSpur ? 2 : 4,
        dashArray: isSpur ? '5, 5' : undefined,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    >
      <Popup className={isDark ? 'dark-popup' : ''} minWidth={280} maxWidth={350}>
        <div className="text-sm w-full">
          <div className="font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300">
            {isSpur ? 'Spur Connection' : 'Backbone Segment'}
          </div>

          <div className="text-xs text-gray-500 mb-2">
            {startNodeName} ↔ {endNodeName}
          </div>

          {config?.cableName && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <div
                className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 truncate"
                title={config.cableName}
              >
                <Router className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[200px]">{config.cableName}</span>
              </div>
              {config.capacity && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {config.capacity}F
                </span>
              )}
            </div>
          )}

          {hasConfig ? (
            <div className="mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-gray-700">
              {config.fiberMetrics && config.fiberMetrics.length > 0 ? (
                <div className="mt-1">
                  <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-2 tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Active Fibers
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                          <th className="pb-1 font-medium pl-1">Path / Fiber</th>
                          <th className="pb-1 font-medium w-16">Role</th>
                          <th className="pb-1 font-medium text-right">Dist</th>
                          <th className="pb-1 font-medium text-right pr-1">Pwr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {config.fiberMetrics.map((fm, idx) => (
                          <tr
                            key={idx}
                            className="group hover:bg-gray-100 dark:hover:bg-gray-700/30"
                          >
                            <td
                              className="py-1.5 pl-1 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                              title={fm.label}
                            >
                              {fm.label}
                            </td>
                            <td className="py-1.5">
                              <div className="flex flex-col">
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 rounded w-fit ${
                                    fm.role === 'working'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                  }`}
                                >
                                  {fm.role === 'working' ? 'W' : 'P'}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                                  {fm.direction}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 text-right font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {fm.distance ? (
                                <span>{fm.distance}km</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="py-1.5 text-right pr-1 font-mono">
                              {fm.power ? (
                                <span
                                  className={
                                    fm.power < -25
                                      ? 'text-red-500 font-bold'
                                      : fm.power < -20
                                      ? 'text-amber-500'
                                      : 'text-green-600'
                                  }
                                >
                                  {fm.power}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-1 pt-1">
                  <div className="text-xs text-gray-500 italic text-center">
                    No active fibers lit
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isSpur && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}
        </div>
      </Popup>
    </Polyline>
  );
};
