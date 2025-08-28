'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  usePagedOfcCablesComplete,
  Filters,
  convertRichFiltersToSimpleJson,
} from '@/hooks/database';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import { useRouter } from 'next/navigation';

import { DataTable } from '@/components/table/DataTable';
import { Row } from '@/hooks/database';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { BulkActions } from '@/components/common/BulkActions';
import { OfcFilters } from '@/components/ofc/OfcFilters';
import OfcForm from '@/components/ofc/OfcForm/OfcForm';
import { Json, TablesInsert, TablesUpdate } from '@/types/supabase-types';
import {
  OfcCablesFilters,
  OfcCablesWithRelations,
} from '@/components/ofc/ofc-types';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { toast } from 'sonner';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/PageHeader';
import { AiFillMerge } from 'react-icons/ai';
import { createStandardActions } from '@/components/table/action-helpers';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { OfcCableRowsWithCount } from '@/types/view-row-types';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';


// 1. ADAPTER HOOK: Makes `useOfcData` compatible with `useCrudManager`
const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<OfcCableRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  // Build the server filters object that the RPC function expects.
  const serverFilters = useMemo(() => {
    const richFilters: Filters = { ...filters };
    if (searchQuery) {
      richFilters.or = `(route_name ILIKE '%${searchQuery}%' OR asset_no ILIKE '%${searchQuery}%')`;
    }
    return convertRichFiltersToSimpleJson(richFilters);
  }, [filters, searchQuery]);


  // const { data, isLoading, error, refetch } = usePagedOfcCablesComplete(
  //   supabase,
  //   {
  //     filters: {
  //       ...filters,
  //       ...(searchQuery ? { route_name: searchQuery } : {}),
  //     },
  //     limit: pageLimit,
  //     offset: (currentPage - 1) * pageLimit,
  //   }
  // );
  const { data, isLoading, error, refetch } = usePagedOfcCablesComplete(
    supabase,
    {
      filters: serverFilters as Json,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  };
};

const OfcPage = () => {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: ofcData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    error,
    refetch,
    pagination,
    search,
    filters: crudFilters,
    editModal,
    // viewModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_cables', OfcCableRowsWithCount>({
    tableName: 'ofc_cables',
    dataQueryHook: useOfcData,
    searchColumn: "route_name", // This can be considered the "primary" search field for display purposes
  });

  // 3. Extract ring types from the rings data
  const ofcTypes = useMemo(() => {
    const uniqueOfcTypes = new Map();
    console.log('ofcData', ofcData);
    ofcData.forEach((ofc) => {
      if (ofc.ofc_type_code) {
        uniqueOfcTypes.set(ofc.ofc_type_id, {
          id: ofc.ofc_type_id,
          name: ofc.ofc_type_code,
        });
      }
    });
    return Array.from(uniqueOfcTypes.values());
  }, [ofcData]);

  const maintenanceAreas = useMemo(() => {
    const uniqueMaintenanceAreas = new Map();
    console.log('ofcData', ofcData);
    ofcData.forEach((ofc) => {
      if (ofc.maintenance_area_code) {
        uniqueMaintenanceAreas.set(ofc.maintenance_terminal_id, {
          id: ofc.maintenance_terminal_id,
          name: ofc.maintenance_area_code,
        });
      }
    });
    return Array.from(uniqueMaintenanceAreas.values());
  }, [ofcData]);

  const supabase = createClient();
  const router = useRouter();

  // --- STATE MANAGEMENT (Mimicking useCrudPage) ---
  // const [filters, setFilters] = useState<OfcCablesFilters>({
  //   search: "",
  //   ofc_type_id: "",
  //   status: "",
  //   maintenance_terminal_id: "",
  // });
  // const [editingRecord, setEditingRecord] =
  //   useState<OfcCablesWithRelations | null>(null);
  // const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(crudFilters.filters).filter(
    Boolean
  ).length;
  const hasActiveFilters = activeFilterCount > 0 || !!search.searchQuery;

  const handleClearFilters = () => {
    crudFilters.setFilters({});
    search.setSearchQuery('');
  };
  // const [debouncedSearch] = useDebounce("", DEFAULTS.DEBOUNCE_DELAY);

  // --- FILTERS ---
  // const serverFilters = useMemo(() => {
  //   const combinedFilters: Record<string, Json | string | boolean> = {};
  //   if (debouncedSearch) combinedFilters.search = debouncedSearch; // RPC handles 'search' as a special ILIKE term
  //   if (filters.ofc_type_id) combinedFilters.ofc_type_id = filters.ofc_type_id;
  //   if (filters.status) combinedFilters.status = filters.status === "true";
  //   if (filters.maintenance_terminal_id)
  //     combinedFilters.maintenance_terminal_id = filters.maintenance_terminal_id;
  //   return combinedFilters;
  // }, [filters, debouncedSearch]);

  // --- DATA FETCHING (Specialized Hooks) ---
  // const {
  //   data: pagedOfcData,
  //   isLoading,
  //   error,
  //   refetch,
  // } = usePagedOfcCablesComplete(supabase, {
  //   limit: pageLimit,
  //   offset: (currentPage - 1) * pageLimit,
  //   filters: serverFilters,
  // });

  // const ofcData = useMemo(() => pagedOfcData || [], [pagedOfcData]);
  // const totalCount = ofcData[0]?.total_count ?? 0;
  // const activeCount =
  //   ofcData[0]?.active_count ?? ofcData.filter((c) => c.status).length;
  // const inactiveCount =
  //   ofcData[0]?.inactive_count ?? ofcData.filter((c) => !c.status).length;

  // const { data: ofcTypes = [] } = useTableQuery(supabase, "lookup_types", {
  //   filters: { category: { operator: "eq", value: "OFC_TYPES" } },
  // });
  // const { data: maintenanceAreas = [] } = useTableQuery(
  //   supabase,
  //   "maintenance_areas"
  // );
  const { data: isSuperAdmin } = useIsSuperAdmin();

  // --- MUTATIONS ---
  const { mutate: insertOfcCable, isPending: isInserting } = useTableInsert(
    supabase,
    'ofc_cables',
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success('OFC Cable created.');
      },
    }
  );
  const { mutate: updateOfcCable, isPending: isUpdating } = useTableUpdate(
    supabase,
    'ofc_cables',
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success('OFC Cable updated.');
      },
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, 'ofc_cables', {
    onSuccess: () => {
      refetch();
      toast.success('OFC Cable status toggled.');
    },
  });
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(
    supabase,
    'ofc_cables'
  );

  // --- HANDLERS ---
  const closeModal = useCallback(() => {
    editModal.close();
  }, []);
  const handleSave = (data: TablesInsert<'ofc_cables'>) => {
    if (editModal.record) {
      updateOfcCable({ id: editModal.record.id!, data });
    } else {
      insertOfcCable(data);
    }
  };

  // const handleBulkDelete = useCallback(() => {
  //   if (!window.confirm(`Delete ${selectedIds.length} selected cable(s)?`))
  //     return;
  //   if (isSuperAdmin) {
  //     bulkDelete.mutate(
  //       { ids: selectedIds },
  //       {
  //         onSuccess: () => {
  //           setSelectedIds([]);
  //           refetch();
  //         toast.success(`${selectedIds.length} cables deleted.`);
  //       },
  //       onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
  //     }
  //   );
  // } else {
  //   toast.error("You do not have permission to delete cables.");
  // }
  // }, [selectedIds, isSuperAdmin, bulkDelete, refetch]);

  // const handleBulkUpdateStatus = useCallback(
  //   (status: "active" | "inactive") => {
  //     const updates = selectedIds.map((id) => ({
  //       id,
  //       data: { status: status === "active" } as TablesUpdate<"ofc_cables">,
  //     }));
  //     bulkUpdate.mutate(
  //       { updates },
  //       {
  //         onSuccess: () => {
  //           setSelectedIds([]);
  //           refetch();
  //           toast.success(`${selectedIds.length} cables updated.`);
  //         },
  //         onError: (err) =>
  //           toast.error(`Bulk status update failed: ${err.message}`),
  //       }
  //     );
  //   },
  //   [selectedIds, bulkUpdate, refetch]
  // );

  // --- MEMOIZED VALUES ---
  const columns = useDynamicColumnConfig('v_ofc_cables_complete', {
    /* ... your overrides ... */
    data: ofcData,
  });

  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: editModal.openEdit,
        onView: (record) => router.push(`/dashboard/ofc/${record.id}`),
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    [crudActions, editModal.openEdit, router, isSuperAdmin]
  );

  const headerStats = [
    { value: totalCount, label: 'Total OFC Cables' },
    {
      value: activeCount,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: inactiveCount,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'ofc_cables' },
  });

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetch,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="OFC Cable Management"
        description="Manage OFC cables and their related information."
        icon={<AiFillMerge />}
        stats={headerStats}
        actions={headerActions} // <-- Pass the generated actions
        isLoading={isLoading}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={() => bulkActions.handleBulkDelete()}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="ofc cable"
        showStatusUpdate={true}
        canDelete={() => isSuperAdmin === true}
      />

      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows: OfcCableRowsWithCount[]): void => {
          // Update selection with new row IDs
          bulkActions.handleRowSelect(selectedRows as never);
        }}
        searchable={false}
        filterable={false}
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
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            searchPlaceholder="Search by Asset No or Route Name..."
          >
            {/* THIS IS THE CLEANER, TYPE-SAFE WAY */}
            <SelectFilter
              label="OFC Type"
              filterKey="ofc_type_id"
              filters={crudFilters.filters}
              setFilters={crudFilters.setFilters}
              options={ofcTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SelectFilter
              label="Status"
              filterKey="status"
              filters={crudFilters.filters}
              setFilters={crudFilters.setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
            <SelectFilter
              label="Maintenance Terminal"
              filterKey="maintenance_terminal_id"
              filters={crudFilters.filters}
              setFilters={crudFilters.setFilters}
              options={maintenanceAreas.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </SearchAndFilters>
        }
      />

      <OfcForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        ofcCable={editModal.record as OfcCablesWithRelations | null}
        onSubmit={handleSave}
        pageLoading={isMutating}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.isLoading}
      />
    </div>
  );
};

export default OfcPage;
