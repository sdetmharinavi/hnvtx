// components/topology/NetworkTopologyDiagram.tsx
"use client";

import React, { useMemo } from 'react';
import { v_nodes_completeRowSchema, v_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

type Node = z.infer<typeof v_nodes_completeRowSchema>;
type Connection = z.infer<typeof v_ofc_cables_completeRowSchema>;

interface NetworkTopologyDiagramProps {
  nodes: Node[];
  connections: Connection[];
}

export const NetworkTopologyDiagram: React.FC<NetworkTopologyDiagramProps> = ({ nodes, connections }) => {

  const { nodePositions, width, height } = useMemo(() => {
    // const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const positions = new Map<string, { x: number; y: number }>();
    const gridCellSize = 200;
    const occupiedCells = new Set<string>();

    nodes.forEach(node => {
        // Simple grid layout to start
        let x = Math.round((Math.random() * 5)); 
        let y = Math.round((Math.random() * 5));
        let cellKey = `${x},${y}`;
        
        while (occupiedCells.has(cellKey)) {
            x++;
            if (x > 10) { 
                x = 0;
                y++;
            }
            cellKey = `${x},${y}`;
        }
        
        occupiedCells.add(cellKey);
        positions.set(node.id!, { x: 50 + x * gridCellSize, y: 50 + y * gridCellSize });
    });
    
    const maxX = Math.max(...Array.from(positions.values()).map(p => p.x)) + 50;
    const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + 50;

    return { nodePositions: positions, width: maxX, height: maxY };
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a maintenance area to view its topology.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <svg width={width} height={height} className="min-w-full min-h-full">
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Render connections (lines) first */}
        {connections.map(conn => {
          const startPos = nodePositions.get(conn.sn_id!);
          const endPos = nodePositions.get(conn.en_id!);
          if (!startPos || !endPos) return null;

          return (
            <g key={conn.id}>
              <line
                x1={startPos.x}
                y1={startPos.y}
                x2={endPos.x}
                y2={endPos.y}
                className="stroke-current text-gray-300 dark:text-gray-600"
                strokeWidth="2"
              />
              <title>{conn.route_name}</title>
            </g>
          );
        })}

        {/* Render nodes on top of lines */}
        {nodes.map(node => {
          const pos = nodePositions.get(node.id!);
          if (!pos) return null;

          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer group">
              <circle
                r="12"
                className={`stroke-2 transition-all ${
                  node.status ? 'fill-green-100 stroke-green-500 dark:fill-green-900/50 dark:stroke-green-500' : 'fill-red-100 stroke-red-500 dark:fill-red-900/50 dark:stroke-red-500'
                } group-hover:stroke-blue-500 group-hover:fill-blue-100 dark:group-hover:fill-blue-900/50`}
              />
              <text
                textAnchor="middle"
                y="28"
                className="text-[10px] font-semibold fill-gray-700 dark:fill-gray-300 transition-all opacity-0 group-hover:opacity-100"
              >
                {node.name}
              </text>
              <title>{node.name} ({node.node_type_name})</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};