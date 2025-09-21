// path: components/ofc-details/FiberTraceModal.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Modal, PageSpinner } from '@/components/common/ui';
import { OfcForSelection, RouteDetailsPayload, SpliceConnection } from '@/components/route-manager/types';
import { FiberTraceDiagram } from './FiberTraceDiagram';

interface FiberTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cableId: string | null;
  fiberNo: number | null;
  allCables: OfcForSelection[] | undefined;
  routeDetails: RouteDetailsPayload | null;
}

// Hook to fetch ALL splices once.
const useAllSplices = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['all-splices'],
    queryFn: async (): Promise<SpliceConnection[]> => {
      const { data, error } = await supabase.rpc('get_all_splices');
      if (error) throw error;
      return data as SpliceConnection[];
    },
    staleTime: 60 * 1000,
  });
};

export const FiberTraceModal: React.FC<FiberTraceModalProps> = ({ isOpen, onClose, cableId, fiberNo, allCables, routeDetails }) => {
  const { data: allSplices, isLoading, isError, error } = useAllSplices();

  const startingCableName = allCables?.find(c => c.id === cableId)?.route_name || '';

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Loading network splice data..." />;
    if (isError) return <div className="p-4 text-red-500">Error loading data: {error.message}</div>;
    if (!cableId || !fiberNo || !routeDetails) return <div className="p-4 text-gray-500">Missing trace information.</div>;
    
    return (
      <FiberTraceDiagram
        startCableId={cableId}
        startFiberNo={fiberNo}
        allSplices={allSplices || []}
        allCables={allCables || []}
        routeDetails={routeDetails}
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