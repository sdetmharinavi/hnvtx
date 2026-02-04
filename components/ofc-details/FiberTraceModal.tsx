// components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner, Button } from '@/components/common/ui'; // ADDED Button
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer';
import { OfcForSelection, PathToUpdate } from '@/schemas/custom-schemas';
import {
  V_ofc_connections_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSyncPathFromTrace, useReverseFiberPath } from '@/hooks/database/route-manager-hooks';
import { ArrowLeftRight, RotateCw } from 'lucide-react';
import { useRpcRecord } from '@/hooks/database'; // Import useRpcRecord
import { createClient } from '@/utils/supabase/client';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Cable_segmentsRowSchema[] | undefined;
  // These props might be stale, prefer fetching live data
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
  record,
  refetch,
  cableName,
}) => {
  const supabase = createClient();
  const [isForwardDirection, setIsForwardDirection] = useState(true);

  // 1. Fetch Live Connection Data to avoid stale state issues
  const { data: liveRecord, isLoading: isRecordLoading } = useRpcRecord(
    supabase,
    'v_ofc_connections_complete',
    record?.id || null,
    { enabled: isOpen && !!record?.id },
  );

  // Use live data if available, fallback to props (which might be stale but immediate)
  const currentFiberSn =
    liveRecord?.updated_fiber_no_sn || liveRecord?.fiber_no_sn || record?.fiber_no_sn || null;
  const currentFiberEn =
    liveRecord?.updated_fiber_no_en || liveRecord?.fiber_no_en || record?.fiber_no_en || null;

  // 2. Determine Start parameters
  const traceParams = useMemo(() => {
    if (!segments || segments.length === 0) return { segmentId: null, fiberNo: null };
    const sortedSegments = [...segments].sort((a, b) => a.segment_order - b.segment_order);

    if (isForwardDirection) {
      // Start from the first segment using Start Node Fiber
      return { segmentId: sortedSegments[0].id, fiberNo: currentFiberSn };
    } else {
      // Start from the last segment using End Node Fiber
      return { segmentId: sortedSegments[sortedSegments.length - 1].id, fiberNo: currentFiberEn };
    }
  }, [segments, isForwardDirection, currentFiberSn, currentFiberEn]);

  // 3. Fetch Trace Data
  const {
    data: traceData,
    isLoading: isTraceLoading,
    isError,
    error,
    refetch: refetchTrace,
  } = useFiberTrace(traceParams.segmentId, traceParams.fiberNo);

  const syncPathMutation = useSyncPathFromTrace();
  const reverseMutation = useReverseFiberPath();

  const handleReversePath = useCallback(() => {
    if (!record?.id) return;
    reverseMutation.mutate(record.id, {
      onSuccess: () => {
        // Refetch parent list
        refetch();
        // The useRpcRecord hook will automatically refetch due to query invalidation in hook
        // traceParams will update -> useFiberTrace will update
      },
    });
  }, [record?.id, reverseMutation, refetch]);

  const handleSyncPath = useCallback(async () => {
    if (!traceData || traceData.length === 0 || !record?.id) {
      toast.error('Cannot sync: Trace data missing.');
      return;
    }

    const segmentSteps = traceData.filter((s) => s.element_type === 'SEGMENT');
    if (segmentSteps.length === 0) {
      toast.error('Cannot sync: No cable segments found in trace.');
      return;
    }

    // traceData is topologically ordered (Step -N ... Step 0 ... Step N)
    // which effectively means Physical Path Order.
    const firstSeg = segmentSteps[0];
    const lastSeg = segmentSteps[segmentSteps.length - 1];

    let pathStartNodeId: string | null = null;
    let pathEndNodeId: string | null = null;
    let startFiber = 0;
    let endFiber = 0;

    // Helper
    const isSameNode = (id1: string | null, id2: string | null) => id1 && id2 && id1 === id2;

    // --- LOGIC TO DETERMINE TRUE START/END INDEPENDENT OF CABLE ORIENTATION ---

    if (segmentSteps.length === 1) {
      // Single segment: Fallback to physical definition
      // If we are tracing A->B, Start=Start, End=End.
      // If we are tracing B->A, Start=End, End=Start.
      if (isForwardDirection) {
        pathStartNodeId = firstSeg.start_node_id || null;
        pathEndNodeId = firstSeg.end_node_id || null;
        startFiber = firstSeg.fiber_in || 0;
        endFiber = firstSeg.fiber_out || 0;
      } else {
        pathStartNodeId = firstSeg.end_node_id || null;
        pathEndNodeId = firstSeg.start_node_id || null;
        startFiber = firstSeg.fiber_out || 0;
        endFiber = firstSeg.fiber_in || 0;
      }
    } else {
      // Multiple segments: Use connectivity to determine "Outer" nodes

      // 1. Find Start Node (The node of First Segment that DOES NOT connect to Second Segment)
      const secondSeg = segmentSteps[1];
      const startConnectsToSecond =
        isSameNode(firstSeg.start_node_id, secondSeg.start_node_id) ||
        isSameNode(firstSeg.start_node_id, secondSeg.end_node_id);

      if (startConnectsToSecond) {
        // Start ID connects inward, so End ID is the outer start
        pathStartNodeId = firstSeg.end_node_id || null;
        startFiber = firstSeg.fiber_out || 0; // The fiber at End ID
      } else {
        // Start ID is outer
        pathStartNodeId = firstSeg.start_node_id || null;
        startFiber = firstSeg.fiber_in || 0;
      }

      // 2. Find End Node (The node of Last Segment that DOES NOT connect to Second-to-Last Segment)
      const secondLastSeg = segmentSteps[segmentSteps.length - 2];
      const endConnectsToPrev =
        isSameNode(lastSeg.end_node_id, secondLastSeg.start_node_id) ||
        isSameNode(lastSeg.end_node_id, secondLastSeg.end_node_id);

      if (endConnectsToPrev) {
        // End ID connects inward, so Start ID is the outer end
        pathEndNodeId = lastSeg.start_node_id || null;
        endFiber = lastSeg.fiber_in || 0;
      } else {
        // End ID is outer
        pathEndNodeId = lastSeg.end_node_id || null;
        endFiber = lastSeg.fiber_out || 0;
      }
    }

    // --- DIRECTION SWAP ---
    if (!isForwardDirection) {
      const tempNode = pathStartNodeId;
      pathStartNodeId = pathEndNodeId;
      pathEndNodeId = tempNode;

      const tempFiber = startFiber;
      startFiber = endFiber;
      endFiber = tempFiber;
    }

    if (!pathStartNodeId || !pathEndNodeId) {
      toast.error('Cannot sync: Endpoints could not be determined.');
      return;
    }

    const payload: PathToUpdate = {
      p_id: record.id!,
      p_start_node_id: pathStartNodeId,
      p_start_fiber_no: startFiber,
      p_end_node_id: pathEndNodeId,
      p_end_fiber_no: endFiber,
    };

    syncPathMutation.mutate(payload, {
      onSuccess: () => {
        refetch(); // Parent list
        // refetchTrace(); // No need, trace depends on params which won't change
        onClose();
      },
    });
  }, [traceData, record, syncPathMutation, refetch, onClose, isForwardDirection]);

  const isLoading = isTraceLoading || isRecordLoading;

  const renderContent = () => {
    if (isLoading) return <PageSpinner text='Tracing fiber path...' />;
    if (isError) return <div className='p-4 text-red-500'>Error tracing path: {error.message}</div>;
    if (!traceData || traceData.length === 0)
      return <div className='p-4 text-gray-500'>Path could not be traced.</div>;

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
      size='full'>
      <div className='flex flex-col h-full max-h-[85vh]'>
        {/* Toolbar */}
        <div className='flex flex-col md:flex-row justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              View Direction:
            </span>
            <button
              onClick={() => setIsForwardDirection(!isForwardDirection)}
              className='flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
              <ArrowLeftRight className='w-4 h-4' />
              {isForwardDirection ? 'Start (A) → End (B)' : 'End (B) → Start (A)'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2'>
            {record && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleReversePath}
                disabled={reverseMutation.isPending || isLoading}
                leftIcon={
                  <RotateCw className={reverseMutation.isPending ? 'animate-spin' : ''} size={16} />
                }>
                Swap Logical Ends
              </Button>
            )}
            <div className='text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded'>
              Trace from: <strong>{isForwardDirection ? 'First Segment' : 'Last Segment'}</strong>
            </div>
          </div>
        </div>

        <div className='overflow-y-auto py-4 flex-1'>{renderContent()}</div>
      </div>
    </Modal>
  );
};
