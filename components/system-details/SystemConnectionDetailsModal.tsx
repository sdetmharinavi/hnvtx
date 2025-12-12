// components/system-details/SystemConnectionDetailsModal.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Modal, PageSpinner } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useTableRecord, useTableUpdate, useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
import { TraceRoutes, useTracePath } from '@/hooks/database/trace-hooks';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiberAllocationModal } from '@/components/system-details/FiberAllocationModal';
import { PathDisplay } from '@/components/system-details/PathDisplay';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import { FiActivity, FiHash, FiServer, FiTag, FiGlobe, FiCpu } from 'react-icons/fi';
import { formatIP } from '@/utils/formatters';

interface SystemConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string | null;
}

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-t-lg border-b border-gray-200 dark:border-gray-700 mt-6 first:mt-0">
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {action}
  </div>
);

export const SystemConnectionDetailsModal: React.FC<SystemConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  connectionId,
}) => {
  const supabase = createClient();
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTracing, setIsTracing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tracePath = useTracePath(supabase);

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [connectionToAllocate, setConnectionToAllocate] = useState<V_system_connections_completeRowSchema | null>(null);

  // 1. Fetch the main connection record
  const {
    data: connection,
    isLoading,
    refetch,
  } = useTableRecord(supabase, 'v_system_connections_complete', connectionId);

  // 2. Fetch the parent system record (Required for Allocation Modal and Fallback Display)
  const {
    data: parentSystem
  } = useTableRecord(supabase, 'v_systems_complete', connection?.system_id || null, {
    enabled: !!connection?.system_id
  });

  // 3. Fetch OFC details related to this connection
  // Filter specifically for fibers that are part of this connection's ID arrays
  const allocatedFiberIds = useMemo(() => {
     if(!connection) return [];
     return [
         ...(connection.working_fiber_in_ids || []),
         ...(connection.working_fiber_out_ids || []),
         ...(connection.protection_fiber_in_ids || []),
         ...(connection.protection_fiber_out_ids || [])
     ].filter(Boolean);
  }, [connection]);

  const { data: ofcData } = useTableQuery(supabase, 'v_ofc_connections_complete', {
    filters: {
      id: { operator: 'in', value: allocatedFiberIds }
    },
    enabled: allocatedFiberIds.length > 0,
    limit: 100 // Should be plenty for one connection
  });

  // 4. Update Mutation for Cell Editing
  const { mutate: updateConnection } = useTableUpdate(supabase, 'system_connections', {
    onSuccess: () => {
      toast.success('Field updated successfully');
      refetch();
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
    refetch();
    setIsAllocationModalOpen(false);
    toast.success("Allocation updated successfully");
  }, [refetch]);

  // --- COLUMNS ---

  const circuitColumns = useMemo(
    (): Column<Row<'v_system_connections_complete'>>[] => [
      {
        key: 'service_name',
        title: 'Service Name',
        dataIndex: 'service_name' as keyof Row<'v_system_connections_complete'>,
        editable: true,
        width: 200,
        render: (val, record) => {
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           return <span className="font-medium text-gray-900 dark:text-white">{(val as string) || (record as any).customer_name || 'N/A'}</span>
        }
      },
      {
        key: 'media_type_name',
        title: 'Category',
        dataIndex: 'connected_link_type_name',
        width: 120,
      },
      // Added Service IP Column
      {
        key: 'services_ip',
        title: 'Service IP',
        dataIndex: 'services_ip',
        editable: true,
        width: 130,
        render: (val) => val ? <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{formatIP(val)}</span> : <span className="text-gray-400 italic text-xs">-</span>
      },
      // Added Service Interface Column
      {
        key: 'services_interface',
        title: 'Service Port',
        dataIndex: 'services_interface',
        editable: true,
        width: 120,
        render: (val) => val ? <span className="font-mono text-sm">{val as string}</span> : <span className="text-gray-400 italic text-xs">-</span>
      },
      { key: 'bandwidth', title: 'Capacity', dataIndex: 'bandwidth', editable: true, width: 100 },
      {
        key: 'bandwidth_allocated',
        title: 'Allocated',
        dataIndex: 'bandwidth_allocated',
        editable: true,
        width: 100,
      },
      { key: 'lc_id', title: 'LC ID', dataIndex: 'lc_id', editable: true, width: 100 },
      { key: 'unique_id', title: 'Unique ID', dataIndex: 'unique_id', editable: true, width: 150 },
      { key: 'vlan', title: 'VLAN', dataIndex: 'vlan', editable: true, width: 80 },
    ],
    []
  );

  // --- END POINT DATA TRANSFORMATION ---
  const endPointData = useMemo(() => {
    if (!connection) return [];
    const hasStartNode = !!connection.sn_name;

    return [
      {
        id: `${connection.id}-A`, // Virtual ID
        end: 'End A',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node_ip: hasStartNode ? connection.sn_ip : (connection.sn_ip || (connection as any).services_ip || parentSystem?.ip_address),
        system_name: hasStartNode ? connection.sn_name : (connection.system_name || 'Unknown System'),
        interface: hasStartNode ? connection.sn_interface : (connection.system_working_interface || connection.sn_interface),
        realId: connection.id,
        fieldMap: { interface: hasStartNode ? 'sn_interface' : 'system_working_interface' },
      },
      {
        id: `${connection.id}-B`, // Virtual ID
        end: 'End B',
        node_ip: connection.en_ip,
        system_name: connection.en_name || '',
        interface: connection.en_interface,
        realId: connection.id,
        fieldMap: { interface: 'en_interface' },
      },
    ];
  }, [connection, parentSystem]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endPointColumns: Column<any>[] = [
    {
      key: 'end',
      title: 'End Info',
      dataIndex: 'end',
      width: 80,
      render: (val) => <span className="font-bold text-blue-600">{val as string}</span>,
    },
    { key: 'node_ip', title: 'Node IP', dataIndex: 'node_ip', width: 120 },
    {
      key: 'system_name',
      title: 'System Name',
      dataIndex: 'system_name',
      width: 250,
      render: (val) => <TruncateTooltip text={val as string} />,
    },
    {
      key: 'interface',
      title: 'Interface/Port',
      dataIndex: 'interface',
      editable: true,
      width: 150,
    },
  ];

  // Generate columns for the physical fiber table using the shared config
  const ofcColumns = OfcDetailsTableColumns(ofcData?.data || []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCellEdit = (record: any, column: Column<any>, newValue: string) => {
    if (record.id === connection?.id) {
      const updateData = { [column.dataIndex]: newValue };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateConnection({ id: record.id, data: updateData as any });
    }
    else if (record.realId) {
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
        <div className="flex flex-col gap-4">
            {/* Header: Service Name */}
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wide">Service Name / Customer</div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white wrap-break-words leading-tight">
                    {record.service_name || record.customer_name || 'N/A'}
                </div>
                 <div className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {record.connected_link_type_name || 'Link'}
                </div>
            </div>

            {/* Service Connectivity Details (IP/Interface) */}
            {(record.services_ip || record.services_interface) && (
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                 {record.services_ip && (
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                         <FiGlobe size={10} /> Service IP
                      </div>
                      <div className="font-mono text-sm font-medium">{formatIP(record.services_ip)}</div>
                   </div>
                 )}
                 {record.services_interface && (
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                         <FiCpu size={10} /> Service Port
                      </div>
                      <div className="font-mono text-sm font-medium">{record.services_interface}</div>
                   </div>
                 )}
              </div>
            )}

            {/* Bandwidth Card */}
            <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-800 p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                        <FiActivity size={12} />
                        <span className="text-[10px] uppercase font-bold">Capacity</span>
                    </div>
                    <div className="font-mono text-sm font-semibold">{record.bandwidth || '-'}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                        <FiActivity size={12} />
                        <span className="text-[10px] uppercase font-bold">Allocated</span>
                    </div>
                    <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {record.bandwidth_allocated || '-'}
                    </div>
                </div>
            </div>

            {/* IDs Grid */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <FiTag size={10} />
                        <span className="text-[10px] uppercase font-bold">VLAN</span>
                    </div>
                    <span className="font-mono font-medium text-xs block truncate">{record.vlan || '-'}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <FiHash size={10} />
                        <span className="text-[10px] uppercase font-bold">LC ID</span>
                    </div>
                    <span className="font-mono font-medium text-xs block truncate" title={record.lc_id}>{record.lc_id || '-'}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <FiHash size={10} />
                        <span className="text-[10px] uppercase font-bold">Unique</span>
                    </div>
                    <span className="font-mono font-medium text-xs block truncate" title={record.unique_id}>{record.unique_id || '-'}</span>
                </div>
            </div>
        </div>
    );
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEndpointMobile = useCallback((record: any) => {
     return (
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-600 text-xs uppercase tracking-wide">{record.end}</span>
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-300">
                        {record.node_ip || 'No IP'}
                    </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiServer className="w-3.5 h-3.5 text-gray-400" />
                    {record.system_name}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-gray-400 uppercase mb-0.5">Interface</div>
                <div className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    {record.interface || '-'}
                </div>
            </div>
        </div>
     );
  }, []);

  const renderFiberMobile = useCallback((record: Row<'v_ofc_connections_complete'>) => {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[70%]">
                    {record.ofc_route_name}
                 </span>
                 <div className="flex items-center gap-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    <span>F{record.fiber_no_sn}</span>
                    <span className="text-gray-400">→</span>
                    <span>F{record.fiber_no_en}</span>
                 </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-1.5 mt-0.5">
                <span>{record.otdr_distance_sn_km ? `${record.otdr_distance_sn_km} km` : '-'}</span>
                <span>Loss: {record.route_loss_db || '-'} dB</span>
            </div>
        </div>
    );
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={connection?.service_name || connection?.system_name || "Connection Details"}
      size="full"
      className="bg-gray-50 dark:bg-gray-900 w-[95vw] h-[90vh] max-w-[1600px]"
    >
      {isLoading ? (
        <PageSpinner text="Loading Circuit Details..." />
      ) : connection ? (
        <div className="space-y-8 pb-10">
          {/* SECTION 1: CIRCUIT INFO */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader title="Circuit Information" />
            <div className="p-0">
                   <DataTable
      autoHideEmptyColumns={true}
                tableName="v_system_connections_complete"
                data={[connection]}
                columns={circuitColumns}
                searchable={false}
                showColumnSelector={false}
                onCellEdit={handleCellEdit}
                renderMobileItem={renderCircuitMobile}
                pagination={{ current: 1, pageSize: 1, total: 1, onChange: () => {} }}
                bordered={false}
                density="compact"
              />
            </div>
          </div>

          {/* SECTION 2: END POINTS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader title="End A & End B Details" />
            <div className="p-0">
                   <DataTable
      autoHideEmptyColumns={true}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tableName={'v_system_connections_complete' as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={endPointData as any[]}
                columns={endPointColumns}
                searchable={false}
                showColumnSelector={false}
                renderMobileItem={renderEndpointMobile}
                onCellEdit={handleCellEdit}
                pagination={{ current: 1, pageSize: 2, total: 2, onChange: () => {} }}
                bordered={false}
                density="compact"
              />
            </div>
          </div>

          {/* SECTION 3: OFC DETAILS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title="Optical Fiber Path"
              action={
                <button
                  onClick={handleOpenAllocationModal}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-sm"
                >
                  {allocatedFiberIds.length > 0 ? "Modify Allocation" : "Map OFC"}
                </button>
              }
            />
            <div className="p-4 space-y-6">
               {/* 3.1 Path Text Summary */}
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Logical Route</h4>
                  <PathDisplay systemConnectionId={connection.id} />
               </div>

               {/* 3.2 Physical Fiber Table */}
               <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Physical Fiber Segments</h4>
                  {!ofcData?.data || ofcData.data.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        No fibers allocated yet.
                      </p>
                    </div>
                  ) : (
                         <DataTable
      autoHideEmptyColumns={true}
                        tableName="v_ofc_connections_complete"
                        data={ofcData.data}
                        columns={ofcColumns}
                        renderMobileItem={renderFiberMobile}
                        pagination={{ current: 1, pageSize: 10, total: ofcData.data.length, onChange: () => {} }}
                        density="compact"
                    />
                  )}
               </div>
            </div>
          </div>

          <SystemFiberTraceModal
            isOpen={isTraceModalOpen}
            onClose={() => setIsTraceModalOpen(false)}
            traceData={traceModalData}
            isLoading={isTracing}
          />

          {/* Render the Allocation Modal */}
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
        <div className="flex items-center justify-center h-full text-red-500">
          Connection not found
        </div>
      )}
    </Modal>
  );
};