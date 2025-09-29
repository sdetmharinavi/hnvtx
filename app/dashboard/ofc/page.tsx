'use client';

import {
  Filters,
  usePagedData,
  useTableInsert,
  useTableUpdate,
} from '@/hooks/database';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { BulkActions } from '@/components/common/BulkActions';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import OfcForm from '@/components/ofc/OfcForm/OfcForm';
import { DataTable } from '@/components/table/DataTable';
import { TablesInsert } from '@/types/supabase-types';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { createStandardActions } from '@/components/table/action-helpers';
import { TABLE_COLUMN_KEYS } from '@/config/table-column-keys';
import { OfcTableColumns } from '@/config/table-columns/OfcTableColumns';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { AiFillMerge } from 'react-icons/ai';
import { toast } from 'sonner';

export type OfcCablesWithRelations = V_ofc_cables_completeRowSchema & {
  ofc_type: {
    id: string;
    name: string;
  } | null;
  maintenance_area: {
    id: string;
    name: string;
  } | null;
};

// 1. ADAPTER HOOK: Makes `useOfcData` compatible with `useCrudManager`
const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_cables_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  // Build the server filters object that the RPC function expects.
  const serverFilters = useMemo(() => {
    const richFilters: Filters = { ...filters };
    if (searchQuery) {
      richFilters.or = {
        route_name: searchQuery,
        asset_no: searchQuery,
        transnet_id: searchQuery,
      };
    }
    return richFilters; // Return Filters type instead of converting to Json
  }, [filters, searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_ofc_cables_completeRowSchema>(
    supabase,
    'v_ofc_cables_complete',
    {
      filters: serverFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      orderBy: 'route_name', // Changed from default 'name' to 'route_name' which exists in the view
    }
  );


  return {
    data: data?.data || [],
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    isFetching,
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
    isFetching,
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
  } = useCrudManager<'ofc_cables', V_ofc_cables_completeRowSchema>({
    tableName: 'ofc_cables',
    dataQueryHook: useOfcData,
    searchColumn: 'route_name', // This can be considered the "primary" search field for display purposes
  });

  // 3. Extract ring types from the rings data
  const ofcTypes = useMemo(() => {
    const uniqueOfcTypes = new Map();
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

  const ofcOwners = useMemo(() => {
    const uniqueOwners = new Map();
    ofcData.forEach((ofc) => {
      if (ofc.ofc_owner_code) {
        uniqueOwners.set(ofc.ofc_owner_id, {
          id: ofc.ofc_owner_id,
          ofc_owner_code: ofc.ofc_owner_code,
        });
      }
    });
    return Array.from(uniqueOwners.values());
  }, [ofcData]);

  const supabase = createClient();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(crudFilters.filters).filter(
    Boolean
  ).length;
  const hasActiveFilters = activeFilterCount > 0 || !!search.searchQuery;

  const handleClearFilters = () => {
    crudFilters.setFilters({});
    search.setSearchQuery('');
  };

  const { data: isSuperAdmin } = useIsSuperAdmin();

  // Memoize the record to prevent unnecessary re-renders
  const memoizedOfcCable = useMemo(
    () => editModal.record as OfcCablesWithRelations,
    [editModal.record]
  );

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

  // --- HANDLERS ---
  const closeModal = useCallback(() => {
    editModal.close();
  }, [editModal]);

  const handleSave = useCallback((data: TablesInsert<'ofc_cables'>) => {
    if (editModal.record) {
      updateOfcCable({ id: editModal.record.id!, data });
    } else {
      insertOfcCable(data);
    }
  }, [editModal.record, insertOfcCable, updateOfcCable]); 

  // --- MEMOIZED VALUES ---
  const columns = OfcTableColumns(ofcData);

  const orderedColumns = useOrderedColumns(
    columns,
    [...TABLE_COLUMN_KEYS.ofc_cables] // Spread operator creates a new mutable array
  );

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

  const loading = isLoading || isInserting || isUpdating;

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: loading,
    exportConfig: {
      tableName: 'ofc_cables',
      filterOptions: [
        {
          label: 'BSNL',
          filters: {
            ofc_owner_id: {
              operator: 'eq',
              value: 'ad3477d5-de78-4b9f-9302-a4b5db326e9f',
            },
          },
        },
        {
          label: 'BBNL',
          filters: {
            ofc_owner_id: {
              operator: 'eq',
              value: 'e40c2549-11ec-485d-a67a-8261fcaec68a',
            },
          },
        },
      ],
    },
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
        actions={headerActions}
        isLoading={loading}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={() => bulkActions.handleBulkDelete()}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="ofc cable"
        showStatusUpdate={true}
        canDelete={() => isSuperAdmin === true && bulkActions.selectedCount > 0}
      />

      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData}
        columns={orderedColumns}
        loading={loading}
        isFetching={isFetching}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows: V_ofc_cables_completeRowSchema[]): void => {
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
            searchPlaceholder="Search by Asset No or Route Name or Transnet ID..."
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
              label="ofc_owner"
              filterKey="ofc_owner_id"
              filters={crudFilters.filters}
              setFilters={crudFilters.setFilters}
              options={ofcOwners.map((t) => ({
                value: t.id,
                label: t.ofc_owner_code,
              }))}
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
        ofcCable={memoizedOfcCable}
        onSubmit={handleSave}
        pageLoading={isMutating}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
        confirmText="Delete"
        cancelText="Cancel"
        showIcon={true}
      />
    </div>
  );
};

export default OfcPage;
