// path: components/system-details/connections/ConnectionCard.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import {
  FiActivity,
  FiEye,
  FiMonitor,
  FiServer,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiChevronsRight,
} from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatIP } from '@/utils/formatters';
import useIsMobile from '@/hooks/useIsMobile';
import GenericRemarks from '@/components/common/GenericRemarks';
import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

type ExtendedConnection = V_system_connections_completeRowSchema & {
  service_end_node_name?: string | null;
  service_node_name?: string | null;
  services_ip?: unknown;
  en_protection_interface?: string | null;
};

interface ConnectionCardProps {
  connection: ExtendedConnection;
  parentSystemId?: string;
  onViewDetails: (conn: V_system_connections_completeRowSchema) => void;
  onViewPath: (conn: V_system_connections_completeRowSchema) => void;
  onGoToSystem?: (conn: V_system_connections_completeRowSchema) => void;
  onEdit?: (conn: V_system_connections_completeRowSchema) => void;
  onDelete?: (conn: V_system_connections_completeRowSchema) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isSystemContext?: boolean;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  parentSystemId,
  onViewDetails,
  onViewPath,
  onGoToSystem,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isSystemContext = false,
}) => {
  const hasPath =
    Array.isArray(connection.working_fiber_in_ids) && connection.working_fiber_in_ids.length > 0;

  const isMobile = useIsMobile();
  const [isInteracting, setIsInteracting] = useState(false);

  const handleViewDetailsAction = useCallback(() => {
    if (isInteracting) return;
    setIsInteracting(true);
    onViewDetails(connection);

    // Safety fallback for non-navigating actions
    setTimeout(() => setIsInteracting(false), 5000);
  }, [onViewDetails, connection, isInteracting]);

  const { endA, endB } = useMemo(() => {
    const isFlipped = isSystemContext && parentSystemId && connection.en_id === parentSystemId;

    const endAData = {
      name: isFlipped ? connection.en_name : connection.sn_name || connection.system_name,
      ip: formatIP(isFlipped ? connection.en_ip : connection.sn_ip || connection.services_ip),
      location: isFlipped ? connection.en_node_name : connection.sn_node_name,
      workingPort: isFlipped
        ? connection.en_interface
        : connection.system_working_interface || connection.sn_interface,
      protectionPort: isFlipped
        ? connection.en_protection_interface
        : connection.system_protection_interface,
    };

    const endBData = {
      name: isFlipped ? connection.system_name || connection.sn_name : connection.en_name,
      ip: formatIP(isFlipped ? connection.sn_ip || connection.services_ip : connection.en_ip),
      location: isFlipped ? connection.sn_node_name : connection.en_node_name,
      workingPort: isFlipped
        ? connection.system_working_interface || connection.sn_interface
        : connection.en_interface,
      protectionPort: isFlipped
        ? connection.system_protection_interface
        : connection.en_protection_interface,
    };

    return { endA: endAData, endB: endBData };
  }, [connection, isSystemContext, parentSystemId]);

  return (
    <div
      onClick={handleViewDetailsAction}
      className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full group cursor-pointer relative overflow-hidden'
    >
      {/* Loading Overlay */}
      {isInteracting && (
        <div className='absolute inset-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200'>
          <LoadingSpinner size='md' color='primary' />
        </div>
      )}

      {/* Service Route Section */}
      {(connection.service_node_name || connection.service_end_node_name) && (
        <div className='bg-linear-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-900/40'>
          <div className='flex items-center gap-3 text-xs'>
            <span className='font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wide shrink-0'>
              Service Route:
            </span>
            <div className='flex items-center gap-1 flex-1 min-w-0'>
              <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                <div className='w-2 h-2 rounded-full bg-emerald-500 shrink-0' />
                <TruncateTooltip
                  className='font-semibold text-blue-950 dark:text-blue-50'
                  text={connection.service_node_name || 'N/A'}
                />
              </div>
              <FiChevronsRight className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0' />
              <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                <div className='w-2 h-2 rounded-full bg-rose-500 shrink-0' />
                <TruncateTooltip
                  className='font-semibold text-blue-950 dark:text-blue-50'
                  text={connection.service_end_node_name || 'N/A'}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Status Indicator Bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
          connection.status
            ? 'bg-linear-to-b from-emerald-500 to-emerald-600'
            : 'bg-linear-to-b from-red-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className='px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20'>
        <div className='flex justify-between items-start gap-3'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              {connection.connected_link_type_name && (
                <span className='inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-200 dark:border-blue-800/50'>
                  {connection.connected_link_type_name}
                </span>
              )}
              {connection.bandwidth_allocated && (
                <span className='inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-200 dark:border-purple-800/50'>
                  <FiActivity className='w-3.5 h-3.5' />
                  {connection.bandwidth_allocated}
                </span>
              )}
            </div>
            <h3 className='font-bold text-gray-900 dark:text-gray-100 text-base leading-snug cursor-text'>
              <TruncateTooltip
                text={
                  connection.service_name ||
                  connection.connected_system_name ||
                  'Unnamed Connection'
                }
                copyOnDoubleClick={true}
              />
            </h3>
          </div>
          {!connection.status && (
            <span className='inline-flex items-center text-xs font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'>
              INACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='px-5 py-4 space-y-4 flex-1'>
        {/* Physical Link Section */}
        <div className='bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            {/* End A */}
            <div className='flex-1 min-w-0'>
              <div className='mb-3 pb-2 border-b border-blue-200 dark:border-blue-800/50'>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider'>
                  {isSystemContext ? 'This End' : 'End A'}
                </span>
              </div>

              <div className='space-y-2'>
                <div
                  className='font-bold text-blue-950 dark:text-blue-50 text-sm truncate'
                  title={endA.name || ''}
                >
                  {endA.name}
                </div>

                {endA.location && (
                  <div
                    className='flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-200 truncate font-medium'
                    title={endA.location}
                  >
                    <FiMapPin className='w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400' />
                    <span className='truncate'>{endA.location}</span>
                  </div>
                )}

                <div className='font-mono text-xs font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-800/50 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 inline-block'>
                  {endA.ip}
                </div>

                <div className='inline-flex items-center justify-center font-mono font-bold text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm'>
                  {endA.workingPort || 'N/A'}
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className='flex items-center justify-center pt-12'>
              <div className='p-2 rounded-full bg-white dark:bg-gray-700/50 border border-blue-200 dark:border-blue-700 shadow-sm'>
                <FiChevronsRight className='w-5 h-5 text-blue-600 dark:text-blue-400' />
              </div>
            </div>

            {/* End B */}
            <div className='flex-1 min-w-0 text-right'>
              <div className='mb-3 pb-2 border-b border-blue-200 dark:border-blue-800/50'>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider'>
                  {isSystemContext ? 'Far End' : 'End B'}
                </span>
              </div>

              <div className='space-y-2 flex flex-col items-end'>
                <div
                  className='font-bold text-blue-950 dark:text-blue-50 text-sm truncate w-full'
                  title={endB.name || ''}
                >
                  {endB.name}
                </div>

                {endB.location && (
                  <div
                    className='flex items-center justify-end gap-1.5 text-xs text-blue-800 dark:text-blue-200 truncate w-full font-medium'
                    title={endB.location}
                  >
                    <span className='truncate'>{endB.location}</span>
                    <FiMapPin className='w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400' />
                  </div>
                )}

                <div className='font-mono text-xs font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-800/50 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 inline-block'>
                  {endB.ip}
                </div>

                <div className='inline-flex items-center justify-center font-mono font-bold text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm'>
                  {endB.workingPort || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        {(connection.vlan || connection.media_type_name) && (
          <div className='grid grid-cols-2 gap-3'>
            {connection.vlan && (
              <div className='bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm'>
                <div className='text-xs text-blue-700 dark:text-blue-300 font-bold mb-1'>
                  VLAN ID
                </div>
                <TruncateTooltip
                  text={connection.vlan}
                  className='font-mono font-bold text-blue-950 dark:text-blue-50'
                />
              </div>
            )}
            {connection.unique_id && (
              <div className='bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm'>
                <div className='text-xs text-blue-700 dark:text-blue-300 font-bold mb-1'>
                  UNIQUE ID
                </div>
                <TruncateTooltip
                  text={connection.unique_id}
                  className='font-mono font-bold text-blue-950 dark:text-blue-50'
                />
              </div>
            )}
            {connection.media_type_name && (
              <div className='bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm'>
                <div className='text-xs text-blue-700 dark:text-blue-300 font-bold mb-1'>
                  Media Type
                </div>
                <div className='font-semibold text-blue-950 dark:text-blue-50 truncate'>
                  {connection.media_type_name}
                </div>
              </div>
            )}
            {connection.commissioned_on && (
              <div className='bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm'>
                <div className='text-xs text-blue-700 dark:text-blue-300 font-bold mb-1'>
                  Commissioned On
                </div>
                <div className='font-semibold text-blue-950 dark:text-blue-50 truncate'>
                  {connection.commissioned_on}
                </div>
              </div>
            )}
            <GenericRemarks remark={connection.remark || ''} />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        className='px-4 py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-end gap-2 cursor-default'
        onClick={(e) => e.stopPropagation()}
      >
        {onGoToSystem && !isSystemContext && (
          <Button
            size='xs'
            variant='ghost'
            onClick={() => onGoToSystem(connection)}
            title='Go To Host System'
            className='text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 cursor-pointer font-semibold'
          >
            <FiServer className='w-4 h-4' />
          </Button>
        )}
        <div className='flex-1' />
        {!isMobile && (
          <Button
            size='xs'
            variant='secondary'
            onClick={handleViewDetailsAction}
            disabled={isInteracting}
            title='Full Details'
            className='font-semibold cursor-pointer bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700'
          >
            <FiMonitor className='w-4 h-4' />
            <span className='ml-1.5'>Details</span>
          </Button>
        )}

        {hasPath && (
          <Button
            size='xs'
            variant='outline'
            onClick={() => onViewPath(connection)}
            title='Trace Fiber Path'
            className='text-blue-700 hover:text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold cursor-pointer'
          >
            <FiEye className='w-4 h-4' />
            <span className='ml-1.5'>Path</span>
          </Button>
        )}
        {canEdit && onEdit && (
          <Button
            size='xs'
            variant='ghost'
            onClick={() => onEdit(connection)}
            title='Edit Connection'
            className='text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 cursor-pointer font-semibold'
          >
            <FiEdit2 className='w-4 h-4' />
          </Button>
        )}
        {canDelete && onDelete && (
          <Button
            size='xs'
            variant='ghost'
            className='text-red-800 hover:text-red-900 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20 cursor-pointer font-semibold'
            onClick={() => onDelete(connection)}
            title='Delete Connection'
          >
            <FiTrash2 className='w-4 h-4' />
          </Button>
        )}
      </div>
    </div>
  );
};
