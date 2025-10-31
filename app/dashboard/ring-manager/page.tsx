// path: app/dashboard/ring-manager/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaNetworkWired } from 'react-icons/fa';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Button } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { createStandardActions } from '@/components/table/action-helpers';
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
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';
import { buildRpcFilters } from '@/hooks/database/utility-functions';
import { DEFAULTS } from '@/constants/constants';
import { ringConfig, RingEntity } from '@/config/ring-config';
import { useUser } from '@/providers/UserProvider';
import { SystemFormData } from '@/schemas/system-schemas';
import { FiEdit } from 'react-icons/fi';
import { UseQueryResult } from '@tanstack/react-query';
import { EntityConfig } from '@/components/common/entity-management/types';

const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ringsRowSchema> => {
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
  } = useOfflineQuery(
    ['rings-manager-data', searchQuery, filters],
    onlineQueryFn,
    offlineQueryFn,
    { staleTime: DEFAULTS.CACHE_TIME }
  );

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
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            filtered = filtered.filter(item => item[key as keyof V_ringsRowSchema] === filters[key]);
        }
    });

    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

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
  const { isSuperAdmin } = useUser();
  
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [isEditSystemModalOpen, setIsEditSystemModalOpen] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState<V_systems_completeRowSchema | null>(null);
  
  const {
    data: rings,
    totalCount, activeCount, inactiveCount,
    isLoading, isMutating: isCrudMutating, isFetching, error, refetch,
    queryResult, search, filters,
    editModal, deleteModal, viewModal,
    actions: crudActions,
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
  });

  const { mutate: insertRing, isPending: isInserting } = useTableInsert(supabase, 'rings');
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, 'rings');
  const isMutating = isCrudMutating || isInserting || isUpdating;

  const upsertSystemMutation = useRpcMutation(supabase, "upsert_system_with_details", {
    onSuccess: () => {
      void refetch();
      void refetchSystems();
    },
    onError: (err) => toast.error(`Failed to save a system: ${err.message}`),
  });

  // THE FIX: Explicitly set a high limit to ensure all systems are fetched.
  const { data: allSystemsResult, refetch: refetchSystems } = useTableQuery(supabase, 'v_systems_complete', {
    limit: 5000, // Fetch up to 5000 systems to ensure the list is complete
  });

  const allSystems = useMemo(() => allSystemsResult?.data || [], [allSystemsResult]);

  const handleSaveSystems = async (systemsData: (SystemFormData & { id?: string | null })[]) => {
    toast.info(`Saving ${systemsData.length} system associations...`);
    
    const promises = systemsData.map(systemData => {
        const payload: RpcFunctionArgs<"upsert_system_with_details"> = {
            p_id: systemData.id ?? undefined,
            p_system_name: systemData.system_name!,
            p_system_type_id: systemData.system_type_id!,
            p_node_id: systemData.node_id!,
            p_status: systemData.status ?? true,
            p_is_hub: systemData.is_hub ?? false,
            p_ring_id: systemData.ring_id ?? undefined,
            p_order_in_ring: systemData.order_in_ring != null ? Number(systemData.order_in_ring) : undefined,
            p_ip_address: (systemData.ip_address as string) || undefined,
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
        toast.success("All system associations saved successfully!");
        void refetch();
    } catch {
        toast.error("One or more system associations failed to save. Errors are logged in the console.");
    }
  };

  const handleUpdateSystemInRing = (formData: { order_in_ring: number | null; is_hub: boolean | null; }) => {
    if (!systemToEdit) return;

    const payload: RpcFunctionArgs<"upsert_system_with_details"> = {
      p_id: systemToEdit.id!,
      p_system_name: systemToEdit.system_name!,
      p_system_type_id: systemToEdit.system_type_id!,
      p_node_id: systemToEdit.node_id!,
      p_status: systemToEdit.status!,
      p_is_hub: formData.is_hub ?? systemToEdit.is_hub ?? false,
      p_ring_id: systemToEdit.ring_id ?? undefined,
      p_order_in_ring: formData.order_in_ring != null ? Number(formData.order_in_ring) : (systemToEdit.order_in_ring ?? undefined),
      p_ip_address: (systemToEdit.ip_address as string) || undefined,
      p_s_no: systemToEdit.s_no ?? undefined,
      p_make: systemToEdit.make ?? undefined,
      p_maan_node_id: systemToEdit.maan_node_id ?? undefined,
      p_maintenance_terminal_id: systemToEdit.maintenance_terminal_id ?? undefined,
      p_commissioned_on: systemToEdit.commissioned_on ?? undefined,
      p_remark: systemToEdit.remark ?? undefined,
    };
    upsertSystemMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Updated "${systemToEdit.system_name}" in ring.`);
        setIsEditSystemModalOpen(false);
        setSystemToEdit(null);
        void refetchSystems();
      }
    });
  };

  const { data: ringTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ring-types-for-modal'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'RING_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'RING_TYPES' }).toArray()
  );
  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['maintenance-areas-for-modal'],
    async () => (await supabase.from('maintenance_areas').select('*').eq('status', true)).data ?? [],
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

  const handleViewDetails = (record: V_ringsRowSchema) => {
    if (record.id) router.push(`/dashboard/rings/${record.id}`);
  };

  const headerActions = useStandardHeaderActions({
    data: rings, onRefresh: refetch, onAddNew: editModal.openAdd,
    isLoading: isLoading, exportConfig: { tableName: 'v_rings' }
  });
  
  headerActions.push({
    label: 'Add Systems to Ring',
    onClick: () => setIsSystemsModalOpen(true),
    variant: 'primary',
    leftIcon: <FaNetworkWired />,
    disabled: isLoading,
  });

  const headerStats = useMemo(() => [
    { value: totalCount, label: 'Total Rings' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ], [totalCount, activeCount, inactiveCount]);

  const ringEntities: RingEntity[] = useMemo(() =>
    (rings || [])
      .filter((r): r is V_ringsRowSchema & { id: string; name: string } => !!r.id && !!r.name)
      .map(r => ({ ...r, id: r.id, name: r.name })),
  [rings]);
  
  const entityActions = useMemo(() => createStandardActions<V_ringsRowSchema>({
    onEdit: editModal.openEdit,
    onView: handleViewDetails,
    onDelete: crudActions.handleDelete,
    canDelete: () => isSuperAdmin === true,
  }), [editModal.openEdit, handleViewDetails, crudActions.handleDelete, isSuperAdmin]);


  const dynamicFilterConfig: EntityConfig<RingEntity> = {
  ...ringConfig,
  filterOptions: ringConfig.filterOptions.map(opt => {
    if (opt.key === 'ring_type_id') {
      return { ...opt, options: (ringTypesData || []).map(t => ({ value: t.id, label: t.name })) };
    }
    if (opt.key === 'maintenance_terminal_id') {
      return { ...opt, options: (maintenanceAreasData || []).map(m => ({ value: m.id, label: m.name })) };
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
        const associatedSystems = allSystems.filter(s => s.ring_id === entity.id)
          .sort((a,b) => (a.order_in_ring ?? 999) - (b.order_in_ring ?? 999));
        
        if (associatedSystems.length === 0) {
          return <div className="text-sm text-gray-500 italic">No systems associated with this ring.</div>;
        }
        
        return (
          <div className="space-y-2">
            {associatedSystems.map(system => (
              <div key={system.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div>
                  <p className="font-medium text-sm">{system.system_name}</p>
                  <p className="text-xs text-gray-500">Order: {system.order_in_ring ?? 'N/A'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setSystemToEdit(system);
                  setIsEditSystemModalOpen(true);
                }}>
                  <FiEdit className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
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
      out[k] = typeof v === 'object' && 'value' in v ? String((v as { value: unknown }).value) : String(v);
    });
    return out;
  }, [filters.filters]);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;
  
  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
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
          onEdit={(e) => { const orig = rings.find(r => r.id === e.id); if (orig) editModal.openEdit(orig); }}
          onDelete={crudActions.handleDelete}
          onCreateNew={editModal.openAdd}
          selectedEntityId={viewModal.record?.id ?? null}
          onSelect={(id) => {
            if (!id) { viewModal.close(); return; }
            const rec = rings.find(r => r.id === id);
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
    </div>
  );
}