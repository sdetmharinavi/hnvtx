// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui';
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer'; // Import the new visualizer
import { OfcForSelection } from '@/schemas/custom-schemas';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  startCableId: string | null; 
  fiberNo: number | null;
  allCables: OfcForSelection[] | undefined;
}

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({ isOpen, onClose, startCableId, fiberNo, allCables }) => {
  const { data: traceData, isLoading, isError, error } = useFiberTrace(startCableId, fiberNo);

  const startingCableName = allCables?.find(c => c.id === startCableId)?.route_name || 'Selected Route';

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Tracing fiber path..." />;
    if (isError) return <div className="p-4 text-red-500">Error tracing path: {error.message}</div>;
    if (!traceData) return <div className="p-4 text-gray-500">Path could not be traced.</div>;

    return <FiberTraceVisualizer traceData={traceData} />;
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