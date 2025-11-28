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
import { ZapOff, Eye, Monitor } from 'lucide-react'; // Added Monitor icon
import { useDeprovisionServicePath } from '@/hooks/database/system-connection-hooks';
import { toPgBoolean, toPgDate } from '@/config/helper-functions';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { FiDatabase, FiGitBranch, FiUpload } from 'react-icons/fi';
import { SystemConnectionFormModal, SystemConnectionFormValues } from '@/components/system-details/SystemConnectionFormModal';
import { FiberAllocationModal } from '@/components/system-details/FiberAllocationModal';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
// NEW IMPORT
import { SystemConnectionDetailsModal } from '@/components/system-details/SystemConnectionDetailsModal'; 
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useQueryClient } from '@tanstack/react-query';

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

  // NEW STATE for the Details Modal
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
  const totalCount = connectionsData?.total_count || 0;

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
        { excelHeader: 'LC ID', dbKey: 'lc_id' },       // ADDED
        { excelHeader: 'Unique ID', dbKey: 'unique_id' }, // ADDED
        { excelHeader: 'Commissioned On', dbKey: 'commissioned_on', transform: toPgDate },
        { excelHeader: 'Remark', dbKey: 'remark' },
        { excelHeader: 'Customer Name', dbKey: 'customer_name' },
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

  // Handler for opening the new details modal
  const handleViewDetails = useCallback((record: V_system_connections_completeRowSchema) => {
      setDetailsConnectionId(record.id);
      setIsDetailsModalOpen(true);
  }, []);

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => {
    const standard = createStandardActions<V_system_connections_completeRowSchema>({
      onEdit: openEditModal,
      onDelete: (record) => deleteManager.deleteSingle({ id: record.id!, name: record.customer_name || record.connected_system_name || 'Connection' }),
    });
    
    const isProvisioned = (record: V_system_connections_completeRowSchema) => 
      Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0;
    
    return [
      // NEW: Full Details View Button
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
  
  const handleSave = (formData: SystemConnectionFormValues) => {
    const payload: RpcFunctionArgs<'upsert_system_connection_with_details'> = {
      p_id: editingRecord?.id ?? undefined,
      p_system_id: parentSystem.id!,
      p_media_type_id: formData.media_type_id!,
      p_status: formData.status ?? true,
      p_sn_id: formData.sn_id || undefined,
      p_en_id: formData.en_id || undefined,
      p_sn_ip: formData.sn_ip || undefined,
      p_sn_interface: formData.sn_interface || undefined,
      p_en_ip: formData.en_ip || undefined,
      p_en_interface: formData.en_interface || undefined,
      p_bandwidth: formData.bandwidth || undefined,
      p_vlan: formData.vlan || undefined,
      p_lc_id: formData.lc_id || undefined, // Added
      p_unique_id: formData.unique_id || undefined, // Added
      p_commissioned_on: formData.commissioned_on || undefined,
      p_remark: formData.remark || undefined,
      p_customer_name: formData.customer_name || undefined,
      p_bandwidth_allocated: formData.bandwidth_allocated || undefined,
      p_system_working_interface: formData.system_working_interface || undefined,
      p_system_protection_interface: formData.system_protection_interface || undefined,
      p_connected_link_type_id: formData.connected_link_type_id || undefined,
      p_stm_no: formData.stm_no || undefined,
      p_carrier: formData.carrier || undefined,
      p_a_slot: formData.a_slot || undefined,
      p_a_customer: formData.a_customer || undefined,
      p_b_slot: formData.b_slot || undefined,
      p_b_customer: formData.b_customer || undefined,
    };
    
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
        stats={[{ label: 'Total Connections', value: totalCount }]}
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
          current: currentPage, pageSize: pageLimit, total: totalCount, showSizeChanger: true,
          onChange: (page, limit) => { setCurrentPage(page); setPageLimit(limit); },
        }}
        searchable
        onSearchChange={setSearchQuery}
      />

      {isEditModalOpen && <SystemConnectionFormModal isOpen={isEditModalOpen} onClose={closeModal} parentSystem={parentSystem} editingConnection={editingRecord} onSubmit={handleSave} isLoading={upsertMutation.isPending} />}
      
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

      {/* The New Modal */}
      <SystemConnectionDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        connectionId={detailsConnectionId}
      />
    </div>
  );
}