// app/dashboard/systems/[id]/page.tsx
"use client";

import { useMemo, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useRpcMutation, UploadColumnMapping, usePagedData, RpcFunctionArgs } from '@/hooks/database';
import { V_system_connections_completeRowSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { DEFAULTS } from '@/constants/constants';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';
import { createStandardActions } from '@/components/table/action-helpers';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import { ZapOff, Eye, Monitor } from 'lucide-react'; 
import { useDeprovisionServicePath } from '@/hooks/database/system-connection-hooks';
import { toPgBoolean, toPgDate } from '@/config/helper-functions';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { FiDatabase, FiUpload, FiGitBranch } from 'react-icons/fi';
import { SystemConnectionFormModal } from '@/components/system-details/SystemConnectionFormModal';
import { FiberAllocationModal } from '@/components/system-details/FiberAllocationModal';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
import { SystemConnectionDetailsModal } from '@/components/system-details/SystemConnectionDetailsModal'; 
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useQueryClient } from '@tanstack/react-query';
import { StatProps } from '@/components/common/page-header/StatCard';
import { usePortsData } from '@/hooks/data/usePortsData';
import { formatIP } from '@/utils/formatters';

type UpsertConnectionPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<V_system_connections_completeRowSchema | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [connectionToAllocate, setConnectionToAllocate] = useState<V_system_connections_completeRowSchema | null>(null);
  
  const [isDeprovisionModalOpen, setDeprovisionModalOpen] = useState(false);
  const [connectionToDeprovision, setConnectionToDeprovision] = useState<V_system_connections_completeRowSchema | null>(null);
  
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const tracePath = useTracePath(supabase);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsConnectionId, setDetailsConnectionId] = useState<string | null>(null);

  const { data: systemData, isLoading: isLoadingSystem } = usePagedData<V_systems_completeRowSchema>(supabase, 'v_systems_complete', { filters: { id: systemId }, orderBy:"system_working_interface" });
  const parentSystem = systemData?.data?.[0];

  const { data: connectionsData, isLoading: isLoadingConnections, refetch } = usePagedData<V_system_connections_completeRowSchema>(
    supabase, 'v_system_connections_complete', {
      filters: {
        system_id: systemId,
        ...(searchQuery ? { or: `(customer_name.ilike.%${searchQuery}%,connected_system_name.ilike.%${searchQuery}%)` } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );
  const connections = connectionsData?.data || [];
  const totalConnections = connectionsData?.total_count || 0;

  const { data: ports = [] } = usePortsData(systemId)({
      currentPage: 1, 
      pageLimit: 5000, 
      searchQuery: '',
      filters: {} 
  });

  const headerStats: StatProps[] = useMemo(() => {
    if (!ports || ports.length === 0) {
        return [{ label: 'Total Connections', value: totalConnections }];
    }

    const totalPorts = ports.length;
    const usedPorts = ports.filter(p => p.port_utilization).length;
    const availablePorts = ports.filter(p => !p.port_utilization && p.port_admin_status).length;
    const portsDown = ports.filter(p => !p.port_admin_status).length;
    const utilPercent = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;

    return [
        { label: 'Connections', value: totalConnections, color: 'default' },
        { label: 'Total Ports', value: totalPorts, color: 'default' },
        { label: 'Ports Used', value: usedPorts, color: 'primary' },
        { label: 'Ports Available', value: availablePorts, color: 'success' },
        { label: 'Ports Down', value: portsDown, color: 'danger' },
        { label: 'Utilization', value: `${utilPercent}%`, color: utilPercent > 80 ? 'warning' : 'default' },
    ];
  }, [ports, totalConnections]);

  const upsertMutation = useRpcMutation(supabase, 'upsert_system_connection_with_details', { 
    onSuccess: () => { 
      refetch(); 
      closeModal(); 
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ports_management_complete', { filters: { system_id: systemId } }] });
    } 
  });
  
  const deprovisionMutation = useDeprovisionServicePath();
  const deleteManager = useDeleteManager({ 
    tableName: 'system_connections', 
    onSuccess: () => { 
      refetch();
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ports_management_complete', { filters: { system_id: systemId } }] });
    } 
  });
  
  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(supabase, { 
    onSuccess: (result) => { 
      if (result.successCount > 0) {
        refetch();
      }
    } 
  });

  const columns = SystemConnectionsTableColumns(connections);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_system_connections_complete]);

  const openEditModal = useCallback((record: V_system_connections_completeRowSchema) => { setEditingRecord(record); setIsEditModalOpen(true); }, []);
  const openAddModal = useCallback(() => { setEditingRecord(null); setIsEditModalOpen(true); }, []);
  const closeModal = useCallback(() => { setEditingRecord(null); setIsEditModalOpen(false); }, []);
  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && parentSystem?.id) {
      const columnMapping: UploadColumnMapping<'v_system_connections_complete'>[] = [
        { excelHeader: 'Id', dbKey: 'id' },
        { excelHeader: 'Media Type Id', dbKey: 'media_type_id', required: true },
        { excelHeader: 'Status', dbKey: 'status', transform: toPgBoolean },
        
        { excelHeader: 'Sn Id', dbKey: 'sn_id' },
        { excelHeader: 'En Id', dbKey: 'en_id' },
        { excelHeader: 'Sn Ip', dbKey: 'sn_ip' },
        { excelHeader: 'Sn Interface', dbKey: 'sn_interface' },
        { excelHeader: 'En Ip', dbKey: 'en_ip' },
        { excelHeader: 'En Interface', dbKey: 'en_interface' },
        
        { excelHeader: 'Bandwidth Mbps', dbKey: 'bandwidth' },
        { excelHeader: 'Vlan', dbKey: 'vlan' },
        { excelHeader: 'LC ID', dbKey: 'lc_id' },      
        { excelHeader: 'Unique ID', dbKey: 'unique_id' },
        { excelHeader: 'Commissioned On', dbKey: 'commissioned_on', transform: toPgDate },
        { excelHeader: 'Remark', dbKey: 'remark' },
        { excelHeader: 'Customer Name', dbKey: 'service_name' },
        
        // ADDED: Keys to facilitate deduplication and linking
        { excelHeader: 'Service Id', dbKey: 'service_id' },
        { excelHeader: 'Service Node Id', dbKey: 'service_node_id' },
        { excelHeader: 'Connected System Name', dbKey: 'connected_system_name' },

        { excelHeader: 'Bandwidth Allocated Mbps', dbKey: 'bandwidth_allocated' },
        { excelHeader: 'Working Fiber In Ids', dbKey: 'working_fiber_in_ids' },
        { excelHeader: 'Working Fiber Out Ids', dbKey: 'working_fiber_out_ids' },
        { excelHeader: 'Protection Fiber In Ids', dbKey: 'protection_fiber_in_ids' },
        { excelHeader: 'Protection Fiber Out Ids', dbKey: 'protection_fiber_out_ids' },
        { excelHeader: 'System Working Interface', dbKey: 'system_working_interface' },
        { excelHeader: 'System Protection Interface', dbKey: 'system_protection_interface' },
        { excelHeader: 'Connected Link Type', dbKey: 'connected_link_type_name' },
        
        { excelHeader: 'Sdh Stm No', dbKey: 'sdh_stm_no' },
        { excelHeader: 'Sdh Carrier', dbKey: 'sdh_carrier' },
        { excelHeader: 'Sdh A Slot', dbKey: 'sdh_a_slot' },
        { excelHeader: 'Sdh A Customer', dbKey: 'sdh_a_customer' },
        { excelHeader: 'Sdh B Slot', dbKey: 'sdh_b_slot' },
        { excelHeader: 'Sdh B Customer', dbKey: 'sdh_b_customer' },
      ];

      uploadConnections({ file, columns: columnMapping, parentSystemId: parentSystem.id });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadConnections, parentSystem]);
  
  const handleOpenAllocationModal = useCallback((record: V_system_connections_completeRowSchema) => { setConnectionToAllocate(record); setIsAllocationModalOpen(true); }, []);
  
  const handleDeprovisionClick = useCallback((record: V_system_connections_completeRowSchema) => { setConnectionToDeprovision(record); setDeprovisionModalOpen(true); }, []);

  const handleConfirmDeprovision = () => {
    if (!connectionToDeprovision?.id) return;
    deprovisionMutation.mutate(connectionToDeprovision.id, {
      onSuccess: () => {
        setDeprovisionModalOpen(false);
        setConnectionToDeprovision(null);
        refetch();
      }
    });
  };
  
  const handleAllocationSave = useCallback(() => {
    refetch();
    setIsAllocationModalOpen(false);
  }, [refetch]);
  
 const handleTracePath = useCallback(async (record: V_system_connections_completeRowSchema) => {
    setIsTracing(true);
    setIsTraceModalOpen(true);
    setTraceModalData(null);
    try {
      const traceData = await tracePath(record);
      setTraceModalData(traceData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to trace path");
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  }, [tracePath]);

  const handleViewDetails = useCallback((record: V_system_connections_completeRowSchema) => {
      setDetailsConnectionId(record.id);
      setIsDetailsModalOpen(true);
  }, []);

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => {
    const standard = createStandardActions<V_system_connections_completeRowSchema>({
      onEdit: openEditModal,
      onDelete: (record) => deleteManager.deleteSingle({ id: record.id!, name: record.service_name || record.connected_system_name || 'Connection' }),
    });
    
    const isProvisioned = (record: V_system_connections_completeRowSchema) => 
      Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0;
    
    return [
      { key: 'view-details', label: 'Full Details', icon: <Monitor className="w-4 h-4" />, onClick: handleViewDetails, variant: 'primary' },
      { key: 'view-path', label: 'View Path', icon: <Eye className="w-4 h-4" />, onClick: handleTracePath, variant: 'secondary', hidden: (record) => !isProvisioned(record) },
      { key: 'deprovision', label: 'Deprovision', icon: <ZapOff className="w-4 h-4" />, onClick: handleDeprovisionClick, variant: 'danger', hidden: (record) => !isProvisioned(record) },
      { key: 'allocate-fiber', label: 'Allocate Fibers', icon: <FiGitBranch className="w-4 h-4" />, onClick: handleOpenAllocationModal, variant: 'primary', hidden: (record) => isProvisioned(record) },
      ...standard,
    ];
  }, [deleteManager, handleTracePath, handleDeprovisionClick, handleOpenAllocationModal, openEditModal, handleViewDetails]);

  const headerActions = useStandardHeaderActions({
    onRefresh: () => { refetch(); toast.success('Connections refreshed!'); },
    onAddNew: openAddModal,
    isLoading: isLoadingConnections,
    exportConfig: { tableName: 'v_system_connections_complete', fileName: `${parentSystem?.node_name+"_"+parentSystem?.system_type_code+"_"+parentSystem?.ip_address?.split("/")[0] || 'system'}_connections`, filters: { system_id: systemId } }
  });

  headerActions.splice(1, 0, {
    label: isUploading ? 'Uploading...' : 'Upload Connections', onClick: handleUploadClick,
    variant: 'outline', leftIcon: <FiUpload />, disabled: isUploading || isLoadingConnections,
  });

  if (isLoadingSystem) return <PageSpinner text="Loading system details..." />;
  if (!parentSystem) return <ErrorDisplay error="System not found." />;
  
  const handleSave = (payload: UpsertConnectionPayload) => {
    upsertMutation.mutate(payload, { 
      onSuccess: () => { 
        refetch(); 
        closeModal();
        queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ports_management_complete', { filters: { system_id: systemId } }] });
      } 
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${parentSystem.system_name} (${parentSystem.ip_address?.split("/")[0]})` || 'System Details'}
        description={`Manage connections for ${parentSystem.system_type_code} at ${parentSystem.node_name}`}
        icon={<FiDatabase />}
        actions={headerActions}
        stats={headerStats}
      />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />

      <DataTable
        tableName="v_system_connections_complete"
        data={connections}
        columns={orderedColumns}
        loading={isLoadingConnections}
        isFetching={isLoadingConnections}
        actions={tableActions}
        pagination={{
          current: currentPage, pageSize: pageLimit, total: totalConnections, showSizeChanger: true,
          onChange: (page, limit) => { setCurrentPage(page); setPageLimit(limit); },
        }}
        searchable
        onSearchChange={setSearchQuery}
      />

      {isEditModalOpen && (
        <SystemConnectionFormModal 
            isOpen={isEditModalOpen} 
            onClose={closeModal} 
            parentSystem={parentSystem} 
            editingConnection={editingRecord} 
            onSubmit={handleSave} 
            isLoading={upsertMutation.isPending} 
        />
      )}
      
      <ConfirmModal isOpen={deleteManager.isConfirmModalOpen} onConfirm={deleteManager.handleConfirm} onCancel={deleteManager.handleCancel} title="Confirm Delete" message={deleteManager.confirmationMessage} loading={deleteManager.isPending} type="danger" />
      
      {isAllocationModalOpen && <FiberAllocationModal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} connection={connectionToAllocate} onSave={handleAllocationSave} parentSystem={parentSystem} />}

      <ConfirmModal
        isOpen={isDeprovisionModalOpen}
        onConfirm={handleConfirmDeprovision}
        onCancel={() => setDeprovisionModalOpen(false)}
        title="Confirm Deprovisioning"
        message={`Are you sure you want to deprovision this connection? This action will remove the logical path and release all associated fibers.`}
        loading={deprovisionMutation.isPending}
        type="danger"
      />

      <SystemFiberTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        traceData={traceModalData}
        isLoading={isTracing}
      />

      <SystemConnectionDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        connectionId={detailsConnectionId}
      />
    </div>
  );
}