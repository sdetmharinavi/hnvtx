// components/route-manager/FiberSpliceManager.tsx
'use client';

import { useMemo, useState } from 'react';
import { useJcSplicingDetails } from '@/hooks/database/route-manager-hooks';
import { PageSpinner, Button } from '@/components/common/ui';
import { FiLink } from 'react-icons/fi';
import { JcSplicingDetails } from '@/schemas/custom-schemas';
import { SpliceVisualizationModal } from '@/components/route-manager/ui/SpliceVisualizationModal';
import TruncateTooltip from '@/components/common/TruncateTooltip';

export const FiberSpliceManager: React.FC<{ junctionClosureId: string | null }> = ({
  junctionClosureId,
}) => {
  const { data: rawData, isLoading, isError, error } = useJcSplicingDetails(junctionClosureId);
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);

  const spliceDetails = useMemo((): JcSplicingDetails | null => {
    if (!rawData || typeof rawData !== 'object' || !('junction_closure' in rawData)) {
      return null;
    }
    return rawData;
  }, [rawData]);

  if (isLoading) return <PageSpinner text="Loading splice details..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error?.message}</div>;
  if (!spliceDetails?.junction_closure) {
    return <div className="p-4 text-gray-500">Select a Junction Closure to view its splices.</div>;
  }

  const { junction_closure, segments_at_jc } = spliceDetails;
  const gridTemplateColumns = `repeat(${Math.max(1, segments_at_jc.length)}, minmax(0, 1fr))`;

  const renderFiber = (fiber: any) => {
    const statusClasses: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      used_as_incoming: 'bg-blue-100 text-blue-700',
      used_as_outgoing: 'bg-purple-100 text-purple-700',
      terminated: 'bg-gray-200 text-gray-700',
    };

    const titleText = fiber.connected_to_segment
      ? `-> F${fiber.connected_to_fiber ?? ''} on ${fiber.connected_to_segment}`
      : fiber.status.replace(/_/g, ' ');

    return (
      <div key={fiber.fiber_no} className={`flex items-center justify-between p-2 rounded-md ${statusClasses[fiber.status] || ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold w-6 text-center">{fiber.fiber_no}</span>
          {fiber.status !== 'available' && <FiLink className="w-3 h-3 shrink-0" />}
          <span className="text-xs truncate" title={titleText}>{titleText}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold">Splice Matrix: {junction_closure.name}</h3>
        <Button size="sm" onClick={() => setShowVisualizationModal(true)} variant="outline">
          View All Splices
        </Button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns }}>
        {segments_at_jc.map((segment) => (
          <div key={segment.segment_id} className="bg-gray-50 p-3 rounded-lg border">
            <h4 className="font-bold text-sm mb-2 truncate"><TruncateTooltip text={segment.segment_name} /></h4>
            <p className="text-xs text-gray-500 mb-3 flex flex-wrap gap-2">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded border">{segment.fiber_count} Fibers</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded border font-mono">{segment.distance_km ? `${segment.distance_km} km` : '0 km'}</span>
            </p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {segment.fibers.map((fiber) => renderFiber(fiber))}
            </div>
          </div>
        ))}
      </div>

      <SpliceVisualizationModal
        isOpen={showVisualizationModal}
        onClose={() => setShowVisualizationModal(false)}
        junctionClosureId={junctionClosureId}
      />
    </div>
  );
};