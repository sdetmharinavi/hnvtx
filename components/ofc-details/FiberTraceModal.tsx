// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { OfcForSelection, RouteDetailsPayload, FiberTraceNode } from '@/components/route-manager/types';
import { FiberTraceDiagram } from './FiberTraceDiagram';
import { useFiberTrace } from '@/hooks/database/path-queries'; // Import our new hook

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cableId: string | null;
  fiberNo: number | null;
  allCables: OfcForSelection[] | undefined; // Keep this for getting the start cable name
}

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({ isOpen, onClose, cableId, fiberNo, allCables }) => {
  // Use the new hook to get the pre-built trace tree
  const { data: traceTree, isLoading, isError, error } = useFiberTrace(cableId, fiberNo);

  const startingCableName = allCables?.find(c => c.id === cableId)?.route_name || '';

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