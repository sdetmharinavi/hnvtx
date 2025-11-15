// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer';
import { OfcForSelection, PathToUpdate } from '@/schemas/custom-schemas';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSyncPathFromTrace } from '@/hooks/database/route-manager-hooks';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  startSegmentId: string | null;
  fiberNo: number | null;
  allCables: OfcForSelection[] | undefined;
  record?: V_ofc_connections_completeRowSchema;
  refetch: () => void;
}

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({ isOpen, onClose, startSegmentId, fiberNo, allCables, record, refetch }) => {
  const { data: traceData, isLoading, isError, error } = useFiberTrace(startSegmentId, fiberNo);

  const syncPathMutation = useSyncPathFromTrace();

  const handleSyncPath = useCallback(async () => {
    if (!traceData || traceData.length === 0 || !record?.id) {
      toast.error("Cannot sync: Trace data or record ID is missing.");
      return;
    }

    // ** NEW LOGIC: Determine the true start and end of the logical path **
    let currentNodeId: string | null = null;
    let pathStartNodeId: string | null = null;
    let pathEndNodeId: string | null = null;

    for (const item of traceData) {
      if (item.element_type === 'SEGMENT') {
        if (currentNodeId === null) {
          // First segment in the trace determines the starting point
          pathStartNodeId = item.start_node_id;
          pathEndNodeId = item.end_node_id; // Tentative end node
          currentNodeId = item.end_node_id;
        } else {
          // For subsequent segments, determine direction and update the end node
          if (item.start_node_id === currentNodeId) {
            // Path is moving forward through this segment
            pathEndNodeId = item.end_node_id;
            currentNodeId = item.end_node_id;
          } else if (item.end_node_id === currentNodeId) {
            // Path is moving backward through this segment
            pathEndNodeId = item.start_node_id;
            currentNodeId = item.start_node_id;
          } else {
            // This indicates a break in the path continuity
            toast.error("Cannot sync: Path is broken or discontinuous.");
            return;
          }
        }
      }
    }

    // Fiber numbers are consistent regardless of segment direction
    const firstSegment = traceData.find((s) => s.element_type === "SEGMENT");
    const lastSegment = [...traceData].reverse().find((s) => s.element_type === "SEGMENT");
    
    const startFiberNo = firstSegment?.fiber_in ?? 0;
    const endFiberNo = lastSegment?.fiber_out ?? 0;

    if (!pathStartNodeId || !pathEndNodeId) {
      toast.error("Cannot sync: Trace is incomplete and start/end nodes could not be determined.");
      return;
    }
    
    if (startFiberNo === 0 || endFiberNo === 0) {
      toast.error("Cannot sync: Invalid fiber numbers found in trace.");
      return;
    }

    const payload: PathToUpdate = {
      p_id: record.id,
      p_start_node_id: pathStartNodeId,
      p_start_fiber_no: startFiberNo,
      p_end_node_id: pathEndNodeId,
      p_end_fiber_no: endFiberNo,
    };

    syncPathMutation.mutate(payload, {
      onSuccess: () => {
          refetch(); // Refetch the main data table
          onClose(); // Close the modal on success
      }
    });
  }, [traceData, record, syncPathMutation, refetch, onClose]);

  const startingCableName = allCables?.find(c => c.id === startSegmentId)?.route_name || 'Selected Route';

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Tracing fiber path..." />;
    if (isError) return <div className="p-4 text-red-500">Error tracing path: {error.message}</div>;
    if (!traceData) return <div className="p-4 text-gray-500">Path could not be traced.</div>;

    return <FiberTraceVisualizer traceData={traceData} onSync={handleSyncPath} isSyncing={syncPathMutation.isPending} />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`End-to-End Trace for Fiber #${fiberNo} on ${startingCableName}`}
      size="full"
    >
      <div className="overflow-y-auto py-4 max-h-[70vh]">
        {renderContent()}
      </div>
    </Modal>
  );
};