// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer'; // Import the new visualizer
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

  console.log("traceData", traceData);

  const syncPathMutation = useSyncPathFromTrace();

  // The sync logic now moves into the action definition
  const handleSyncPath = async () => {

    if (!traceData || !record?.id) {
      toast.error("Cannot sync: Trace data or record ID is missing.");
      return;
    }

      const firstSegment = traceData.find((s) => s.element_type === "SEGMENT");
      const lastSegment = [...traceData].reverse().find((s) => s.element_type === "SEGMENT");
      // Find start Node Id and Fiber Number
      const updated_start_fiber_no = firstSegment?.fiber_in;
      const updated_end_fiber_no = lastSegment?.fiber_out;

      if (!firstSegment?.start_node_id || !lastSegment?.end_node_id) {
        toast.error("Cannot sync: Trace is incomplete.");
        return;
    }

      // Ensure fiber numbers are valid numbers
      const startFiberNo = updated_start_fiber_no ?? 0;
      const endFiberNo = updated_end_fiber_no ?? 0;

      if (startFiberNo === 0 || endFiberNo === 0) {
        toast.error("Cannot sync: Invalid fiber numbers in trace.");
        return;
      }

      // Step 2: Manually construct the payload for the update RPC
      const payload: PathToUpdate = {
        p_id: record.id,
        p_start_node_id: firstSegment.start_node_id,
        p_start_fiber_no: startFiberNo,
        p_end_node_id: lastSegment.end_node_id,
        p_end_fiber_no: endFiberNo,
      };

      // Step 3: Call the sync mutation with the constructed payload
      syncPathMutation.mutate(payload, {
        onSuccess: () => {
            refetch(); // Refetch the main data table
            onClose(); // Close the modal on success
        }
    });
  };

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
      size="xl"
    >
      <div className="overflow-y-auto py-4 max-h-[70vh]">
        {renderContent()}
      </div>
    </Modal>
  );
};