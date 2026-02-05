// app/dashboard/services/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStandardHeaderActions, ActionButton } from '@/components/common/page-header';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard, EntityCardItem } from '@/components/common/ui/GenericEntityCard';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useServicesData } from '@/hooks/data/useServicesData';
import { ServicesTableColumns } from '@/config/table-columns/ServicesTableColumns';
import { createStandardActions } from '@/components/table/action-helpers';
import { ServiceFormModal } from '@/components/services/ServiceFormModal';
import { toast } from 'sonner';
import {
  Copy,
  Database as DatabaseIcon,
  Server,
  ExternalLink,
  Activity,
  Tag,
  Hash,
} from 'lucide-react';
import { useTableInsert, useTableUpdate } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { useUser } from '@/providers/UserProvider';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import GenericRemarks from '@/components/common/GenericRemarks';
import { DataGrid } from '@/components/common/DataGrid';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added

interface AllocatedSystem {
  id: string;
  name: string;
}

export default function ServicesPage() {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    data,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    isMutating,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'services', V_servicesRowSchema>({
    tableName: 'services',
    localTableName: 'v_services',
    dataQueryHook: useServicesData,
    displayNameField: 'name',
    syncTables: ['services', 'v_services', 'system_connections'],
  });

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const duplicateIdentity = useCallback((item: V_servicesRowSchema) => {
    const name = item.name?.trim().toLowerCase() || '';
    const linkType = item.link_type_name?.trim().toLowerCase() || '';
    return `${name}|${linkType}`;
  }, []);

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    data,
    duplicateIdentity,
    'Services',
  );

  const columns = ServicesTableColumns(data, duplicateSet);
  const { options: linkTypeOptions, isLoading: loadingLinks } = useLookupTypeOptions('LINK_TYPES');

  const filterConfigs = useMemo(
    () => [
      {
        key: 'link_type_id',
        type: 'multi-select' as const,
        options: linkTypeOptions,
        isLoading: loadingLinks,
      },
      {
        key: 'allocation_status',
        type: 'native-select' as const,
        options: [
          { value: 'allocated', label: 'Allocated' },
          { value: 'unallocated', label: 'Unallocated' },
        ],
      },
      {
        key: 'status',
        type: 'native-select' as const,
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],
    [linkTypeOptions, loadingLinks],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const { mutate: insertService, isPending: isInserting } = useTableInsert(supabase, 'services', {
    onSuccess: () => {
      refetch();
      editModal.close();
      toast.success('Service created.');
    },
  });

  const { mutate: updateService, isPending: isUpdating } = useTableUpdate(supabase, 'services', {
    onSuccess: () => {
      refetch();
      editModal.close();
      toast.success('Service updated.');
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (formData: any) => {
    if (editModal.record?.id) updateService({ id: editModal.record.id, data: formData });
    else insertService(formData);
  };

  const headerActions = useStandardHeaderActions({
    onRefresh: refetch,
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading,
    data: data as Row<'v_services'>[],
    exportConfig: canEdit
      ? {
          tableName: 'v_services',
          fileName: `All_Services`,
          filters: filters.filters,
          useRpc: true,
        }
      : undefined,
  });

  const enhancedHeaderActions: ActionButton[] = [
    ...headerActions,
    {
      label: showDuplicates ? 'Hide Duplicates' : 'Find Duplicates',
      onClick: toggleDuplicates,
      variant: 'outline',
      leftIcon: <Copy className='w-4 h-4' />,
      hideTextOnMobile: true,
    },
  ];
  if (canEdit) {
    const addNewAction = enhancedHeaderActions.find((a) => a.label === 'Add New');
    if (addNewAction) {
      const idx = enhancedHeaderActions.indexOf(addNewAction);
      enhancedHeaderActions.splice(idx, 1);
      enhancedHeaderActions.push(addNewAction);
    }
  }

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Services',
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

  const renderItem = useCallback(
    (service: V_servicesRowSchema) => {
      const isDup = duplicateSet.has(
        `${service.name?.trim().toLowerCase()}|${service.link_type_name?.trim().toLowerCase()}`,
      );
      const allocatedSystems = (service.allocated_systems as unknown as AllocatedSystem[]) || [];

      const dataItems: EntityCardItem[] = [];
      if (service.vlan) dataItems.push({ icon: Tag, label: 'VLAN', value: service.vlan });
      if (service.unique_id)
        dataItems.push({ icon: Hash, label: 'Unique ID', value: service.unique_id });
      dataItems.push({
        icon: Server,
        label: 'Route',
        value: (
          <div className='flex items-center gap-1 text-xs'>
            <TruncateTooltip text={service.node_name || '?'} className='font-medium max-w-[80px]' />
            <span className='text-gray-400'>→</span>
            <TruncateTooltip
              text={service.end_node_name || '?'}
              className='font-medium max-w-[80px]'
            />
          </div>
        ),
      });

      return (
        <GenericEntityCard
          key={service.id}
          entity={service}
          title={service.name || 'Unnamed Service'}
          status={service.status}
          showStatusLabel={false}
          subBadge={
            <div className='flex gap-2 flex-wrap mb-2'>
              {service.link_type_name && (
                <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-blue-600 text-white shadow-sm'>
                  <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
                  {service.link_type_name}
                </span>
              )}
              {service.bandwidth_allocated && (
                <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-purple-600 text-white shadow-sm'>
                  <Activity className='w-3.5 h-3.5' />
                  {service.bandwidth_allocated}
                </span>
              )}
              {isDup && (
                <span className='text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded border border-amber-200'>
                  Duplicate
                </span>
              )}
            </div>
          }
          dataItems={dataItems}
          customFooter={
            <div className='space-y-2 w-full'>
              <GenericRemarks remark={service.description || ''} />
              {allocatedSystems.length > 0 && (
                <div className='bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800'>
                  <div className='text-[10px] text-blue-600 font-bold uppercase mb-1 flex items-center gap-1'>
                    <Server className='w-3 h-3' /> Allocations
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {allocatedSystems.slice(0, 9).map((sys, idx) => (
                      <a
                        key={`${sys.id}-${idx}`}
                        href={`/dashboard/systems/${sys.id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={(e) => e.stopPropagation()}
                        className='text-[10px] bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 hover:underline flex items-center gap-1'
                      >
                        <span className='truncate max-w-[100px]'>{sys.name}</span>
                        <ExternalLink className='w-2 h-2' />
                      </a>
                    ))}
                    {allocatedSystems.length > 9 && (
                      <span className='text-[10px] text-blue-500'>
                        +{allocatedSystems.length - 9} more systems
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          }
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    [duplicateSet, editModal.openEdit, crudActions.handleDelete, canEdit, canDelete],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={data}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={data.length === 0 && !isLoading}
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
    [data, renderItem, isLoading, totalCount, pagination],
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: 'Service Management',
        description: 'Manage logical services, customers, and link definitions.',
        icon: <DatabaseIcon />,
        stats: headerStats, // Interactive Stats
        actions: enhancedHeaderActions,
        isLoading: isLoading,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search name, node, description...'
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
        onBulkUpdateStatus: () => {},
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'service',
        showStatusUpdate: false,
        canDelete: () => canDelete,
      }}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_services',
        data: data,
        columns: columns,
        loading: isLoading,
        isFetching: isFetching,
        actions: createStandardActions({
          onEdit: canEdit ? editModal.openEdit : undefined,
          onDelete: canDelete ? crudActions.handleDelete : undefined,
        }),
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_servicesRowSchema & { id: string } => row.id != null,
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={data.length === 0 && !isLoading}
      modals={
        <>
          {editModal.isOpen && (
            <ServiceFormModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              editingService={editModal.record ? editModal.record : null}
              onSubmit={handleSave}
              isLoading={isInserting || isUpdating}
            />
          )}

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Delete'
            message={deleteModal.message}
            type='danger'
            loading={deleteModal.loading}
          />
        </>
      }
    />
  );
}
