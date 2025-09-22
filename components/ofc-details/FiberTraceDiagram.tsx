// path: components/ofc-details/FiberTraceDiagram.tsx
'use client';

import { FiberTraceNode } from '@/components/route-manager/types';
import { Box, Network, GitBranch } from 'lucide-react';

interface TraceNodeProps {
  node: FiberTraceNode;
}

const TraceNode: React.FC<TraceNodeProps> = ({ node }) => {
    return (
        <div className="flex items-center">
            <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${node.type === 'NODE' ? 'bg-blue-600' : 'bg-green-500'}`}>
                    {node.type === 'NODE' ? <Network size={24} /> : <Box size={24} />}
                </div>
                <p className="mt-2 text-xs font-semibold text-center w-20 truncate" title={node.name}>{node.name}</p>
            </div>
            {node.children.length > 0 && (
                <div className="flex items-start ml-2">
                    <div className="w-4 h-1 mt-6 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex flex-col">
                        {node.children.map((child, index) => (
                            <div key={`${child.cable.id}-${child.cable.fiber_no}-${index}`} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">F{child.cable.fiber_no}</div>
                                    <div className="w-24 h-1 bg-blue-500"></div>
                                    <div className="text-xs text-gray-500 mt-1" title={child.cable.is_otdr ? 'OTDR Measured' : 'Segment Length'}>
                                        {child.cable.distance_km?.toFixed(2)} km
                                    </div>
                                </div>
                                {child.downstreamNode ? (
                                    <TraceNode node={child.downstreamNode} />
                                ) : (
                                    <div className="flex flex-col items-center flex-shrink-0 ml-2">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-md">
                                            <GitBranch size={20} className="transform -rotate-90" />
                                        </div>
                                        <p className="mt-2 text-xs font-semibold text-center w-20 truncate">Terminated</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface FiberTraceDiagramProps {
  startNode: FiberTraceNode;
}

export const FiberTraceDiagram: React.FC<FiberTraceDiagramProps> = ({ startNode }) => {
  return (
    <div className="p-4 font-sans">
      <div className="flex items-center space-x-2 overflow-x-auto pb-4">
        <TraceNode node={startNode} />
      </div>
    </div>
  );
};