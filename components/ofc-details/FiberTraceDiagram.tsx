// path: components/ofc-details/FiberTraceDiagram.tsx
'use client';

import { FiberTraceNode, OfcForSelection, RouteDetailsPayload, SpliceConnection } from '@/components/route-manager/types';
import { Box, Network, GitBranch } from 'lucide-react';
import { useMemo } from 'react';

interface FiberTraceDiagramProps {
  startCableId: string;
  startFiberNo: number;
  allSplices: SpliceConnection[];
  allCables: OfcForSelection[];
  routeDetails: RouteDetailsPayload; 
}

// =================================================================
// Recursive Rendering Component for the Trace Tree
// =================================================================
interface TraceNodeProps {
  node: FiberTraceNode;
}

const TraceNode: React.FC<TraceNodeProps> = ({ node }) => {
    return (
        <div className="flex items-center">
            {/* Render the current node (Node or JC) */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${node.type === 'NODE' ? 'bg-blue-600' : 'bg-green-500'}`}>
                    {node.type === 'NODE' ? <Network size={24} /> : <Box size={24} />}
                </div>
                <p className="mt-2 text-xs font-semibold text-center w-20 truncate" title={node.name}>{node.name}</p>
            </div>

            {/* Render children if they exist */}
            {node.children.length > 0 && (
                <div className="flex items-start ml-2">
                    {/* Connection Point */}
                    <div className="w-4 h-1 mt-6 bg-gray-300 dark:bg-gray-600"></div>

                    {/* Container for vertical branches */}
                    <div className="flex flex-col">
                        {node.children.map((child, index) => (
                            <div key={child.cable.id + child.cable.fiber_no} className="flex items-center">
                                {/* Cable Segment Line */}
                                <div className="flex flex-col items-center">
                                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">F{child.cable.fiber_no}</div>
                                    <div className="w-24 h-1 bg-blue-500"></div>
                                    <div className="text-xs text-gray-500 mt-1" title={child.cable.is_otdr ? 'OTDR Measured' : 'Segment Length'}>
                                        {child.cable.distance_km?.toFixed(2)} km {child.cable.is_otdr ? '⏛' : ''}
                                    </div>
                                </div>
                                
                                {/* Downstream Node (Recursive Call) */}
                                {child.downstreamNode ? (
                                    <TraceNode node={child.downstreamNode} />
                                ) : (
                                    // Termination Point
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


// =================================================================
// Main Diagram Component
// =================================================================
export const FiberTraceDiagram: React.FC<FiberTraceDiagramProps> = ({ startCableId, startFiberNo, allSplices, allCables, routeDetails }) => {
  
  const traceTree = useMemo((): FiberTraceNode | null => {
    if (!routeDetails) return null;

    const buildTree = (cableId: string, fiberNo: number, lastPosKm: number, visitedSplices: Set<string>): FiberTraceNode | null => {
      const splicesFromThisFiber = allSplices.filter(s => 
        s.incoming_cable_id === cableId && 
        s.incoming_fiber_no === fiberNo &&
        !visitedSplices.has(s.splice_id)
      );

      // If no splices are found, the path ends at the far end of this cable.
      if (splicesFromThisFiber.length === 0) {
        const thisCableDetails = allCables.find(c => c.id === cableId) as (OfcForSelection & {end_node?: {name: string, id: string}});
        const endNodeInfo = routeDetails.route.id === cableId ? routeDetails.route.end_node : (thisCableDetails?.end_node || {id: `end-${cableId}`, name: 'End Node'});
        return { type: 'NODE', id: endNodeInfo.id, name: endNodeInfo.name, children: [] };
      }

      // If there's one or more splices, the next element is the JC
      // For simplicity, we assume all splices for a given incoming fiber are in the same JC
      const firstSplice = splicesFromThisFiber[0];
      const jcNode: FiberTraceNode = {
        type: 'JC',
        id: firstSplice.jc_id,
        name: firstSplice.jc_name,
        children: []
      };

      splicesFromThisFiber.forEach(splice => {
        visitedSplices.add(splice.splice_id);

        const segmentDistance = splice.otdr_length_km ?? (splice.jc_position_km ? Math.abs(splice.jc_position_km - lastPosKm) : null);
        const nextCableInfo = allCables.find(c => c.id === splice.outgoing_cable_id);
        
        let downstreamNode: FiberTraceNode | null = null;
        if (splice.outgoing_cable_id && splice.outgoing_fiber_no) {
            // Recursively build the rest of the path from this branch
            downstreamNode = buildTree(splice.outgoing_cable_id, splice.outgoing_fiber_no, splice.jc_position_km || 0, visitedSplices);
        }
        
        jcNode.children.push({
          cable: {
            id: splice.incoming_cable_id,
            name: nextCableInfo?.route_name || 'Unknown Cable',
            distance_km: segmentDistance,
            is_otdr: !!splice.otdr_length_km,
            fiber_no: splice.outgoing_fiber_no || splice.incoming_fiber_no,
          },
          downstreamNode: downstreamNode,
        });
      });
      
      return jcNode;
    };
    
    // Build the initial part of the path: Start Node -> First Cable Segment
    const initialSplice = allSplices.find(s => s.incoming_cable_id === startCableId && s.incoming_fiber_no === startFiberNo);
    const startCableInfo = allCables.find(c => c.id === startCableId);
    
    if (!startCableInfo) return null;

    const startNode: FiberTraceNode = {
        type: 'NODE',
        id: routeDetails.route.start_node.id,
        name: routeDetails.route.start_node.name,
        children: [{
            cable: {
                id: startCableId,
                name: startCableInfo.route_name,
                fiber_no: startFiberNo,
                distance_km: initialSplice?.otdr_length_km ?? (initialSplice?.jc_position_km ? Math.abs(initialSplice.jc_position_km - 0) : null),
                is_otdr: !!initialSplice?.otdr_length_km,
            },
            downstreamNode: initialSplice ? buildTree(startCableId, startFiberNo, 0, new Set()) : {type: 'NODE', id: routeDetails.route.end_node.id, name: routeDetails.route.end_node.name, children: []}
        }]
    };

    return startNode;

  }, [startCableId, startFiberNo, allSplices, allCables, routeDetails]);

  if (!traceTree) {
    return <div className="p-4 text-gray-500">Path could not be traced. Please check splice connections.</div>;
  }

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center space-x-2 overflow-x-auto pb-4">
        <TraceNode node={traceTree} />
      </div>
    </div>
  );
};