// components/route-manager/ui/CableSchematicPlot.tsx
'use client';

import React, { useMemo } from 'react';
import { RouteDetailsPayload } from '@/schemas/custom-schemas';

interface CableSchematicPlotProps {
  routeDetails: RouteDetailsPayload & { associatedCables?: Record<string, string[]> };
}

export const CableSchematicPlot: React.FC<CableSchematicPlotProps> = ({ routeDetails }) => {
  const { route, jointBoxes, segments, associatedCables = {} } = routeDetails;

  // 1. Prepare Data Points
  const points = useMemo(() => {
    const list = [
      {
        id: route.sn_id,
        name: route.sn_name || 'Start Node',
        km: 0,
        type: 'node',
        branches: associatedCables[route.sn_id!] || [],
        isStart: true,
        isEnd: false,
      },
      ...jointBoxes.map((jc) => ({
        id: jc.node_id,
        name: jc.node?.name || 'JC',
        km: jc.position_km || 0,
        type: 'jc',
        branches: associatedCables[jc.node_id] || [],
        isStart: false,
        isEnd: false,
      })),
      {
        id: route.en_id,
        name: route.en_name || 'End Node',
        km: route.current_rkm || 0,
        type: 'node',
        branches: associatedCables[route.en_id!] || [],
        isStart: false,
        isEnd: true,
      },
    ].sort((a, b) => a.km - b.km);

    return list;
  }, [route, jointBoxes, associatedCables]);

  // 2. Dynamic Layout Calculations
  const maxBranches = Math.max(...points.map((p) => p.branches.length), 0);
  
  const SVG_WIDTH = 1200;
  const PADDING_X = 250; // Increased padding for long branch names
  const BRANCH_SPACING = 20; // Pixels between stacked branch lines
  const BASE_HEIGHT = 350;
  
  // Dynamic height: Base + Space for branches on both top and bottom
  const SVG_HEIGHT = Math.max(BASE_HEIGHT, (maxBranches / 2) * BRANCH_SPACING * 2 + 300);
  const CENTER_Y = SVG_HEIGHT / 2;

  // X Coordinate Mapper (Equidistant)
  const getX = (index: number, total: number) => {
    const availableWidth = SVG_WIDTH - PADDING_X * 2;
    return PADDING_X + (index / Math.max(total - 1, 1)) * availableWidth;
  };

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Schematic Straight Line Diagram (SLD)
        </h3>
        <div className="flex gap-4 text-[10px] text-gray-400">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Main Route</span>
           <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-gray-400"></span> Branch Cable</span>
        </div>
      </div>

      <div style={{ minWidth: '900px' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          height="100%"
          className="overflow-visible font-sans"
        >
          <defs>
            <linearGradient id="cableGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#9ca3af" />
            </marker>
            
            <marker id="dot" markerWidth="4" markerHeight="4" refX="2" refY="2">
              <circle cx="2" cy="2" r="2" fill="#6b7280" />
            </marker>
          </defs>

          {/* LAYER 1: CABLE SEGMENTS (Horizontal Lines) */}
          {points.slice(0, -1).map((point, i) => {
            const nextPoint = points[i + 1];
            const seg = segments[i]; 
            const fiberCount = seg ? `${seg.fiber_count}F` : '??F';
            
            const startX = getX(i, points.length);
            const endX = getX(i + 1, points.length);
            const midX = (startX + endX) / 2;

            return (
              <g key={`seg-${i}`}>
                {/* Thick Cable Line */}
                <line
                  x1={startX} y1={CENTER_Y}
                  x2={endX} y2={CENTER_Y}
                  stroke="url(#cableGradient)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                
                {/* Fiber Count Label Pill */}
                <g transform={`translate(${midX}, ${CENTER_Y})`}>
                  <rect
                    x="-20" y="-10" width="40" height="20" rx="4"
                    fill="#ffffff" stroke="#e5e7eb" strokeWidth={1}
                    className="dark:fill-gray-800 dark:stroke-gray-600"
                  />
                  <text
                    y="4" textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-blue-600 dark:fill-blue-400"
                    fontSize="11"
                  >
                    {fiberCount}
                  </text>
                </g>
              </g>
            );
          })}

          {/* LAYER 2: NODES & BRANCHES */}
          {points.map((point, i) => {
            const x = getX(i, points.length);
            const isStartOrEnd = point.isStart || point.isEnd;
            
            // Direction logic: Start goes Left (-1), everything else goes Right (1)
            const branchDir = point.isStart ? -1 : 1; 

            return (
              <g key={`point-${i}`}>
                
                {/* 2a. BRANCHES (Bus Style) */}
                {point.branches.map((branchName, bIdx) => {
                  const isTop = bIdx % 2 === 0; // Alternate Up/Down
                  const stackIdx = Math.floor(bIdx / 2);
                  
                  // Base distance from center line to start the fan-out
                  // This clears the main Node Label area
                  const baseVerticalOffset = 80; 
                  
                  // Vertical position for this specific branch
                  const vDist = baseVerticalOffset + (stackIdx * BRANCH_SPACING);
                  const yEnd = CENTER_Y + (isTop ? -vDist : vDist);
                  
                  // Horizontal leg length
                  const xEnd = x + (branchDir * 30); 

                  return (
                    <g key={`br-${i}-${bIdx}`} className="group/branch">
                      {/* L-Shaped Connector Line */}
                      <path
                        d={
                            // Move vertical from center, then horizontal to label
                            `M ${x} ${CENTER_Y} L ${x} ${yEnd} L ${xEnd} ${yEnd}` 
                        }
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                        markerStart="url(#dot)" // Dot on the main line
                        className="opacity-40 group-hover/branch:opacity-100 group-hover/branch:stroke-blue-500 transition-all"
                      />
                      
                      {/* Branch Name Label */}
                      <text
                        x={xEnd + (branchDir * 6)}
                        y={yEnd}
                        textAnchor={branchDir === 1 ? 'start' : 'end'}
                        dominantBaseline="middle"
                        className="text-[9px] fill-gray-400 group-hover/branch:fill-gray-800 dark:group-hover/branch:fill-gray-200 transition-colors font-medium cursor-default"
                        fontSize="9"
                      >
                        {branchName}
                      </text>
                    </g>
                  );
                })}

                {/* 2b. MAIN NODE MARKER & LABELS */}

                {/* Vertical Stem Line (Visual Anchor) */}
                <line
                  x1={x} y1={CENTER_Y - 40}
                  x2={x} y2={CENTER_Y + 40}
                  stroke={isStartOrEnd ? '#1f2937' : '#ef4444'}
                  strokeWidth={2}
                  strokeDasharray={point.type === 'jc' ? '3,2' : ''}
                  opacity={isStartOrEnd ? 1 : 0.6}
                  className="dark:stroke-gray-400"
                />

                {/* Node Icon (Rect/Circle) */}
                {point.type === 'node' ? (
                  <rect
                    x={x - 8} y={CENTER_Y - 8} width={16} height={16} rx="2"
                    fill="#1f2937" stroke="white" strokeWidth={2}
                    className="dark:fill-gray-200 dark:stroke-gray-800"
                  />
                ) : (
                  <circle
                    cx={x} cy={CENTER_Y} r="6"
                    fill="#ef4444" stroke="white" strokeWidth={2}
                    className="dark:stroke-gray-800"
                  />
                )}

                {/* Node Name Label (Top) - With Background Mask */}
                <g transform={`translate(${x}, ${CENTER_Y - 50})`}>
                    {/* Masking Rect */}
                    <rect 
                        x="-70" y="-15" width="140" height="24" rx="4"
                        fill="white" className="dark:fill-gray-800"
                        opacity="0.95"
                    />
                    <text
                      textAnchor="middle"
                      className={`text-xs ${isStartOrEnd ? 'font-bold fill-gray-900 dark:fill-white' : 'font-medium fill-gray-600 dark:fill-gray-300'}`}
                      fontSize="12"
                    >
                      {point.name}
                    </text>
                </g>

                {/* Distance Label (Bottom) - With Background Mask */}
                <g transform={`translate(${x}, ${CENTER_Y + 55})`}>
                    <rect 
                        x="-30" y="-8" width="60" height="16" rx="4"
                        fill="#f3f4f6" className="dark:fill-gray-700" 
                        stroke="#e5e7eb" strokeWidth={1}
                    />
                    <text
                      textAnchor="middle" dy="3"
                      className="text-[9px] font-mono fill-gray-500 dark:fill-gray-400"
                      fontSize="9"
                    >
                      {point.km.toFixed(2)}km
                    </text>
                </g>

              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};