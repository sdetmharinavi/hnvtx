// app/dashboard/systems/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { FiDatabase } from "react-icons/fi";
import { toast } from "sonner";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { ErrorDisplay } from "@/components/common/ui";
import { ConfirmModal } from "@/components/common/ui/Modal/confirmModal";
import { createStandardActions } from "@/components/table/action-helpers";
import { DataTable } from "@/components/table/DataTable";
import type { TableAction } from "@/components/table/datatable-types";
import { SystemsTableColumns } from "@/config/table-columns/SystemsTableColumns";
import { useRpcMutation, RpcFunctionArgs, buildRpcFilters } from "@/hooks/database";
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from "@/hooks/useCrudManager";
import { Lookup_typesRowSchema, V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { createClient } from "@/utils/supabase/client";
import { SystemModal } from "@/components/systems/SystemModal";
import { SelectFilter } from "@/components/common/filters/FilterInputs";
import { SearchAndFilters } from "@/components/common/filters/SearchAndFilters";
import { SystemFormData } from "@/schemas/system-schemas";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { localDb } from "@/data/localDb";
import { DEFAULTS } from "@/constants/constants";
import useOrderedColumns from "@/hooks/useOrderedColumns";
import { TABLE_COLUMN_KEYS } from "@/constants/table-column-keys";

const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = async (): Promise<V_systems_completeRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(system_name.ilike.%${searchQuery}%,system_type_name.ilike.%${searchQuery}%,node_name.ilike.%${searchQuery}%,ip_address.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc("get_paged_data", {
      p_view_name: "v_systems_complete",
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
    });
    if (error) throw error;
    return (data as { data: V_systems_completeRowSchema[] })?.data || [];
  };

  const offlineQueryFn = async (): Promise<V_systems_completeRowSchema[]> => {
    return await localDb.v_systems_complete.toArray();
  };

  const {
    data: allSystems = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOfflineQuery(["systems-data", searchQuery, filters], onlineQueryFn, offlineQueryFn, {
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    let filtered = allSystems;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (system: V_systems_completeRowSchema) =>
          system.system_name?.toLowerCase().includes(lowerQuery) ||
          system.system_type_name?.toLowerCase().includes(lowerQuery) ||
          system.node_name?.toLowerCase().includes(lowerQuery) ||
          String(system.ip_address)?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.system_type_name) {
      filtered = filtered.filter(
        (system: V_systems_completeRowSchema) =>
          system.system_type_name === filters.system_type_name
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (system: V_systems_completeRowSchema) => system.status === (filters.status === "true")
      );
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter(
      (s: V_systems_completeRowSchema) => s.status === true
    ).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allSystems, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};

export default function SystemsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: systems,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<"systems", V_systems_completeRowSchema>({
    tableName: "systems",
    dataQueryHook: useSystemsData,
    searchColumn: "system_name",
    displayNameField: "system_name",
  });

  const orderedSystems = useOrderedColumns(SystemsTableColumns(systems), [
    ...TABLE_COLUMN_KEYS.v_systems_complete,
  ]); // order will be as per TABLE_COLUMN_KEYS.v_systems_complete

  const isInitialLoad = isLoading && systems.length === 0;

  const upsertSystemMutation = useRpcMutation(supabase, "upsert_system_with_details", {
    onSuccess: () => {
      toast.success(`System ${editModal.record ? "updated" : "created"} successfully.`);
      refetch();
      editModal.close();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const { data: systemTypesResult } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ["system-types-for-filter"],
    async () =>
      (await createClient().from("lookup_types").select("*").eq("category", "SYSTEM_TYPES")).data ??
      [],
    async () => await localDb.lookup_types.where({ category: "SYSTEM_TYPES" }).toArray()
  );
  const systemTypes = useMemo(() => systemTypesResult || [], [systemTypesResult]);

  const handleView = useCallback(
    (system: V_systems_completeRowSchema) => {
      if (system.id) {
        router.push(`/dashboard/systems/${system.id}`);
      } else {
        toast.info("System needs to be created before managing connections.");
      }
    },
    [router]
  );

  const tableActions = useMemo(
    () =>
      createStandardActions<V_systems_completeRowSchema>({
        onEdit: editModal.openEdit,
        onView: handleView,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
      }),
    [editModal.openEdit, handleView, crudActions]
  );
  const headerActions = useStandardHeaderActions({
    data: systems,
    onRefresh: () => {
      refetch();
      toast.success("Systems refreshed.");
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: "v_systems_complete", fileName: "systems" },
  });
  const headerStats = [
    { value: totalCount, label: "Total Systems" },
    { value: activeCount, label: "Active", color: "success" as const },
    { value: inactiveCount, label: "Inactive", color: "danger" as const },
  ];

  const handleSave = useCallback(
    (formData: SystemFormData) => {
      const selectedSystemType = systemTypes.find((st) => st.id === formData.system_type_id);
      const isRingBased = selectedSystemType?.is_ring_based;

      // THE FIX: The payload now correctly includes p_order_in_ring and matches the RPC function signature.
      // The previous type error `Property 'order_in_ring' does not exist on type...` is now resolved.
      const payload: RpcFunctionArgs<"upsert_system_with_details"> = {
        p_id: editModal.record?.id ?? undefined,
        p_system_name: formData.system_name!,
        p_system_type_id: formData.system_type_id!,
        p_maan_node_id: formData.maan_node_id || undefined,
        p_node_id: formData.node_id!,
        p_status: formData.status ?? true,
        p_ip_address: formData.ip_address || undefined,
        p_maintenance_terminal_id: formData.maintenance_terminal_id || undefined,
        p_commissioned_on: formData.commissioned_on || undefined,
        p_s_no: formData.s_no || undefined,
        p_remark: formData.remark || undefined,
        p_make: formData.make || undefined,
        p_ring_id: isRingBased && formData.ring_id ? formData.ring_id : undefined,
        p_order_in_ring:
          isRingBased && formData.order_in_ring != null
            ? Number(formData.order_in_ring)
            : undefined,
      };
      upsertSystemMutation.mutate(payload);
    },
    [editModal.record, upsertSystemMutation, systemTypes]
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: refetch, variant: "primary" }]}
      />
    );

  return (
    <div className='p-6 space-y-6'>
      <PageHeader
        title='System Management'
        description='Manage all network systems, including CPAN, MAAN, SDH, DWDM etc.'
        icon={<FiDatabase />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <DataTable
        tableName='v_systems_complete'
        data={systems}
        columns={orderedSystems}
        loading={isLoading}
        actions={tableActions as TableAction<"v_systems_complete">[]}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(limit);
          },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={() => {
              search.setSearchQuery("");
              filters.setFilters({});
            }}
            hasActiveFilters={Object.values(filters.filters).some(Boolean) || !!search.searchQuery}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
            searchPlaceholder='Search by system name or type...'>
            <SelectFilter
              label='System Type'
              filterKey='system_type_name'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={(systemTypes || []).map((t) => ({ value: t.name, label: t.name }))}
            />
            <SelectFilter
              label='Status'
              filterKey='status'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </SearchAndFilters>
        }
      />
      <SystemModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        rowData={editModal.record}
        onSubmit={handleSave}
        isLoading={upsertSystemMutation.isPending}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title='Confirm Deletion'
        message={deleteModal.message}
        loading={deleteModal.loading}
        type='danger'
      />
    </div>
  );
}
