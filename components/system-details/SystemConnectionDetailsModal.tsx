// components/system-details/SystemConnectionDetailsModal.tsx
'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { Modal, PageSpinner } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useRpcRecord, useTableUpdate, usePagedData } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
  V_ofc_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { FiberAllocationModal } from '@/components/system-details/FiberAllocationModal';
import { PathDisplay } from '@/components/system-details/PathDisplay';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import {
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiMapPin,
  FiZap,
  FiServer,
} from 'react-icons/fi'; // ADDED Chevrons
import { formatIP } from '@/utils/formatters';

interface SystemConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string | null;
  parentSystem: V_systems_completeRowSchema | null;
}

// Collapsible Header Component
const SectionHeader = ({
  title,
  action,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
}: {
  title: string;
  action?: React.ReactNode;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}) => (
  <div
    className={`flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 px-4 py-3 border-b border-blue-200 dark:border-blue-800/50 mt-6 first:mt-0 rounded-t-lg ${isCollapsible ? 'cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/40' : ''}`}
    onClick={isCollapsible && onToggle ? onToggle : undefined}
  >
    <div className='flex items-center gap-3'>
      <div className='w-1 h-6 bg-blue-600 rounded-full'></div>
      <h3 className='text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2'>
        {title}
        {isCollapsible && (
          <span className='text-blue-400 dark:text-blue-500'>
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          </span>
        )}
      </h3>
    </div>
    {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
  </div>
);

export const SystemConnectionDetailsModal: React.FC<SystemConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  connectionId,
  parentSystem,
}) => {
  const supabase = createClient();
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [connectionToAllocate, setConnectionToAllocate] =
    useState<V_system_connections_completeRowSchema | null>(null);

  // Expanded states for sections
  const [isPathExpanded, setIsPathExpanded] = useState(false);

  // 1. Fetch Connection Details
  const {
    data: connection,
    isLoading: isConnectionLoading,
    isFetching: isConnectionFetching,
    refetch: refetchConnection,
  } = useRpcRecord(supabase, 'v_system_connections_complete', connectionId);

  const allocatedFiberIds = useMemo(() => {
    if (!connection) return [];
    return [
      ...(connection.working_fiber_in_ids || []),
      ...(connection.working_fiber_out_ids || []),
      ...(connection.protection_fiber_in_ids || []),
      ...(connection.protection_fiber_out_ids || []),
    ].filter(Boolean);
  }, [connection]);

  const fiberFilters = useMemo(() => {
    if (allocatedFiberIds.length > 0) {
      return { id: allocatedFiberIds };
    }
    return { id: '00000000-0000-0000-0000-000000000000' };
  }, [allocatedFiberIds]);

  // 2. Fetch Fiber Segments
  const {
    data: ofcData,
    isFetching: isOfcFetching,
    refetch: refetchOfc,
  } = usePagedData<V_ofc_connections_completeRowSchema>(
    supabase,
    'v_ofc_connections_complete',
    {
      filters: fiberFilters,
      limit: 100,
    },
    { enabled: allocatedFiberIds.length > 0 },
  );

  const { mutate: updateConnection } = useTableUpdate(supabase, 'system_connections', {
    onSuccess: () => {
      toast.success('Field updated successfully');
      refetchConnection();
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  const handleOpenAllocationModal = useCallback(() => {
    if (connection) {
      setConnectionToAllocate(connection);
      setIsAllocationModalOpen(true);
    }
  }, [connection]);

  const handleAllocationSave = useCallback(() => {
    refetchConnection();
    refetchOfc();
    setIsAllocationModalOpen(false);
    toast.success('Allocation updated successfully');
  }, [refetchConnection, refetchOfc]);

  const handleRefreshData = useCallback(async () => {
    await Promise.all([refetchConnection(), refetchOfc()]);
    toast.success('Connection data refreshed');
  }, [refetchConnection, refetchOfc]);

  const circuitColumns = useMemo(
    (): Column<Row<'v_system_connections_complete'>>[] => [
      {
        key: 'service_name',
        title: 'Service Name',
        dataIndex: 'service_name' as keyof Row<'v_system_connections_complete'>,
        width: 200,
        render: (val, record) => {
          return (
            <span className='font-semibold text-blue-950 dark:text-blue-50'>
              {(val as string) ||
                (record as V_system_connections_completeRowSchema).connected_system_name ||
                'N/A'}
            </span>
          );
        },
      },
      {
        key: 'connected_link_type_name',
        title: 'Category',
        dataIndex: 'connected_link_type_name',
        width: 120,
      },
      {
        key: 'media_type_name',
        title: 'Media/Port Type',
        dataIndex: 'media_type_name',
        width: 150,
        render: (val) =>
          val ? (
            <span className='font-semibold text-blue-900 dark:text-blue-100'>{val as string}</span>
          ) : (
            <span className='text-slate-500 dark:text-slate-400 italic text-xs'>-</span>
          ),
      },
      {
        key: 'services_ip',
        title: 'Service IP',
        dataIndex: 'services_ip',
        width: 130,
        render: (val) =>
          val ? (
            <span className='font-mono text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded'>
              {formatIP(val)}
            </span>
          ) : (
            <span className='text-slate-500 dark:text-slate-400 italic text-xs'>-</span>
          ),
      },
      {
        key: 'services_interface',
        title: 'Service Port',
        dataIndex: 'services_interface',
        width: 120,
        render: (val) =>
          val ? (
            <span className='font-mono text-sm font-semibold text-blue-900 dark:text-blue-100'>
              {val as string}
            </span>
          ) : (
            <span className='text-slate-500 dark:text-slate-400 italic text-xs'>-</span>
          ),
      },
      { key: 'bandwidth', title: 'Capacity', dataIndex: 'bandwidth', width: 100 },
      {
        key: 'bandwidth_allocated',
        title: 'Allocated',
        dataIndex: 'bandwidth_allocated',
        width: 100,
      },
      { key: 'lc_id', title: 'LC ID', dataIndex: 'lc_id', width: 100 },
      { key: 'unique_id', title: 'Unique ID', dataIndex: 'unique_id', width: 150 },
      { key: 'vlan', title: 'VLAN', dataIndex: 'vlan', width: 80 },
    ],
    [],
  );

  const endPointData = useMemo(() => {
    if (!connection) return [];

    type Endpoint = {
      id: string;
      end: string;
      node_ip: unknown;
      system_name: string;
      interface: string | null | undefined;
      protection_interface: string | null | undefined;
      realId: string | null;
      fieldMap: Record<string, string>;
    };

    const endA: Endpoint = {
      id: `${connection.id}-A`,
      end: 'End A',
      node_ip:
        connection.sn_ip ||
        (connection as V_system_connections_completeRowSchema & { services_ip: unknown })
          .services_ip ||
        parentSystem?.ip_address,
      system_name: connection.sn_name || connection.system_name || 'Unknown System',
      interface: connection.sn_interface || connection.system_working_interface,
      protection_interface: connection.system_protection_interface,
      realId: connection.id,
      fieldMap: { interface: 'sn_interface', protection_interface: 'system_protection_interface' },
    };

    const endB: Endpoint = {
      id: `${connection.id}-B`,
      end: 'End B',
      node_ip: connection.en_ip,
      system_name: connection.en_name || '',
      interface: connection.en_interface,
      protection_interface: (
        connection as V_system_connections_completeRowSchema & { en_protection_interface?: string }
      ).en_protection_interface,
      realId: connection.id,
      fieldMap: { interface: 'en_interface', protection_interface: 'en_protection_interface' },
    };

    return [endA, endB];
  }, [connection, parentSystem]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endPointColumns: Column<any>[] = [
    {
      key: 'end',
      title: 'End Info',
      dataIndex: 'end',
      width: 80,
      render: (val) => (
        <span className='font-bold text-blue-700 dark:text-blue-300'>{val as string}</span>
      ),
    },
    {
      key: 'node_ip',
      title: 'Node IP',
      dataIndex: 'node_ip',
      width: 120,
      render: (val) => formatIP(val),
    },
    {
      key: 'system_name',
      title: 'System Name',
      dataIndex: 'system_name',
      width: 250,
      render: (val) => <TruncateTooltip text={val as string} />,
    },
    {
      key: 'interface',
      title: 'Working Port',
      dataIndex: 'interface',
      width: 150,
    },
    {
      key: 'protection_interface',
      title: 'Protection Port',
      dataIndex: 'protection_interface',
      width: 150,
      render: (val: unknown) =>
        val ? (
          <>{String(val)}</>
        ) : (
          <span className='text-slate-500 dark:text-slate-400 italic text-xs'>-</span>
        ),
    },
  ];

  const ofcColumns = OfcDetailsTableColumns(ofcData?.data || []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCellEdit = (record: any, column: Column<any>, newValue: string) => {
    if (record.id === connection?.id) {
      const updateData = { [column.dataIndex]: newValue };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateConnection({ id: record.id, data: updateData as any });
    } else if (record.realId) {
      const realColumn = record.fieldMap[column.dataIndex];
      if (realColumn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateConnection({ id: record.realId, data: { [realColumn]: newValue } as any });
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const renderCircuitMobile = useCallback((record: any, _actions: React.ReactNode) => {
    return (
      <div className='flex flex-col gap-4'>
        <div>
          <div className='text-[10px] text-blue-700 dark:text-blue-300 uppercase font-bold mb-1 tracking-wide'>
            Service Name / Customer
          </div>
          <div className='font-bold text-lg text-blue-950 dark:text-blue-50 wrap-break-words leading-tight'>
            {record.service_name || record.customer_name || 'N/A'}
          </div>
          <div className='inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'>
            {record.connected_link_type_name || 'Link'}
          </div>
        </div>
      </div>
    );
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEndpointMobile = useCallback((record: any) => {
    return (
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-bold text-blue-700 dark:text-blue-300 text-xs uppercase tracking-wide'>
              {record.end}
            </span>
            <span className='text-xs font-mono font-semibold bg-blue-100 dark:bg-blue-900/30 px-1.5 rounded text-blue-900 dark:text-blue-100'>
              {record.node_ip || 'No IP'}
            </span>
          </div>
          <div className='text-sm font-semibold text-blue-950 dark:text-blue-50 flex items-center gap-2'>
            <FiServer className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />
            {record.system_name}
          </div>
        </div>
        <div className='text-right'>
          <div className='text-[10px] text-blue-700 dark:text-blue-300 uppercase mb-0.5 font-bold'>
            Interface
          </div>
          <div className='font-mono text-sm font-bold text-blue-900 dark:text-blue-100'>
            {record.interface || '-'}
          </div>
        </div>
      </div>
    );
  }, []);

  // FIX: Use updated fiber numbers (logical) for both start and end, defaulting to physical
  const renderFiberMobile = useCallback((record: Row<'v_ofc_connections_complete'>) => {
    const startFib = record.updated_fiber_no_sn ?? record.fiber_no_sn;
    const endFib = record.updated_fiber_no_en ?? record.fiber_no_en;

    return (
      <div className='flex flex-col gap-1.5 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[70%]'>
            {record.ofc_route_name}
          </span>
          <div className='flex items-center gap-1.5 text-xs font-mono font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded'>
            <span>F{startFib}</span>
            <span className='text-blue-400'>→</span>
            <span>F{endFib}</span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2 mt-1 text-xs'>
          <div className='flex items-center gap-1.5 text-gray-600 dark:text-gray-400'>
            <FiMapPin className='w-3 h-3' />
            <span className='truncate'>{record.updated_sn_name || record.sn_name}</span>
          </div>
          <div className='flex items-center gap-1.5 justify-end text-gray-600 dark:text-gray-400'>
            <span className='truncate'>{record.updated_en_name || record.en_name}</span>
            <FiMapPin className='w-3 h-3' />
          </div>
        </div>

        <div className='flex justify-between text-xs pt-2 mt-1 border-t border-gray-100 dark:border-gray-700/50'>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase text-gray-400 font-bold'>End A</span>
            <span className='font-mono'>
              {record.otdr_distance_sn_km ? `${record.otdr_distance_sn_km} km` : '-'}
            </span>
            <span className='font-mono text-blue-600 dark:text-blue-400'>
              {record.sn_power_dbm ? `${record.sn_power_dbm} dBm` : '-'}
            </span>
          </div>
          <div className='flex flex-col items-center'>
            <span className='text-[10px] uppercase text-gray-400 font-bold'>Loss</span>
            <div className='flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold mt-1'>
              <FiZap className='w-3 h-3' />
              <span>{record.route_loss_db || '-'} dB</span>
            </div>
          </div>
          <div className='flex flex-col items-end'>
            <span className='text-[10px] uppercase text-gray-400 font-bold'>End B</span>
            <span className='font-mono'>
              {record.otdr_distance_en_km ? `${record.otdr_distance_en_km} km` : '-'}
            </span>
            <span className='font-mono text-purple-600 dark:text-purple-400'>
              {record.en_power_dbm ? `${record.en_power_dbm} dBm` : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  if (!isOpen) return null;

  // Determine busy state for spinner
  const isBusy = isConnectionFetching || isOfcFetching;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={connection?.service_name || connection?.system_name || 'Connection Details'}
      size='full'
      className='bg-gray-50 dark:bg-gray-900 w-[95vw] h-[90vh] max-w-[1600px]'
    >
      {isConnectionLoading ? (
        <PageSpinner text='Loading Circuit Details...' />
      ) : connection ? (
        <div className='space-y-8 pb-10'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <SectionHeader title='Circuit Information' />
            <div className='p-0'>
              <DataTable
                autoHideEmptyColumns={true}
                tableName='v_system_connections_complete'
                data={[connection]}
                columns={circuitColumns}
                searchable={false}
                filterable={false}
                showColumnSelector={false}
                showColumnsToggle={false}
                onCellEdit={handleCellEdit}
                renderMobileItem={renderCircuitMobile}
                pagination={{ current: 1, pageSize: 1, total: 1, onChange: () => {} }}
                bordered={false}
                density='compact'
              />
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <SectionHeader title='End A & End B Details' />
            <div className='p-0'>
              <DataTable
                autoHideEmptyColumns={true}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tableName={'v_system_connections_complete' as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={endPointData as any[]}
                columns={endPointColumns}
                searchable={false}
                filterable={false}
                showColumnSelector={false}
                showColumnsToggle={false}
                renderMobileItem={renderEndpointMobile}
                onCellEdit={handleCellEdit}
                pagination={{ current: 1, pageSize: 2, total: 2, onChange: () => {} }}
                bordered={false}
                density='compact'
              />
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <SectionHeader
              title='Optical Fiber Path'
              isCollapsible={true}
              isExpanded={isPathExpanded}
              onToggle={() => setIsPathExpanded(!isPathExpanded)}
              action={
                <div className='flex gap-2'>
                  <button
                    onClick={handleRefreshData}
                    className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50'
                    title='Refresh Connection Data'
                    disabled={isBusy}
                  >
                    <FiRefreshCw className={isBusy ? 'animate-spin' : ''} size={16} />
                  </button>
                  <button
                    onClick={handleOpenAllocationModal}
                    className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors shadow-sm'
                  >
                    {allocatedFiberIds.length > 0 ? 'Modify Allocation' : 'Map OFC'}
                  </button>
                </div>
              }
            />
            {isPathExpanded && (
              <div className='p-4 space-y-6'>
                <div className='p-4 bg-linear-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-lg border border-blue-100 dark:border-blue-900/30'>
                  <h4 className='text-sm font-bold text-blue-800 dark:text-blue-200 mb-3 uppercase tracking-wide'>
                    Logical Route
                  </h4>
                  <PathDisplay systemConnectionId={connection.id} />
                </div>

                <div>
                  <h4 className='text-sm font-bold text-blue-800 dark:text-blue-200 mb-3 uppercase tracking-wide'>
                    Physical Fiber Segments
                  </h4>
                  {!ofcData?.data || ofcData.data.length === 0 ? (
                    <div className='p-6 text-center border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-lg bg-blue-50/30 dark:bg-blue-950/10'>
                      <p className='text-blue-700 dark:text-blue-300 font-medium'>
                        No fibers allocated yet.
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      autoHideEmptyColumns={true}
                      tableName='v_ofc_connections_complete'
                      data={ofcData.data}
                      columns={ofcColumns}
                      searchable={false}
                      filterable={false}
                      showColumnSelector={false}
                      showColumnsToggle={false}
                      renderMobileItem={renderFiberMobile}
                      pagination={{
                        current: 1,
                        pageSize: 10,
                        total: ofcData.data.length,
                        onChange: () => {},
                      }}
                      density='compact'
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {isAllocationModalOpen && (
            <FiberAllocationModal
              isOpen={isAllocationModalOpen}
              onClose={() => setIsAllocationModalOpen(false)}
              connection={connectionToAllocate}
              onSave={handleAllocationSave}
              parentSystem={parentSystem || null}
            />
          )}
        </div>
      ) : (
        <div className='flex items-center justify-center h-full text-red-700 dark:text-red-300 font-semibold'>
          Connection not found
        </div>
      )}
    </Modal>
  );
};
