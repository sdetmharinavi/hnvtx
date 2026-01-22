// components/ofc-details/FiberTraceVisualizer.tsx
'use client';

import { Button } from '@/components/common/ui';
import { FiberTraceSegment } from '@/schemas/custom-schemas';
import { Cable, GitBranch, MapPin, Milestone, Route } from 'lucide-react';
import { useMemo } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

// A new type for our oriented steps to add clarity
interface OrientedStep extends FiberTraceSegment {
  oriented_from_node_name: string;
  oriented_to_node_name: string;
}

interface FiberTraceVisualizerProps {
  traceData: FiberTraceSegment[];
  onSync: () => void;
  isSyncing: boolean;
}

// Small helper component for rendering a single SEGMENT step with correct orientation
const SegmentStep = ({ item }: { item: OrientedStep }) => {
  const detailText = `Segment ${item.step_order} (${item.oriented_from_node_name} → ${item.oriented_to_node_name})`;

  return (
    <li className="mb-10 ml-8">
      <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900">
        <Route className="h-4 w-4 text-blue-600 dark:text-blue-300" />
      </span>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white">
            {item.element_name}
          </h3>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            SEGMENT
          </span>
        </div>
        <p className="mb-3 text-sm font-normal text-gray-500 dark:text-gray-400">{detailText}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span>
            <strong>Fiber:</strong> <span className="font-mono">{item.fiber_in}</span>
          </span>
          <span>
            <strong>Length:</strong>{' '}
            <span className="font-mono">{item.distance_km?.toFixed(2)} km</span>
          </span>
        </div>
      </div>
    </li>
  );
};

// Small helper component for rendering a single SPLICE step
const SpliceStep = ({ item }: { item: FiberTraceSegment }) => {
  return (
    <li className="mb-10 ml-8">
      <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-900">
        <GitBranch className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </span>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white">
            {item.element_name}
          </h3>
          <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            SPLICE
          </span>
        </div>
        <p className="mb-3 text-sm font-normal text-gray-500 dark:text-gray-400">{item.details}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span>
            <strong>Loss:</strong> <span className="font-mono">{item.loss_db?.toFixed(2)} dB</span>
          </span>
        </div>
      </div>
    </li>
  );
};

export const FiberTraceVisualizer: React.FC<FiberTraceVisualizerProps> = ({
  traceData,
  onSync,
  isSyncing,
}) => {
  const orientedTrace = useMemo(() => {
    if (!traceData || traceData.length === 0) {
      return {
        steps: [],
        pathStartNodeName: 'Unknown Start',
        pathEndNodeName: 'Unknown End',
      };
    }

    // 1. Build Name Map for quick lookup from details string
    const nodeNameMap = new Map<string, string>();
    traceData.forEach((step) => {
      if (step.element_type === 'SEGMENT' && step.details) {
        // Parse details string: "Segment X (StartNode -> EndNode)"
        const match = step.details.match(/\((.+?) → (.+?)\)/);
        if (match) {
          if (step.start_node_id) nodeNameMap.set(step.start_node_id, match[1]);
          if (step.end_node_id) nodeNameMap.set(step.end_node_id, match[2]);
        }
      }
    });

    // 2. Determine Orientation Logic
    // We iterate the MAIN list which might be reversed by the parent modal.
    const orientedSteps: OrientedStep[] = [];
    let previousExitNodeId: string | null = null;

    traceData.forEach((item, index) => {
      if (item.element_type !== 'SEGMENT') {
        orientedSteps.push({ ...item, oriented_from_node_name: '', oriented_to_node_name: '' });
        return;
      }

      const start = item.start_node_id!;
      const end = item.end_node_id!;

      // Default assumption
      let isForward = true;

      if (previousExitNodeId) {
        // Match current start to previous exit to maintain continuity
        if (start === previousExitNodeId) isForward = true;
        else if (end === previousExitNodeId) isForward = false;
      } else {
        // First Segment encountered: Look Ahead to Next Segment to determine orientation
        const nextSegment = traceData.slice(index + 1).find((t) => t.element_type === 'SEGMENT');

        if (nextSegment) {
          const nextStart = nextSegment.start_node_id!;
          const nextEnd = nextSegment.end_node_id!;

          // If this segment's END connects to next segment, it's forward (A->B, B->C)
          if (end === nextStart || end === nextEnd) isForward = true;
          // If this segment's START connects to next segment, it's reverse (B->A, A->C logic in reversed array)
          else if (start === nextStart || start === nextEnd) isForward = false;
        }
        // If single segment, use standard forward order
      }

      const fromId = isForward ? start : end;
      const toId = isForward ? end : start;

      orientedSteps.push({
        ...item,
        oriented_from_node_name: nodeNameMap.get(fromId) || 'Unknown',
        oriented_to_node_name: nodeNameMap.get(toId) || 'Unknown',
      });

      previousExitNodeId = toId;
    });

    // Determine visual start/end names for the header based on the FIRST and LAST segment in the list
    const firstSegment = orientedSteps.find((s) => s.element_type === 'SEGMENT');
    // Iterate backwards to find the last segment
    const lastSegment = [...orientedSteps].reverse().find((s) => s.element_type === 'SEGMENT');

    return {
      steps: orientedSteps,
      pathStartNodeName: firstSegment?.oriented_from_node_name || 'Unknown Start',
      pathEndNodeName: lastSegment?.oriented_to_node_name || 'Unknown End',
    };
  }, [traceData]);

  if (!traceData || traceData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <Cable className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h4 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
          No Trace Data
        </h4>
        <p className="mt-2 text-sm">Could not find a path for this fiber.</p>
      </div>
    );
  }

  return (
    <div className="p-4 font-sans relative">
      <Button
        className="absolute top-0 right-10 z-10 animate-pulse"
        onClick={onSync}
        disabled={isSyncing}
        leftIcon={isSyncing ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
      >
        {isSyncing ? 'Syncing...' : 'Sync Path to DB'}
      </Button>
      <ol className="relative border-l-2 border-gray-300 dark:border-gray-700 ml-4">
        {/* START POINT */}
        <li className="mb-10 ml-8">
          <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 ring-8 ring-white dark:bg-green-900 dark:ring-gray-900">
            <MapPin className="h-4 w-4 text-green-600 dark:text-green-300" />
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {orientedTrace.pathStartNodeName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Path Start</p>
        </li>

        {/* DYNAMIC PATH STEPS */}
        {orientedTrace.steps.map((item, index) => {
          if (item.element_type === 'SEGMENT') {
            return <SegmentStep key={`${item.element_id}-${index}`} item={item} />;
          } else if (item.element_type === 'SPLICE') {
            return <SpliceStep key={`${item.element_id}-${index}`} item={item} />;
          }
          return null;
        })}

        {/* END POINT */}
        <li className="ml-8">
          <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 ring-8 ring-white dark:bg-red-900 dark:ring-gray-900">
            <Milestone className="h-4 w-4 text-red-600 dark:text-red-300" />
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {orientedTrace.pathEndNodeName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Path End</p>
        </li>
      </ol>
    </div>
  );
};
