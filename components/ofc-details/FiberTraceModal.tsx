// components/ofc-details/FiberTraceModal.tsx
'use client';

import { Modal, PageSpinner } from '@/components/common/ui'; 
import { useFiberTrace } from '@/hooks/database/path-queries';
import { FiberTraceVisualizer } from './FiberTraceVisualizer';
import { OfcForSelection } from '@/schemas/custom-schemas';
import {
  V_ofc_connections_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useRpcRecord } from '@/hooks/database'; 
import { createClient } from '@/utils/supabase/client';

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
  record,
  cableName,
}) => {
  const supabase = createClient();
  const [isForwardDirection, setIsForwardDirection] = useState(true);

  const { data: liveRecord, isLoading: isRecordLoading } = useRpcRecord(
    supabase,
    'v_ofc_connections_complete',
    record?.id || null,
    { enabled: isOpen && !!record?.id },
  );

  const currentFiberSn =
    liveRecord?.updated_fiber_no_sn || liveRecord?.fiber_no_sn || record?.fiber_no_sn || null;
  const currentFiberEn =
    liveRecord?.updated_fiber_no_en || liveRecord?.fiber_no_en || record?.fiber_no_en || null;

  const traceParams = useMemo(() => {
    if (!segments || segments.length === 0) return { segmentId: null, fiberNo: null };
    const sortedSegments = [...segments].sort((a, b) => a.segment_order - b.segment_order);

    if (isForwardDirection) {
      return { segmentId: sortedSegments[0].id, fiberNo: currentFiberSn };
    } else {
      return { segmentId: sortedSegments[sortedSegments.length - 1].id, fiberNo: currentFiberEn };
    }
  },[segments, isForwardDirection, currentFiberSn, currentFiberEn]);

  const {
    data: traceData,
    isLoading: isTraceLoading,
    isError,
    error,
  } = useFiberTrace(traceParams.segmentId, traceParams.fiberNo);

  const isLoading = isTraceLoading || isRecordLoading;

  const renderContent = () => {
    if (isLoading) return <PageSpinner text='Tracing fiber path...' />;
    if (isError) return <div className='p-4 text-red-500'>Error tracing path: {error.message}</div>;
    if (!traceData || traceData.length === 0)
      return <div className='p-4 text-gray-500'>Path could not be traced.</div>;

    const displayData = isForwardDirection ? traceData : [...traceData].reverse();

    return (
      <FiberTraceVisualizer traceData={displayData} />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Trace Fiber #${traceParams.fiberNo} on ${cableName || 'Route'}`}
      size='full'
    >
      <div className='flex flex-col h-full max-h-[85vh]'>
        <div className='flex flex-col md:flex-row justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              View Direction:
            </span>
            <button
              onClick={() => setIsForwardDirection(!isForwardDirection)}
              className='flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
            >
              <ArrowLeftRight className='w-4 h-4' />
              {isForwardDirection ? 'Start (A) → End (B)' : 'End (B) → Start (A)'}
            </button>
          </div>
          <div className='flex items-center gap-2'>
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