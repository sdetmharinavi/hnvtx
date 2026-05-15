"use client";

import React, { useMemo, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

import { Modal, Button, PageSpinner, ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { useJcSplicingDetails, useManageSplice } from '@/hooks/database/route-manager-hooks';
import { Separator } from '@/components/common/ui/separator';
import TruncateTooltip from '@/components/common/TruncateTooltip';

// --- Type Definitions for Clarity ---
interface SpliceConnection {
  id: string;
  incoming_segment: string;
  incoming_fiber: number;
  outgoing_segment: string | null;
  outgoing_fiber: number | null;
  loss_db: number | null;
}

interface AvailableFiber {
    segment_id: string;
    segment_name: string;
    fiber_no: number;
}

interface SpliceVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  junctionClosureId: string | null;
}

export const SpliceVisualizationModal: React.FC<SpliceVisualizationModalProps> = ({ isOpen, onClose, junctionClosureId }) => {
  const { data: spliceDetails, isLoading, isError, error } = useJcSplicingDetails(junctionClosureId);
  const manageSpliceMutation = useManageSplice();

  const [spliceToDelete, setSpliceToDelete] = useState<SpliceConnection | null>(null);

  // Transform the fetched data into flat lists for the tables
  const { spliceConnections, availableFibers } = useMemo(() => {
    if (!spliceDetails?.segments_at_jc) {
      return { spliceConnections: [], availableFibers: [] };
    }

    const splices: SpliceConnection[] = [];
    const available: AvailableFiber[] = [];

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

    // Sort for consistent display
    splices.sort((a, b) => a.incoming_fiber - b.incoming_fiber);
    available.sort((a,b) => a.segment_name.localeCompare(b.segment_name) || a.fiber_no - b.fiber_no);

    return { spliceConnections: splices, availableFibers: available };
  }, [spliceDetails]);

  const handleConfirmDelete = () => {
    if (spliceToDelete && junctionClosureId) {
      manageSpliceMutation.mutate({ action: 'delete', jcId: junctionClosureId, spliceId: spliceToDelete.id });
      setSpliceToDelete(null);
    }
  };

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Loading Splice Details..." />;
    if (isError) return <ErrorDisplay error={error?.message} />;
    if (!spliceDetails?.junction_closure) return <div className="p-8 text-center text-gray-500">Select a Junction Closure to view splice details.</div>;

    return (
      <div className="space-y-6 md:space-y-8 w-full">
        {/* Active Splices Section */}
        <div>
          <h4 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Active Splice Connections ({spliceConnections.length})
          </h4>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incoming</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outgoing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loss (dB)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {spliceConnections.map(splice => (
                    <tr key={splice.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs"><TruncateTooltip text={splice.incoming_segment} /></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Fiber #{splice.incoming_fiber}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs"><TruncateTooltip text={splice.outgoing_segment || 'Terminated'} /></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{splice.outgoing_fiber ? `Fiber #${splice.outgoing_fiber}` : ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{splice.loss_db}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button variant="danger" size="sm" onClick={() => setSpliceToDelete(splice)} leftIcon={<FiTrash2 />}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {spliceConnections.length === 0 && (
                      <tr>
                          <td colSpan={3} className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No active splices found in this junction.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {spliceConnections.map(splice => (
              <div key={splice.id} className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Incoming</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word"><TruncateTooltip text={splice.incoming_segment} /></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Fiber #{splice.incoming_fiber}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outgoing</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word"><TruncateTooltip text={splice.outgoing_segment || 'Terminated'} /></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{splice.outgoing_fiber ? `Fiber #${splice.outgoing_fiber}` : ''}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loss (dB)</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word">{splice.loss_db}</div>
                  </div>
                </div>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => setSpliceToDelete(splice)} 
                  leftIcon={<FiTrash2 />}
                  className="w-full"
                >
                  Delete Splice
                </Button>
              </div>
            ))}
            {spliceConnections.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                No active splices found in this junction.
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Available Segments Section */}
        <div>
          <h4 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Available Segments ({availableFibers.length})
          </h4>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segment Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fiber #</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                {availableFibers.map((fiber) => (
                  <tr key={`${fiber.segment_id}-${fiber.fiber_no}`}>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 wrap-break-word">{fiber.segment_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{fiber.fiber_no}</td>
                  </tr>
                ))}
                {availableFibers.length === 0 && (
                    <tr>
                        <td colSpan={2} className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No available fibers in this junction.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden max-h-80 overflow-y-auto space-y-2">
            {availableFibers.map((fiber) => (
              <div key={`${fiber.segment_id}-${fiber.fiber_no}`} className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 wrap-break-word">{fiber.segment_name}</div>
                </div>
                <div className="shrink-0 text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  #{fiber.fiber_no}
                </div>
              </div>
            ))}
            {availableFibers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                No available fibers in this junction.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Splice Details: ${spliceDetails?.junction_closure?.name || 'Loading...'}`} 
        size="full"
      >
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </Modal>
      <ConfirmModal
        isOpen={!!spliceToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSpliceToDelete(null)}
        title="Confirm Splice Deletion"
        message={`Are you sure you want to delete the splice from Fiber #${spliceToDelete?.incoming_fiber} on "${spliceToDelete?.incoming_segment}"?`}
        type="danger"
        loading={manageSpliceMutation.isPending}
      />
    </>
  );
};