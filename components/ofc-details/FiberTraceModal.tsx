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
  const [isForwardDirection, setIsForwardDirection] = useState(true);

  // 1. Determine Start parameters
  const traceParams = useMemo(() => {
    if (!segments || segments.length === 0) return { segmentId: null, fiberNo: null };
    const sortedSegments = [...segments].sort((a, b) => a.segment_order - b.segment_order);

    if (isForwardDirection) {
      return { segmentId: sortedSegments[0].id, fiberNo: fiberNoSn };
    } else {
      return { segmentId: sortedSegments[sortedSegments.length - 1].id, fiberNo: fiberNoEn };
    }
  }, [segments, isForwardDirection, fiberNoSn, fiberNoEn]);

  // 2. Fetch Trace
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

    // traceData is ALWAYS ordered by traversal step (Step 0 -> Step N)
    // Filter to just segments to find endpoints
    const segmentSteps = traceData.filter((s) => s.element_type === 'SEGMENT');
    if (segmentSteps.length === 0) {
      toast.error('Cannot sync: No cable segments found in trace.');
      return;
    }

    const firstSegment = segmentSteps[0];
    const lastSegment = segmentSteps[segmentSteps.length - 1];

    let pathStartNodeId: string | null = null;
    let pathEndNodeId: string | null = null;

    // Fiber Logic:
    // fiber_in = Fiber number entering the segment
    // fiber_out = Fiber number exiting the segment
    // This is relative to the traversal direction.

    const startFiber = firstSegment.fiber_in || 0;
    const endFiber = lastSegment.fiber_out || 0;

    if (isForwardDirection) {
      // Trace A -> B
      // We entered at Start Node, Exited at End Node
      pathStartNodeId = firstSegment.start_node_id || null;
      pathEndNodeId = lastSegment.end_node_id || null;
    } else {
      // Trace B -> A
      // We entered at the Physical End (B) of the last segment (Seg 3)
      // We exited at the Physical Start (A) of the first segment (Seg 1)

      pathStartNodeId = firstSegment.end_node_id || null;
      pathEndNodeId = lastSegment.start_node_id || null;
    }

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

    // console.log("Syncing Path:", payload);

    syncPathMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        onClose();
      },
    });
  }, [traceData, record, syncPathMutation, refetch, onClose, isForwardDirection]);

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Tracing fiber path..." />;
    if (isError) return <div className="p-4 text-red-500">Error tracing path: {error.message}</div>;
    if (!traceData || traceData.length === 0)
      return <div className="p-4 text-gray-500">Path could not be traced.</div>;

    // Use traceData directly. Visualizer handles basic display.
    return (
      <FiberTraceVisualizer
        traceData={traceData}
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
