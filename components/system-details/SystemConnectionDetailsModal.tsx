"use client";

import React, { useMemo } from 'react';
import { Modal, PageSpinner, StatusBadge } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useTableRecord, useTableUpdate, useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatDate } from '@/utils/formatters';

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

  // 1. Fetch the main connection record
  const { data: connection, isLoading, refetch } = useTableRecord(
    supabase,
    'v_system_connections_complete',
    connectionId
  );

  // 2. Fetch OFC details related to this connection (via logical paths)
  const { data: ofcData } = useTableQuery(supabase, 'v_ofc_connections_complete', {
    // Assuming the connection ID links to logical paths, we find fibers where the system connection matches
    // Note: This relies on the relationship established in previous migrations
    filters: { 
      // We need a way to filter OFC connections by the system connection. 
      // Since v_ofc_connections doesn't have system_connection_id directly, 
      // we filter by the system_id and interfaces, or rely on logical_path linkage if available.
      // For this UI, we will simulate it or use what's available.
      system_id: connection?.system_id ?? '',
      // In a real scenario with the new schema, we'd join via logical_fiber_paths
    },
    enabled: !!connection,
  });

  // 3. Update Mutation for Cell Editing
  const { mutate: updateConnection } = useTableUpdate(supabase, 'system_connections', {
    onSuccess: () => {
      toast.success("Field updated successfully");
      refetch();
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  // --- SECTION 1: CIRCUIT INFORMATION ---
  const circuitColumns = useMemo((): Column<Row<'v_system_connections_complete'>>[] => [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 100, render: (val) => <span className="font-mono text-xs">{String(val).slice(0, 8)}</span> },
    { key: 'customer_name', title: 'Service Name', dataIndex: 'customer_name', editable: true, width: 200 },
    { key: 'media_type_name', title: 'Category', dataIndex: 'media_type_name', width: 120 },
    { key: 'bandwidth', title: 'Capacity', dataIndex: 'bandwidth', editable: true, width: 100 },
    { key: 'lc_id', title: 'LCID', dataIndex: 'lc_id', editable: true, width: 100 },
    { key: 'unique_id', title: 'Unique ID', dataIndex: 'unique_id', editable: true, width: 150 },
    { key: 'vlan', title: 'VLAN', dataIndex: 'vlan', editable: true, width: 80 },
    { key: 'status', title: 'State', dataIndex: 'status', render: (val) => <StatusBadge status={val as boolean} /> },
  ], []);

  // --- SECTION 2: END A & END B DETAILS (Transformation) ---
  // We transform the single row into two rows for display
  const endPointData = useMemo(() => {
    if (!connection) return [];
    return [
      {
        id: `${connection.id}-A`, // Virtual ID
        end: 'End A',
        node_ip: connection.sn_ip,
        system_name: connection.sn_name || 'Unknown System',
        interface: connection.sn_interface,
        capacity: connection.bandwidth, // Assuming port capacity matches
        vlan: connection.vlan,
        // For editing mapping
        realId: connection.id,
        fieldMap: {
           interface: 'sn_interface'
        }
      },
      {
        id: `${connection.id}-B`, // Virtual ID
        end: 'End B',
        node_ip: connection.en_ip,
        system_name: connection.en_name || 'Unknown System',
        interface: connection.en_interface,
        capacity: connection.bandwidth,
        vlan: connection.vlan,
        realId: connection.id,
        fieldMap: {
           interface: 'en_interface'
        }
      }
    ];
  }, [connection]);

  // We need a specific column definition for this virtual table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endPointColumns: Column<any>[] = [
    { key: 'end', title: 'End Info', dataIndex: 'end', width: 80, render: (val) => <span className="font-bold text-blue-600">{val as string}</span> },
    { key: 'node_ip', title: 'Node IP', dataIndex: 'node_ip', width: 120 },
    { key: 'system_name', title: 'System Name', dataIndex: 'system_name', width: 250, render: (val) => <TruncateTooltip text={val as string} /> },
    { key: 'interface', title: 'Interface/Port', dataIndex: 'interface', editable: true, width: 150 }, // Editable!
    { key: 'vlan', title: 'VLAN', dataIndex: 'vlan', width: 80 },
  ];

  // --- HANDLERS ---

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
        // Map the virtual column to the real DB column
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
      title="" // Custom header
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
                data={[connection]} // Single row
                columns={circuitColumns}
                searchable={false}
                showColumnSelector={false}
                onCellEdit={handleCellEdit} // Enable editing
                pagination={{ current: 1, pageSize: 1, total: 1, onChange: () => {} }} // Hide pagination controls usually via CSS if needed, or just pass dummy
                bordered={false}
                density="compact"
              />
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader 
                title="End A & End B Details" 
            />
            <div className="p-0">
               {/* We use a generic table config here since the data is virtual */}
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
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-sm">
                        + Map OFC
                    </button>
                }
            />
            <div className="p-0">
              {(!ofcData?.data || ofcData.data.length === 0) ? (
                  <div className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No OFC details found for this circuit.</p>
                      <p className="text-xs text-gray-400 mt-1">Use the &quot;Allocate Fibers&quot; feature in the main dashboard to map fibers.</p>
                  </div>
              ) : (
                 // Placeholder for OFC table if data exists
                 <div className="p-4 text-sm">OFC Data Present (Implementation pending specific view requirement)</div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-red-500">
            Connection not found
        </div>
      )}
    </Modal>
  );
};