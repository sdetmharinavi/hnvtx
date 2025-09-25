// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { OfcForSelection, FiberTraceNode } from '@/components/route-manager/types';
import { FiberTraceDiagram } from './FiberTraceDiagram';
import { useFiberTrace } from '@/hooks/database/path-queries';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Changed prop name for clarity and correctness
  startSegmentId: string | null; 
  fiberNo: number | null;
  allCables: OfcForSelection[] | undefined;
}

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({ isOpen, onClose, startSegmentId, fiberNo, allCables }) => {
  // FIX: Pass the correct props to the hook
  const { data: traceTree, isLoading, isError, error } = useFiberTrace(startSegmentId, fiberNo);

  // This part of the logic remains the same
  const startingCableName = allCables?.find(c => c.id === startSegmentId)?.route_name || 'Selected Route';

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Tracing fiber path..." />;
    if (isError) return <div className="p-4 text-red-500">Error tracing path: {error.message}</div>;
    if (!traceTree) return <div className="p-4 text-gray-500">Path could not be traced. This fiber may be terminated or un-spliced.</div>;

    return (
      <FiberTraceDiagram
        startNode={traceTree}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`End-to-End Trace for Fiber #${fiberNo} on ${startingCableName}`}
      size="xl"
    >
      <div className="overflow-x-auto py-4">
        {renderContent()}
      </div>
    </Modal>
  );
};