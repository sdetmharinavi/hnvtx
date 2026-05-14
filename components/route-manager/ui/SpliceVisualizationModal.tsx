// components/route-manager/ui/SpliceVisualizationModal.tsx
"use client";

import React, { useMemo } from 'react';
import { Modal, PageSpinner, ErrorDisplay } from '@/components/common/ui';
import { useJcSplicingDetails } from '@/hooks/database/route-manager-hooks';
import { Separator } from '@/components/common/ui/separator';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface SpliceVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  junctionClosureId: string | null;
}

export const SpliceVisualizationModal: React.FC<SpliceVisualizationModalProps> = ({ isOpen, onClose, junctionClosureId }) => {
  const { data: spliceDetails, isLoading, isError, error } = useJcSplicingDetails(junctionClosureId);

  const { spliceConnections, availableFibers } = useMemo(() => {
    if (!spliceDetails?.segments_at_jc) {
      return { spliceConnections:[], availableFibers:[] };
    }

    const splices: any[] = [];
    const available: any[] =[];

    for (const segment of spliceDetails.segments_at_jc) {
      for (const fiber of segment.fibers) {
        if (fiber.status === 'used_as_incoming' && fiber.splice_id) {
          splices.push({
            id: fiber.splice_id,
            incoming_segment: segment.segment_name,
            incoming_fiber: fiber.fiber_no,
            outgoing_segment: fiber.connected_to_segment,
            outgoing_fiber: fiber.connected_to_fiber,
            loss_db: fiber.loss_db,
          });
        } else if (fiber.status === 'available') {
            available.push({
                segment_id: segment.segment_id,
                segment_name: segment.segment_name,
                fiber_no: fiber.fiber_no,
            });
        }
      }
    }

    splices.sort((a, b) => a.incoming_fiber - b.incoming_fiber);
    available.sort((a,b) => a.segment_name.localeCompare(b.segment_name) || a.fiber_no - b.fiber_no);

    return { spliceConnections: splices, availableFibers: available };
  }, [spliceDetails]);

  if (isLoading) return <PageSpinner text="Loading Splice Details..." />;
  if (isError) return <ErrorDisplay error={error?.message} />;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Splice Details: ${spliceDetails?.junction_closure?.name || 'Loading...'}`} 
      size="lg"
    >
      <div className="p-4 md:p-6 space-y-6 w-full">
        <div>
          <h4 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Active Splice Connections ({spliceConnections.length})
          </h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incoming</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outgoing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loss (dB)</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200">
                {spliceConnections.map(splice => (
                  <tr key={splice.id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium"><TruncateTooltip text={splice.incoming_segment} /></div>
                      <div className="text-xs text-gray-500">Fiber #{splice.incoming_fiber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium"><TruncateTooltip text={splice.outgoing_segment || 'Terminated'} /></div>
                      <div className="text-xs text-gray-500">{splice.outgoing_fiber ? `Fiber #${splice.outgoing_fiber}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{splice.loss_db}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Available Segments ({availableFibers.length})
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiber #</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableFibers.map((fiber) => (
                  <tr key={`${fiber.segment_id}-${fiber.fiber_no}`}>
                    <td className="px-4 py-2 text-sm">{fiber.segment_name}</td>
                    <td className="px-4 py-2 font-mono text-sm">{fiber.fiber_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};