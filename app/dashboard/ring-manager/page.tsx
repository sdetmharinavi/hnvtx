// path: app/dashboard/ring-manager/page.tsx
'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaNetworkWired } from 'react-icons/fa';
import { FiUpload, FiEdit, FiDownload, FiRefreshCw, FiTrash2, FiArrowRightCircle, FiGitMerge } from 'react-icons/fi';

import { PageHeader, ActionButton } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Button } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { SystemRingModal } from '@/components/ring-manager/SystemRingModal';
import { EditSystemInRingModal } from '@/components/ring-manager/EditSystemInRingModal';

import {
  Filters,
  PagedQueryResult,
  useTableInsert,
  useTableUpdate,
  RpcFunctionArgs,
  useRpcMutation,
  useTableQuery,
} from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import {
  RingsInsertSchema,
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
  V_ringsRowSchema,
  V_systems_completeRowSchema,
  RingsRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database/utility-functions';
import { DEFAULTS } from '@/constants/constants';
import { ringConfig, RingEntity } from '@/config/ring-config';
import { useUser } from '@/providers/UserProvider';
import { SystemFormData } from '@/schemas/system-schemas';
import { UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { EntityConfig } from '@/components/common/entity-management/types';
import { useRingExcelUpload } from '@/hooks/database/excel-queries/useRingExcelUpload';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';

// --- Types ---
interface SystemToDisassociate {
  ringId: string;
  systemId: string;
  systemName: string;
  ringName: string;
}

// --- Helper Hooks ---

// Hook to fetch systems specifically for a ring
const useRingSystems = (ringId: string | null) => {
  const supabase = createClient();
  return useTableQuery(supabase, 'ring_based_systems', {
    // THE FIX: Explicitly include 'ring_id' in the columns list
    columns: 'order_in_ring, ring_id, systems(id, system_name, is_hub, status, system_type_id, node_id, ip_address, s_no, make, remark, commissioned_on, maintenance_terminal_id, maan_node_id, system_capacity_id)',
    filters: { ring_id: ringId || '' },
    enabled: !!ringId,
    orderBy: [{ column: 'order_in_ring', ascending: true }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (result: PagedQueryResult<any>) => {
        const flattened = result.data.map((item) => ({
            id: item.systems?.id,
            system_name: item.systems?.system_name,
            is_hub: item.systems?.is_hub,
            order_in_ring: item.order_in_ring,
            // THE FIX: Map the ring_id from the junction table to the flat object
            ring_id: item.ring_id, 
            status: item.systems?.status,
            
            // Essential fields for Update/Upsert
            system_type_id: item.systems?.system_type_id,
            node_id: item.systems?.node_id,
            
            // Optional fields to preserve data integrity
            ip_address: item.systems?.ip_address.split('/')[0],
            s_no: item.systems?.s_no,
            make: item.systems?.make,
            remark: item.systems?.remark,
            commissioned_on: item.systems?.commissioned_on,
            maintenance_terminal_id: item.systems?.maintenance_terminal_id,
            maan_node_id: item.systems?.maan_node_id,
            system_capacity_id: item.systems?.system_capacity_id,
        })) as unknown as V_systems_completeRowSchema[];
        
        return {
            data: flattened,
            count: result.count
        };
    }
  });
};

// --- Components ---

const RingAssociatedSystemsView = ({ 
  ringId, 
  onEdit, 
  onDelete 
}: { 
  ringId: string; 
  onEdit: (sys: V_systems_completeRowSchema) => void; 
  onDelete: (sys: V_systems_completeRowSchema) => void; 
}) => {
  const { data: systemsData, isLoading } = useRingSystems(ringId);
  const systems = systemsData?.data || [];

  if (isLoading) return <div className="py-4 text-center text-sm text-gray-500">Loading associated systems...</div>;
  
  if (systems.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic py-2">
        No systems associated with this ring.
      </div>
    );
  }

  const hubMap = new Map<number, string>();
  systems.forEach(s => {
      if (s.is_hub && s.order_in_ring !== null) {
          hubMap.set(Math.floor(s.order_in_ring), s.system_name || 'Unknown Hub');
      }
  });

  return (
    <div className="space-y-2">
      {systems.map((system) => {
         const isSpur = !system.is_hub && system.order_in_ring !== null;
         const parentOrder = isSpur ? Math.floor(system.order_in_ring!) : null;
         const parentName = parentOrder !== null ? hubMap.get(parentOrder) : null;

         return (
            <div
              key={system.id}
              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600"
            >
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{system.system_name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Order: {system.order_in_ring ?? 'N/A'}</span>
                    {system.is_hub ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"><FiArrowRightCircle className="w-3 h-3"/> Hub</span>
                    ) : (
                        <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                            <FiGitMerge className="w-3 h-3"/> Spur 
                            {parentName && <span className="text-gray-400 dark:text-gray-500 ml-1">→ {parentName}</span>}
                        </span>
                    )}
                </div>
              </div>
              <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(system)}
                title="Edit System Order/Hub Status"
              >
                <FiEdit className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(system)}
                title="Remove from Ring"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
              </div>
            </div>
         );
      })}
    </div>
  );
};

const useRingsData = (params: DataQueryHookParams): DataQueryHookReturn<V_ringsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = async (): Promise<V_ringsRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,ring_type_name.ilike.%${searchQuery}%,maintenance_area_name.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_rings',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });
    if (error) throw error;
    return (data as { data: V_ringsRowSchema[] })?.data || [];
  };

  const offlineQueryFn = async (): Promise<V_ringsRowSchema[]> => {
    return await localDb.v_rings.toArray();
  };

  const {
    data: allRings = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOfflineQuery(['rings-manager-data', searchQuery, filters], onlineQueryFn, offlineQueryFn, {
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    let filtered = allRings;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ring) =>
          ring.name?.toLowerCase().includes(lowerQuery) ||
          ring.description?.toLowerCase().includes(lowerQuery) ||
          ring.ring_type_name?.toLowerCase().includes(lowerQuery) ||
          ring.maintenance_area_name?.toLowerCase().includes(lowerQuery)
      );
    }
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        filtered = filtered.filter((item) => item[key as keyof V_ringsRowSchema] === filters[key]);
      }
    });

    filtered.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    );

    const totalCount = filtered.length;
    const activeCount = filtered.filter((r) => r.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;

    return {
      data: filtered.slice(start, end),
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allRings, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch: refetch as () => void };
};

export default function RingManagerPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient(); // THE FIX: Added queryClient
  const { isSuperAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [isEditSystemModalOpen, setIsEditSystemModalOpen] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState<V_systems_completeRowSchema | null>(null);
  const [systemToDisassociate, setSystemToDisassociate] = useState<SystemToDisassociate | null>(null);

  const {
    data: rings,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating: isCrudMutating,
    isFetching,
    error,
    refetch,
    queryResult,
    search,
    filters,
    editModal,
    deleteModal,
    viewModal,
    actions: crudActions,
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
  });

  const { mutate: insertRing, isPending: isInserting } = useTableInsert(supabase, 'rings');
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, 'rings');
  const { mutate: uploadRings, isPending: isUploading } = useRingExcelUpload(supabase);
  const { mutate: exportRings, isPending: isExporting } = useRPCExcelDownload(supabase);
  const isMutating = isCrudMutating || isInserting || isUpdating;

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      void refetch();
      // THE FIX: Explicitly invalidate the ring systems query to force the sub-component to re-render
      queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
    },
    onError: (err) => toast.error(`Failed to save a system: ${err.message}`),
  });

  const disassociateSystemMutation = useRpcMutation(supabase, 'disassociate_system_from_ring', {
    onSuccess: () => {
      toast.success('System disassociated from ring.');
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
      setSystemToDisassociate(null);
    },
    onError: (err) => toast.error(`Failed to disassociate system: ${err.message}`),
  });

  const handleSaveSystems = async (systemsData: (SystemFormData & { id?: string | null })[]) => {
    toast.info(`Saving ${systemsData.length} system associations...`);
    const promises = systemsData.map((systemData) => {
      const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
        p_id: systemData.id ?? undefined,
        p_system_name: systemData.system_name!,
        p_system_type_id: systemData.system_type_id!,
        p_node_id: systemData.node_id!,
        p_status: systemData.status ?? true,
        p_is_hub: systemData.is_hub ?? false,
        p_ring_associations:
          systemData.ring_id
            ? [
                {
                  ring_id: systemData.ring_id,
                  order_in_ring:
                    systemData.order_in_ring != null
                      ? Number(systemData.order_in_ring)
                      : null,
                },
              ]
            : null,
        p_ip_address: systemData.ip_address ? systemData.ip_address.split('/')[0] : undefined,
        p_s_no: systemData.s_no ?? undefined,
        p_make: systemData.make ?? undefined,
        p_maan_node_id: systemData.maan_node_id ?? undefined,
        p_maintenance_terminal_id: systemData.maintenance_terminal_id ?? undefined,
        p_commissioned_on: systemData.commissioned_on ?? undefined,
        p_remark: systemData.remark ?? undefined,
      };
      return upsertSystemMutation.mutateAsync(payload);
    });
    try {
      await Promise.all(promises);
      toast.success('All system associations saved successfully!');
      void refetch();
    } catch {
      toast.error('One or more system associations failed to save.');
    }
  };

  const handleUpdateSystemInRing = (formData: {
    order_in_ring: number | null;
    is_hub: boolean | null;
  }) => {
    if (!systemToEdit) return;

    // THE FIX: Validate that ring_id is present before attempting update
    if (!systemToEdit.ring_id) {
        toast.error("Cannot update: System is not correctly associated with a ring context.");
        return;
    }

    const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
      p_id: systemToEdit.id!,
      p_system_name: systemToEdit.system_name!,
      p_system_type_id: systemToEdit.system_type_id!,
      p_node_id: systemToEdit.node_id!,
      p_status: systemToEdit.status!,
      p_is_hub: formData.is_hub ?? systemToEdit.is_hub ?? false,
      p_ring_associations: [
          {
            ring_id: systemToEdit.ring_id,
            order_in_ring:
              formData.order_in_ring != null
                ? Number(formData.order_in_ring)
                : systemToEdit.order_in_ring ?? null,
          },
        ],
      p_ip_address: systemToEdit.ip_address ? systemToEdit.ip_address.split('/')[0] : undefined,
      p_s_no: systemToEdit.s_no ?? undefined,
      p_make: systemToEdit.make ?? undefined,
      p_maan_node_id: systemToEdit.maan_node_id ?? undefined,
      p_maintenance_terminal_id: systemToEdit.maintenance_terminal_id ?? undefined,
      p_commissioned_on: systemToEdit.commissioned_on ?? undefined,
      p_remark: systemToEdit.remark ?? undefined,
      p_system_capacity_id: systemToEdit.system_capacity_id ?? undefined
    };
    
    upsertSystemMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Updated "${systemToEdit.system_name}" in ring.`);
        setIsEditSystemModalOpen(false);
        setSystemToEdit(null);
        void refetch();
      },
    });
  };

  const { data: ringTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ring-types-for-modal'],
    async () =>
      (await supabase.from('lookup_types').select('*').eq('category', 'RING_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'RING_TYPES' }).toArray()
  );
  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['maintenance-areas-for-modal'],
    async () =>
      (await supabase.from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );

  const handleMutationSuccess = () => {
    toast.success(`Ring ${editModal.record ? 'updated' : 'created'} successfully.`);
    editModal.close();
    refetch();
  };

  const handleSave = (data: RingsInsertSchema) => {
    if (editModal.record?.id) {
      updateRing({ id: editModal.record.id, data }, { onSuccess: handleMutationSuccess });
    } else {
      insertRing(data, { onSuccess: handleMutationSuccess });
    }
  };

  const handleViewDetails = useCallback(
    (record: V_ringsRowSchema) => {
      if (record.id) router.push(`/dashboard/rings/${record.id}`);
    },
    [router]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadRings({ file });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportClick = useCallback(() => {
    exportRings({
      fileName: `${formatDate(new Date(), {
                format: 'dd-mm-yyyy',
              })}-rings-export.xlsx`,
      sheetName: 'Rings',
      rpcConfig: {
        functionName: 'get_rings_for_export',
      },
      columns: [
        { key: 'id', title: 'id', dataIndex: 'id' },
        { key: 'name', title: 'name', dataIndex: 'name' },
        { key: 'description', title: 'description', dataIndex: 'description' },
        { key: 'ring_type_name', title: 'ring_type_name', dataIndex: 'ring_type_name' },
        {
          key: 'maintenance_area_name',
          title: 'maintenance_area_name',
          dataIndex: 'maintenance_area_name',
        },
        { key: 'status', title: 'status', dataIndex: 'status' },
        { key: 'total_nodes', title: 'total_nodes', dataIndex: 'total_nodes' },
        {
          key: 'associated_systems',
          title: 'associated_systems',
          dataIndex: 'associated_systems',
          excelFormat: 'json',
        },
      ],
    });
  }, [exportRings]);

  const headerActions = useMemo(() => {
    const actions: ActionButton[] = [];

    actions.push({
      label: 'Refresh',
      onClick: () => refetch(),
      variant: 'outline',
      leftIcon: <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />,
      disabled: isLoading,
    });

    actions.push({
      label: isUploading ? 'Uploading...' : 'Upload Rings',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
    });

    actions.push({
      label: isExporting ? 'Exporting...' : 'Export Rings',
      onClick: handleExportClick,
      variant: 'outline',
      leftIcon: <FiDownload />,
      disabled: isExporting || isLoading,
    });

    actions.push({
      label: 'Add New Ring',
      onClick: editModal.openAdd,
      variant: 'primary',
      leftIcon: <GiLinkedRings />,
      disabled: isLoading,
    });

    actions.push({
      label: 'Add Systems to Ring',
      onClick: () => setIsSystemsModalOpen(true),
      variant: 'primary',
      leftIcon: <FaNetworkWired />,
      disabled: isLoading,
    });

    return actions;
  }, [
    isLoading,
    isUploading,
    isExporting,
    refetch,
    handleUploadClick,
    handleExportClick,
    editModal.openAdd,
  ]);

  const headerStats = useMemo(
    () => [
      { value: totalCount, label: 'Total Rings' },
      { value: activeCount, label: 'Active', color: 'success' as const },
      { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
    ],
    [totalCount, activeCount, inactiveCount]
  );

  // Dynamic Config with the new Component
  const dynamicFilterConfig: EntityConfig<RingEntity> = {
    ...ringConfig,
    filterOptions: ringConfig.filterOptions.map((opt) => {
      if (opt.key === 'ring_type_id') {
        return {
          ...opt,
          options: (ringTypesData || []).map((t) => ({ value: t.id, label: t.name })),
        };
      }
      if (opt.key === 'maintenance_terminal_id') {
        return {
          ...opt,
          options: (maintenanceAreasData || []).map((m) => ({ value: m.id, label: m.name })),
        };
      }
      return opt;
    }),
    detailFields: [
      ...ringConfig.detailFields,
      {
        key: 'id',
        label: 'Associated Systems',
        type: 'custom' as const,
        render: (_value: unknown, entity: RingEntity) => {
          return (
            <RingAssociatedSystemsView 
              ringId={entity.id}
              onEdit={(system) => {
                setSystemToEdit(system);
                setIsEditSystemModalOpen(true);
              }}
              onDelete={(system) => 
                 setSystemToDisassociate({
                    ringId: entity.id,
                    systemId: system.id!,
                    ringName: entity.name,
                    systemName: system.system_name || 'this system',
                  })
              }
            />
          );
        },
      },
    ],
  };

  const uiFilters = useMemo<Record<string, string>>(() => {
    const src = (filters.filters || {}) as Record<string, unknown>;
    const out: Record<string, string> = {};
    Object.keys(src).forEach((k) => {
      const v: unknown = src[k as keyof typeof src];
      if (v === undefined || v === null) return;
      out[k] =
        typeof v === 'object' && 'value' in v ? String((v as { value: unknown }).value) : String(v);
    });
    return out;
  }, [filters.filters]);

  const handleConfirmDisassociation = useCallback(() => {
    if (!systemToDisassociate) return;
    disassociateSystemMutation.mutate({
      p_ring_id: systemToDisassociate.ringId,
      p_system_id: systemToDisassociate.systemId,
    });
  }, [systemToDisassociate, disassociateSystemMutation]);

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <PageHeader
        title="Ring Manager"
        description="A modern interface to create, manage, and visualize network rings and their associated systems."
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />
      <div className="flex-grow mt-6">
        <EntityManagementComponent
          config={dynamicFilterConfig}
          entitiesQuery={queryResult as UseQueryResult<PagedQueryResult<RingEntity>, Error>}
          toggleStatusMutation={{ mutate: crudActions.handleToggleStatus, isPending: isMutating }}
          onEdit={(e) => {
            const orig = rings.find((r) => r.id === e.id);
            if (orig) editModal.openEdit(orig);
          }}
          onDelete={
            isSuperAdmin
              ? crudActions.handleDelete
              : () => {
                  console.log('Not allowed to delete');
                }
          }
          onCreateNew={editModal.openAdd}
          selectedEntityId={viewModal.record?.id ?? null}
          onSelect={(id) => {
            if (!id) {
              viewModal.close();
              return;
            }
            const rec = rings.find((r) => r.id === id);
            if (rec) viewModal.open(rec);
          }}
          onViewDetails={() => handleViewDetails(viewModal.record!)}
          searchTerm={search.searchQuery}
          onSearchChange={search.setSearchQuery}
          filters={uiFilters}
          onFilterChange={(f) => filters.setFilters(f as Filters)}
          onClearFilters={() => filters.setFilters({})}
          isFetching={isFetching}
        />
      </div>

      <RingModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onSubmit={handleSave}
        editingRing={editModal.record as RingsRowSchema | null}
        ringTypes={ringTypesData || []}
        maintenanceAreas={maintenanceAreasData || []}
        isLoading={isMutating}
      />

      <SystemRingModal
        isOpen={isSystemsModalOpen}
        onClose={() => setIsSystemsModalOpen(false)}
        onSubmit={handleSaveSystems}
        isLoading={isMutating || upsertSystemMutation.isPending}
      />

      <EditSystemInRingModal
        isOpen={isEditSystemModalOpen}
        onClose={() => setIsEditSystemModalOpen(false)}
        system={systemToEdit}
        onSubmit={handleUpdateSystemInRing}
        isLoading={upsertSystemMutation.isPending}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />

       <ConfirmModal
        isOpen={!!systemToDisassociate}
        onConfirm={handleConfirmDisassociation}
        onCancel={() => setSystemToDisassociate(null)}
        title="Confirm Disassociation"
        message={`Are you sure you want to remove the system "${systemToDisassociate?.systemName}" from the ring "${systemToDisassociate?.ringName}"?`}
        loading={disassociateSystemMutation.isPending}
        type="danger"
      />
    </div>
  );
}