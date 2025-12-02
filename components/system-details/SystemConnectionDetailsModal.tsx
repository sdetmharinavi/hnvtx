// components/system-details/SystemConnectionDetailsModal.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Modal, PageSpinner, StatusBadge } from '@/components/common/ui';
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

interface SystemConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string | null;
}

// Define a header component for the blue bars
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
  const { data: ofcData } = useTableQuery(supabase, 'v_ofc_connections_complete', {
    filters: {
      system_id: connection?.system_id ?? '',
    },
    enabled: !!connection,
    limit: 20
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

  // --- SECTION 1: CIRCUIT INFORMATION ---
  const circuitColumns = useMemo(
    (): Column<Row<'v_system_connections_complete'>>[] => [
      {
        key: 'service_name',
        title: 'Service Name',
        // Use 'service_name' as the dataIndex now
        dataIndex: 'service_name' as keyof Row<'v_system_connections_complete'>,
        editable: true,
        width: 200,
        render: (val, record) => {
           // Fallback to customer_name if service_name is empty (legacy support)
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
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        render: (val) => <StatusBadge status={val as boolean} />,
      },
    ],
    []
  );

  // --- SECTION 2: END A & END B DETAILS (Transformation) ---
  const endPointData = useMemo(() => {
    if (!connection) return [];
    
    // Determine if we have a specific Start Node defined.
    // If sn_name exists, use it. Otherwise, fall back to the Source System itself.
    const hasStartNode = !!connection.sn_name;
    
    return [
      {
        id: `${connection.id}-A`, // Virtual ID
        end: 'End A',
        
        // Fallback Logic: Use explicit SN IP, or if local connection, fallback to System IP
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node_ip: hasStartNode ? connection.sn_ip : (connection.sn_ip || (connection as any).services_ip || parentSystem?.ip_address),
        
        // Fallback Logic: If no SN Name, display Parent System Name
        system_name: hasStartNode ? connection.sn_name : (connection.system_name || 'Unknown System'),
        
        // Fallback Logic: If no SN Interface, display System Working Interface
        interface: hasStartNode ? connection.sn_interface : (connection.system_working_interface || connection.sn_interface),
        
        capacity: connection.bandwidth, 
        vlan: connection.vlan,
        // For editing mapping
        realId: connection.id,
        fieldMap: {
          // If we are falling back to the System, update system_working_interface
          interface: hasStartNode ? 'sn_interface' : 'system_working_interface',
        },
      },
      {
        id: `${connection.id}-B`, // Virtual ID
        end: 'End B',
        node_ip: connection.en_ip,
        system_name: connection.en_name || '',
        interface: connection.en_interface,
        capacity: connection.bandwidth,
        vlan: connection.vlan,
        realId: connection.id,
        fieldMap: {
          interface: 'en_interface',
        },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCellEdit = (record: any, column: Column<any>, newValue: string) => {
    // 1. Circuit Info Edit
    if (record.id === connection?.id) {
      const updateData = { [column.dataIndex]: newValue };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateConnection({ id: record.id, data: updateData as any });
    }
    // 2. End Point Edit (Virtual Rows)
    else if (record.realId) {
      const realColumn = record.fieldMap[column.dataIndex];
      if (realColumn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateConnection({ id: record.realId, data: { [realColumn]: newValue } as any });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={connection?.system_name + ' Port: ' + (connection?.system_working_interface || 'N/A')} 
      size="full"
      className="bg-gray-50 dark:bg-gray-900 w-[95vw] h-[90vh] max-w-[1600px]"
    >
      {isLoading ? (
        <PageSpinner text="Loading Circuit Details..." />
      ) : connection ? (
        <div className="space-y-8 pb-10">
          {/* SECTION 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader title="Circuit Information" />
            <div className="p-0">
              <DataTable
                tableName="v_system_connections_complete"
                data={[connection]} 
                columns={circuitColumns}
                searchable={false}
                showColumnSelector={false}
                onCellEdit={handleCellEdit}
                pagination={{ current: 1, pageSize: 1, total: 1, onChange: () => {} }}
                bordered={false}
                density="compact"
              />
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader title="End A & End B Details" />
            <div className="p-0">
              <DataTable
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tableName={'v_system_connections_complete' as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={endPointData as any[]}
                columns={endPointColumns}
                searchable={false}
                showColumnSelector={false}
                onCellEdit={handleCellEdit}
                pagination={{ current: 1, pageSize: 2, total: 2, onChange: () => {} }}
                bordered={false}
                density="compact"
              />
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title="OFC Details"
              action={
                <button 
                  onClick={handleOpenAllocationModal} 
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-sm"
                >
                  + Map OFC
                </button>
              }
            />
            <div className="p-0">
              {!ofcData?.data || ofcData.data.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No OFC details found directly linked to this connection&apos;s system.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use the &quot;Map OFC&quot; button to allocate fibers.
                  </p>
                </div>
              ) : (
                <div className="p-4 text-sm">
                   <p className="text-gray-600 dark:text-gray-300">OFC Data Present: {ofcData.data.length} records found.</p>
                </div>
              )}
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