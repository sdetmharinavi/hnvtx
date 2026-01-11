// app/dashboard/ofc/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FiActivity, FiMapPin, FiLayers, FiDatabase, FiClock } from 'react-icons/fi';
import { AiFillMerge } from 'react-icons/ai';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { OfcTableColumns } from '@/config/table-columns/OfcTableColumns';
import { Ofc_cablesRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useUser } from '@/providers/UserProvider';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useOfcData } from '@/hooks/data/useOfcData';
import { Row } from '@/hooks/database';
import { UserRole } from '@/types/user-roles';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { useStandardHeaderActions } from '@/components/common/page-header';

const OfcForm = dynamic(
  () => import('@/components/ofc/OfcForm/OfcForm').then((mod) => mod.default),
  { loading: () => <PageSpinner text="Loading OFC Form..." /> }
);

const formatUpdatedAt = (timestamp: string | null | undefined) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function OfcPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { isSuperAdmin, role } = useUser();

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
    filters,
    editModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_cables', V_ofc_cables_completeRowSchema>({
    tableName: 'ofc_cables',
    localTableName: 'v_ofc_cables_complete',
    dataQueryHook: useOfcData,
    displayNameField: 'route_name',
    initialFilters: { ofc_owner_id: 'ad3477d5-de78-4b9f-9302-a4b5db326e9f' },
    syncTables: ['ofc_cables', 'v_ofc_cables_complete', 'v_cable_utilization'],
  });

  const isInitialLoad = isLoading && ofcData.length === 0;

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.OFCADMIN].includes(role as UserRole);
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const { options: ofcTypeOptions, isLoading: loadingTypes } = useLookupTypeOptions(
    'OFC_TYPES',
    'desc',
    'name'
  );
  const { options: ofcOwnerOptions, isLoading: loadingOwners } = useLookupTypeOptions('OFC_OWNER');

  const filterConfigs = useMemo(
    () => [
      {
        key: 'sortBy',
        label: 'Sort',
        type: 'native-select' as const,
        placeholder: 'Sort By',
        options: [
          { value: 'name', label: 'Name (A-Z)' },
          { value: 'last_activity', label: 'Last Activity' },
        ],
      },
      { key: 'ofc_type_id', label: 'Cable Type', options: ofcTypeOptions, isLoading: loadingTypes },
      { key: 'ofc_owner_id', label: 'Owner', options: ofcOwnerOptions, isLoading: loadingOwners },
    ],
    [ofcTypeOptions, ofcOwnerOptions, loadingTypes, loadingOwners]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters]
  );

  const columns = OfcTableColumns(ofcData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_cables_complete]);

  const headerActions = useStandardHeaderActions({
    data: ofcData as Ofc_cablesRowSchema[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    isFetching: isFetching, // Added isFetching
    exportConfig: canEdit ? { tableName: 'ofc_cables' } : undefined,
  });

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {ofcData.map((cable) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastActivity = (cable as any).last_activity_at || cable.updated_at;
        const timeAgo = formatUpdatedAt(lastActivity);

        return (
          <GenericEntityCard
            key={cable.id}
            entity={cable}
            title={cable.route_name || 'Unnamed Route'}
            status={cable.status}
            subBadge={
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50">
                  {cable.ofc_type_name || 'Unknown Type'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                  <FiLayers className="w-3.5 h-3.5" />
                  {cable.capacity}F
                </span>
              </div>
            }
            dataItems={[
              { icon: FiMapPin, label: 'Area', value: cable.maintenance_area_name },
              { icon: FiActivity, label: 'Asset No', value: cable.asset_no },
              { icon: FiDatabase, label: 'Transnet ID', value: cable.transnet_id },
            ]}
            customFooter={
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 w-full">
                <div className="flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>Activity {timeAgo}</span>
                </div>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-blue-950">
                  {cable.current_rkm} km
                </span>
              </div>
            }
            onView={(r) => router.push(`/dashboard/ofc/${r.id}`)}
            onEdit={editModal.openEdit}
            onDelete={crudActions.handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      })}
    </div>
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'OFC Cable Management',
        description: 'Manage OFC cables and their related information.',
        icon: <AiFillMerge />,
        stats: [
          { value: totalCount, label: 'Total Cables' },
          { value: activeCount, label: 'Active', color: 'success' },
          { value: inactiveCount, label: 'Inactive', color: 'danger' },
        ],
        actions: headerActions,
        isLoading: isInitialLoad,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder="Search route name, asset no..."
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'ofc cable',
        showStatusUpdate: true,
        canDelete: () => canDelete,
      }}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_ofc_cables_complete',
        data: ofcData,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: createStandardActions({
          onEdit: canEdit ? editModal.openEdit : undefined,
          onView: (record) => router.push(`/dashboard/ofc/${record.id}`),
          onDelete: canDelete ? crudActions.handleDelete : undefined,
        }),
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is Row<'v_ofc_cables_complete'> & { id: string } => !!row.id
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={ofcData.length === 0 && !isLoading}
      emptyState={
        <div className="col-span-full py-16 text-center text-gray-500">
          <AiFillMerge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No cables found matching your criteria.</p>
        </div>
      }
      modals={
        <>
          {editModal.isOpen && (
            <OfcForm
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              ofcCable={editModal.record as Ofc_cablesRowSchema}
              onSubmit={crudActions.handleSave}
              pageLoading={isMutating}
            />
          )}

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title="Confirm Deletion"
            message={deleteModal.message}
            type="danger"
            loading={deleteModal.loading}
          />
        </>
      }
    />
  );
}
