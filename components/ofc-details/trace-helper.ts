// path: components/ofc-details/trace-helper.ts
import { FiberTraceSegment, FiberTraceNode } from '@/components/route-manager/types';

/**
 * Transforms a flat list of trace segments from the database into a nested
 * tree structure that the React component can render recursively.
 *
 * @param traceSegments The flat array returned from the `trace_fiber_path` RPC.
 * @returns The root node of the constructed fiber trace tree, or null if the trace is empty.
 */
export function buildTraceTree(traceSegments: FiberTraceSegment[]): FiberTraceNode | null {
  if (!traceSegments || traceSegments.length === 0) {
    return null;
  }

  // A map to keep track of nodes we've already created to build the tree.
  const nodeMap = new Map<string, FiberTraceNode>();

  // The trace always starts with a cable. The "start node" is the beginning of the first cable.
  const firstCable = traceSegments[0];
  const startNodeName = firstCable.details.split(' → ')[0];
  const startNodeId = `start-node-${firstCable.element_id}`; // Create a stable unique ID

  const rootNode: FiberTraceNode = {
    id: startNodeId,
    name: startNodeName,
    type: 'NODE',
    children: [],
  };
  nodeMap.set(startNodeId, rootNode);

  let currentParentNode = rootNode;

  for (let i = 0; i < traceSegments.length; i++) {
    const segment = traceSegments[i];

    if (segment.path_type === 'CABLE') {
      const nextSegment = traceSegments[i + 1];
      
      let downstreamNode: FiberTraceNode | null = null;
      
      if (nextSegment && nextSegment.path_type === 'JC') {
        // This is a splice point in the middle of the path.
        if (nodeMap.has(nextSegment.element_id)) {
            downstreamNode = nodeMap.get(nextSegment.element_id)!;
        } else {
            downstreamNode = {
                id: nextSegment.element_id,
                name: nextSegment.element_name,
                type: 'JC',
                children: [],
            };
            nodeMap.set(downstreamNode.id, downstreamNode);
        }
      } else if (!nextSegment) {
        // This is the last cable segment, leading to the final termination node.
        const endNodeName = segment.details.split(' → ')[1];
        const endNodeId = `end-node-${segment.element_id}`;
        
        downstreamNode = {
            id: endNodeId,
            name: endNodeName,
            type: 'NODE',
            children: [],
        };
        nodeMap.set(endNodeId, downstreamNode);
      }

      if (currentParentNode) {
        currentParentNode.children.push({
          cable: {
            id: segment.element_id,
            name: segment.element_name,
            distance_km: segment.distance_km,
            is_otdr: !!segment.loss_db,
            fiber_no: segment.fiber_no,
          },
          downstreamNode: downstreamNode,
        });
      }
      
      if (downstreamNode) {
        currentParentNode = downstreamNode;
      }
    }
  }

  return rootNode;
}