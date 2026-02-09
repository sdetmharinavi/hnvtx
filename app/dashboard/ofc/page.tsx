// app/dashboard/ofc/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  FiActivity,
  FiMapPin,
  FiLayers,
  FiDatabase,
  FiClock,
  FiLink,
  FiTrash2,
} from 'react-icons/fi';
import { AiFillMerge } from 'react-icons/ai';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { ConfirmModal, ErrorDisplay, PageSpinner, Button } from '@/components/common/ui';
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
import GenericRemarks from '@/components/common/GenericRemarks';
import { DataGrid } from '@/components/common/DataGrid';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { CiCalendarDate } from 'react-icons/ci';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { ExtendedOfcCable, LinkedCable } from '@/schemas/custom-schemas'; // IMPORTED
import { useUnlinkCable } from '@/hooks/database/ofc-linking-hooks'; // IMPORTED
import { CableLinkingModal } from '@/components/ofc/CableLinkingModal'; // IMPORTED

const OfcForm = dynamic(
  () => import('@/components/ofc/OfcForm/OfcForm').then((mod) => mod.default),
  { loading: () => <PageSpinner text='Loading OFC Form...' /> },
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
  const { sync: syncData, isSyncing } = useDataSync();
  const isOnline = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New State for Linking
  const [linkingCable, setLinkingCable] = useState<ExtendedOfcCable | null>(null);
  const [cableToUnlink, setCableToUnlink] = useState<{
    parent: ExtendedOfcCable;
    link: LinkedCable;
  } | null>(null);

  const { mutate: unlinkCable, isPending: isUnlinking } = useUnlinkCable();

  // Explicit type assertion for the CrudManager to use Extended schema
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataQueryHook: useOfcData as any, // Cast due to type extension
    displayNameField: 'route_name',
    initialFilters: { ofc_owner_id: 'ad3477d5-de78-4b9f-9302-a4b5db326e9f' },
    syncTables: ['ofc_cables', 'v_ofc_cables_complete', 'v_cable_utilization', 'ofc_cable_links'], // Added ofc_cable_links
  });

  // Transform the data to match ExtendedOfcCable type
  const transformedOfcData: ExtendedOfcCable[] = useMemo(() => {
    return ofcData.map((item) => {
      const raw = item.linked_cables;

      let parsed: LinkedCable[] | null;

      if (typeof raw === 'string') {
        // handle empty string or invalid JSON defensively if you want
        parsed = raw.trim() ? (JSON.parse(raw) as LinkedCable[]) : null;
      } else if (Array.isArray(raw)) {
        parsed = raw as LinkedCable[];
      } else {
        // covers undefined and any other falsy/non-array value
        parsed = null;
      }

      return {
        ...item,
        linked_cables: parsed, // now: LinkedCable[] | null
      };
    });
  }, [ofcData]);

  const isInitialLoad = isLoading && transformedOfcData.length === 0;

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.OFCADMIN].includes(role as UserRole);
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const { options: ofcTypeOptions, isLoading: loadingTypes } = useLookupTypeOptions(
    'OFC_TYPES',
    'desc',
    'name',
  );
  const { options: ofcOwnerOptions, isLoading: loadingOwners } = useLookupTypeOptions('OFC_OWNER');

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'sortBy',
        type: 'native-select' as const,
        placeholder: 'Sort By',
        options: [
          { value: 'name', label: 'Name (A-Z)' },
          { value: 'last_activity', label: 'Last Activity' },
        ],
      },
      {
        key: 'ofc_type_id',
        type: 'multi-select' as const,
        options: ofcTypeOptions,
        isLoading: loadingTypes,
        placeholder: 'All Cable Types',
      },
      {
        key: 'ofc_owner_id',
        type: 'multi-select' as const,
        options: ofcOwnerOptions,
        isLoading: loadingOwners,
        placeholder: 'All Owners',
      },
    ],
    [ofcTypeOptions, ofcOwnerOptions, loadingTypes, loadingOwners],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const columns = OfcTableColumns(ofcData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_cables_complete]);

  const handleRefresh = async () => {
    if (isOnline) {
      await syncData(['ofc_cables', 'v_ofc_cables_complete', 'ofc_cable_links']);
    }
    refetch();
    toast.success('Cables refreshed!');
  };

  const headerActions = useStandardHeaderActions({
    data: ofcData as Ofc_cablesRowSchema[],
    onRefresh: handleRefresh,
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    isFetching: isFetching || isSyncing,
    exportConfig: canEdit ? { tableName: 'ofc_cables' } : undefined,
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Cables',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  // Handle Unlink Confirmation
  const confirmUnlink = () => {
    if (cableToUnlink) {
      unlinkCable(cableToUnlink.link.link_id, {
        onSuccess: () => setCableToUnlink(null),
      });
    }
  };

  const renderItem = useCallback(
    (cable: ExtendedOfcCable) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastActivity = (cable as any).last_activity_at || cable.updated_at;
      const timeAgo = formatUpdatedAt(lastActivity);
      const linkedCables = cable.linked_cables || [];

      return (
        <GenericEntityCard
          key={cable.id}
          entity={cable}
          title={cable.route_name || 'Unnamed Route'}
          status={cable.status}
          showStatusLabel={false}
          subBadge={
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              <span className='inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50'>
                {cable.ofc_type_name || 'Unknown Type'}
              </span>
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50'>
                <FiLayers className='w-3.5 h-3.5' />
                {cable.capacity}F
              </span>
            </div>
          }
          dataItems={[
            { icon: FiMapPin, label: 'Area', value: cable.maintenance_area_name },
            { icon: FiActivity, label: 'Asset No', value: cable.asset_no, optional: true },
            { icon: FiDatabase, label: 'Transnet ID', value: cable.transnet_id, optional: true },
            {
              icon: CiCalendarDate,
              label: 'Commissioning Date',
              value: cable.commissioned_on,
              optional: true,
            },
          ]}
          customFooter={
            <div className='space-y-3 w-full'>
              <GenericRemarks remark={cable.remark || ''} />

              {/* LINKED CABLES SECTION */}
              {linkedCables.length > 0 && (
                <div className='bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800'>
                  <div className='flex items-center justify-between mb-1'>
                    <div className='text-[10px] text-blue-600 font-bold uppercase flex items-center gap-1'>
                      <FiLink className='w-3 h-3' /> Linked Routes
                    </div>
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {linkedCables.map((link) => (
                      <div
                        key={link.link_id}
                        className='group flex items-center gap-1.5 text-[10px] bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700'
                      >
                        <span
                          className='cursor-pointer hover:underline truncate max-w-[120px]'
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/ofc/${link.cable_id}`);
                          }}
                          title={link.description || link.route_name}
                        >
                          {link.route_name}
                        </span>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCableToUnlink({ parent: cable, link });
                            }}
                            className='text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                            title='Unlink'
                          >
                            <FiTrash2 className='w-2.5 h-2.5' />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 w-full pt-2 border-t border-gray-100 dark:border-gray-700/50'>
                <div className='flex items-center gap-1.5'>
                  <FiClock className='w-3.5 h-3.5' />
                  <span>Activity {timeAgo}</span>
                </div>
                <span className='font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-blue-950 dark:text-blue-100'>
                  {cable.current_rkm} km
                </span>
              </div>
            </div>
          }
          extraActions={
            canEdit ? (
              <Button
                size='xs'
                variant='secondary'
                onClick={() => setLinkingCable(cable)}
                title='Link to another cable'
                className='font-medium'
              >
                <FiLink className='w-4 h-4' />
              </Button>
            ) : undefined
          }
          onView={(r) => router.push(`/dashboard/ofc/${r.id}`)}
          onEdit={(record) => editModal.openEdit(record as V_ofc_cables_completeRowSchema)}
          onDelete={crudActions.handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      router,
      editModal.openEdit,
      crudActions.handleDelete,
      canEdit,
      canDelete,
      setLinkingCable,
      setCableToUnlink,
    ],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={transformedOfcData}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={transformedOfcData.length === 0 && !isLoading}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ofcData, renderItem, isLoading, totalCount, pagination],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'OFC Cable Management',
        description: 'Manage OFC cables and their related information.',
        icon: <AiFillMerge />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching || isSyncing,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search route name, asset no...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
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
            (row): row is Row<'v_ofc_cables_complete'> & { id: string } => !!row.id,
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
      isEmpty={transformedOfcData.length === 0 && !isLoading}
      modals={
        <>
          <input type='file' ref={fileInputRef} className='hidden' accept='.xlsx, .xls, .csv' />

          {editModal.isOpen && (
            <OfcForm
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              ofcCable={editModal.record as Ofc_cablesRowSchema}
              onSubmit={crudActions.handleSave}
              pageLoading={isMutating}
            />
          )}

          {linkingCable && (
            <CableLinkingModal
              isOpen={!!linkingCable}
              onClose={() => setLinkingCable(null)}
              sourceCable={linkingCable}
            />
          )}

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Deletion'
            message={deleteModal.message}
            type='danger'
            loading={deleteModal.loading}
          />

          <ConfirmModal
            isOpen={!!cableToUnlink}
            onConfirm={confirmUnlink}
            onCancel={() => setCableToUnlink(null)}
            title='Unlink Cable'
            message={
              <span>
                Are you sure you want to unlink <strong>{cableToUnlink?.link.route_name}</strong>{' '}
                from
                <strong>{cableToUnlink?.parent.route_name}</strong>?
              </span>
            }
            type='danger'
            confirmText='Unlink'
            loading={isUnlinking}
          />
        </>
      }
    />
  );
}
