// path: components/map/MeshDiagram.tsx
'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RingMapNode } from './types/node';
import { getNodeIcon } from '@/utils/getNodeIcons';
import L from 'leaflet'; // We use L.Point for geometry calculations
import Image from 'next/image';

interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName: string;
}

const MeshDiagram: React.FC<MeshDiagramProps> = ({ nodes, connections, ringName: _ringName }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const { nodePositions } = useMemo(() => {
    const hubs = nodes.filter(n => n.is_hub);
    const spokes = nodes.filter(n => !n.is_hub);
    const spokesByHub = new Map<string, RingMapNode[]>();
    const nodePositions = new Map<string, L.Point>();

    // Group spokes under their connected hub
    connections.forEach(([nodeA, nodeB]) => {
      if (nodeA.is_hub && !nodeB.is_hub) {
        if (!spokesByHub.has(nodeA.id!)) spokesByHub.set(nodeA.id!, []);
        spokesByHub.get(nodeA.id!)!.push(nodeB);
      } else if (nodeB.is_hub && !nodeA.is_hub) {
        if (!spokesByHub.has(nodeB.id!)) spokesByHub.set(nodeB.id!, []);
        spokesByHub.get(nodeB.id!)!.push(nodeA);
      }
    });

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const hubRadius = Math.min(centerX, centerY) * 0.25;
    const spokeLayerRadius = hubRadius + Math.min(centerX, centerY) * 0.4;

    // Position hubs in a circle
    hubs.forEach((hub, index) => {
      const angle = (index / hubs.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + hubRadius * Math.cos(angle);
      const y = centerY + hubRadius * Math.sin(angle);
      nodePositions.set(hub.id!, new L.Point(x, y));
    });

    // Position spokes around their hubs
    hubs.forEach(hub => {
      const hubPos = nodePositions.get(hub.id!);
      const childSpokes = spokesByHub.get(hub.id!) || [];
      if (!hubPos || childSpokes.length === 0) return;

      childSpokes.forEach((spoke, index) => {
        const angle = (index / childSpokes.length) * 2 * Math.PI - Math.PI / 2;
        const x = hubPos.x + spokeLayerRadius * 0.5 * Math.cos(angle);
        const y = hubPos.y + spokeLayerRadius * 0.5 * Math.sin(angle);
        nodePositions.set(spoke.id!, new L.Point(x, y));
      });
    });
    
    // Position remaining spokes (if any)
    const unpositionedSpokes = spokes.filter(s => !nodePositions.has(s.id!));
    unpositionedSpokes.forEach((spoke, index) => {
        const angle = (index / unpositionedSpokes.length) * 2 * Math.PI;
        const x = centerX + spokeLayerRadius * Math.cos(angle);
        const y = centerY + spokeLayerRadius * Math.sin(angle);
        nodePositions.set(spoke.id!, new L.Point(x, y));
    });

    return { nodePositions };
  }, [nodes, connections, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg">
      <svg width="100%" height="100%" className="absolute inset-0 z-0">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {connections.map(([nodeA, nodeB], index) => {
          const posA = nodePositions.get(nodeA.id!);
          const posB = nodePositions.get(nodeB.id!);
          if (!posA || !posB) return null;
          return (
            <motion.line
              key={index}
              x1={posA.x} y1={posA.y}
              x2={posB.x} y2={posB.y}
              stroke="rgba(107, 114, 128, 0.4)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          );
        })}
      </svg>
      {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;
        
        // THE FIX: Pass both system_type and node type to getNodeIcon
        const icon = getNodeIcon(node.system_type, node.type, false);
        
        return (
          <motion.div
            key={nodeId}
            className="absolute z-10 flex flex-col items-center group cursor-pointer"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Image src={icon.options.iconUrl ?? '/hnv.png'} alt={node.name!} width={40} height={40} unoptimized className="w-10 h-10" />
            <div className="absolute top-12 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {node.name}
              {node.is_hub && <span className="ml-2 text-blue-500">(Hub)</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MeshDiagram;