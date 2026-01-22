// components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer';
import { OfcForSelection, PathToUpdate } from '@/schemas/custom-schemas';
import {
  V_ofc_connections_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSyncPathFromTrace } from '@/hooks/database/route-manager-hooks';
import { ArrowLeftRight } from 'lucide-react';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Cable_segmentsRowSchema[] | undefined;
  fiberNoSn: number | null;
  fiberNoEn: number | null;
  allCables: OfcForSelection[] | undefined;
  record?: V_ofc_connections_completeRowSchema;
  refetch: () => void;
  cableName?: string;
}

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({
  isOpen,
  onClose,
  segments,
  fiberNoSn,
  fiberNoEn,
  record,
  refetch,
  cableName,
}) => {
  // Default to Forward (Start A -> End B)
  const [isForwardDirection, setIsForwardDirection] = useState(true);

  // 1. Determine Start parameters for the query
  const traceParams = useMemo(() => {
    if (!segments || segments.length === 0) return { segmentId: null, fiberNo: null };
    const sortedSegments = [...segments].sort((a, b) => a.segment_order - b.segment_order);

    if (isForwardDirection) {
      // Start from the first segment
      return { segmentId: sortedSegments[0].id, fiberNo: fiberNoSn };
    } else {
      // Start from the last segment
      return { segmentId: sortedSegments[sortedSegments.length - 1].id, fiberNo: fiberNoEn };
    }
  }, [segments, isForwardDirection, fiberNoSn, fiberNoEn]);

  // 2. Fetch Trace Data
  // The RPC 'trace_fiber_path' returns data ordered Topologically (A -> B)
  // regardless of which segment we initiated the trace from.
  const {
    data: traceData,
    isLoading,
    isError,
    error,
  } = useFiberTrace(traceParams.segmentId, traceParams.fiberNo);

  const syncPathMutation = useSyncPathFromTrace();

  const handleSyncPath = useCallback(async () => {
    if (!traceData || traceData.length === 0 || !record?.id) {
      toast.error('Cannot sync: Trace data missing.');
      return;
    }

    // Filter to just segments to find endpoints
    // traceData is strictly ordered A -> B (Physical Start to End) by the DB
    const segmentSteps = traceData.filter((s) => s.element_type === 'SEGMENT');
    if (segmentSteps.length === 0) {
      toast.error('Cannot sync: No cable segments found in trace.');
      return;
    }

    // Identify Physical Start (A) and Physical End (B)
    const firstSegment = segmentSteps[0];
    const lastSegment = segmentSteps[segmentSteps.length - 1];

    // THE FIX: Always sync topological order (A->B), ignoring visual direction.
    // firstSegment.start_node_id is the physical start of the route.
    // lastSegment.end_node_id is the physical end of the route.
    // firstSegment.fiber_in is the fiber entering at A.
    // lastSegment.fiber_out is the fiber exiting at B.

    const pathStartNodeId = firstSegment.start_node_id || null;
    const pathEndNodeId = lastSegment.end_node_id || null;
    const startFiber = firstSegment.fiber_in || 0;
    const endFiber = lastSegment.fiber_out || 0;

    if (!pathStartNodeId || !pathEndNodeId) {
      toast.error('Cannot sync: Endpoints could not be determined.');
      return;
    }

    const payload: PathToUpdate = {
      p_id: record.id,
      p_start_node_id: pathStartNodeId,
      p_start_fiber_no: startFiber,
      p_end_node_id: pathEndNodeId,
      p_end_fiber_no: endFiber,
    };

    syncPathMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        onClose();
      },
    });
  }, [traceData, record, syncPathMutation, refetch, onClose]); // Removed isForwardDirection dependency

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Tracing fiber path..." />;
    if (isError) return <div className="p-4 text-red-500">Error tracing path: {error.message}</div>;
    if (!traceData || traceData.length === 0)
      return <div className="p-4 text-gray-500">Path could not be traced.</div>;

    // VISUALIZATION ONLY: Reverse the display list if requested by user
    // This affects what they SEE, but not what is SYNCED above.
    const displayData = isForwardDirection ? traceData : [...traceData].reverse();

    return (
      <FiberTraceVisualizer
        traceData={displayData}
        onSync={handleSyncPath}
        isSyncing={syncPathMutation.isPending}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Trace Fiber #${traceParams.fiberNo} on ${cableName || 'Route'}`}
      size="full"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Toolbar */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trace Direction:
            </span>
            <button
              onClick={() => setIsForwardDirection(!isForwardDirection)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {isForwardDirection ? 'Start (A) → End (B)' : 'End (B) → Start (A)'}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Starting from: <strong>{isForwardDirection ? 'First Segment' : 'Last Segment'}</strong>
          </div>
        </div>

        <div className="overflow-y-auto py-4 flex-1">{renderContent()}</div>
      </div>
    </Modal>
  );
};
