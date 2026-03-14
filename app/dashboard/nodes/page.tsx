// app/dashboard/nodes/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { NodeDetailsModal } from '@/config/node-details-config';
import { ErrorDisplay } from '@/components/common/ui';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useNodesData } from '@/hooks/data/useNodesData';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { FiCpu, FiMapPin, FiNavigation } from 'react-icons/fi';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataGrid } from '@/components/common/DataGrid';
import { Row } from '@/hooks/database';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';

export default function NodesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    data: nodes,
    totalCount,
    activeCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    viewModal,
  } = useCrudManager<'v_nodes_complete', V_nodes_completeRowSchema>({
    tableName: 'v_nodes_complete',
    dataQueryHook: useNodesData,
    searchColumn: ['name', 'remark'],
    syncTables: ['nodes', 'v_nodes_complete'],
  });

  const columns = NodesTableColumns(nodes);
  const orderedColumns = useOrderedColumns(columns as Column<Row<'v_nodes_complete'>>[], [
    ...TABLE_COLUMN_KEYS.v_nodes_complete,
  ]);

  const headerActions = useStandardHeaderActions({
    data: nodes as unknown as Row<'v_nodes_complete'>[],
    onRefresh: refetch,
    isLoading: isLoading,
    isFetching: isFetching,
  });

  const renderItem = useCallback(
    (node: V_nodes_completeRowSchema) => (
      <GenericEntityCard
        entity={node}
        title={node.name || 'Unnamed Node'}
        status={node.status}
        headerIcon={<FiMapPin className='w-7 h-7 text-blue-500' />}
        dataItems={[
          { icon: FiMapPin, label: 'Area', value: node.maintenance_area_name },
          {
            icon: FiNavigation,
            label: 'Coords',
            value: `${node.latitude?.toFixed(4)}, ${node.longitude?.toFixed(4)}`,
          },
        ]}
        onView={viewModal.open}
      />
    ),
    [viewModal.open],
  );

  if (error) return <ErrorDisplay error={error.message} />;

  return (
    <DashboardPageLayout<'v_nodes_complete'>
      header={{
        title: 'Node Data Viewer',
        description: 'Read-only view of network locations.',
        icon: <FiCpu />,
        stats: [
          { value: totalCount, label: 'Total Nodes' },
          { value: activeCount, label: 'Active', color: 'success' },
        ],
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      filters={filters.filters}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={() => <DataGrid data={nodes} renderItem={renderItem} isLoading={isLoading} />}
      tableProps={{
        tableName: 'v_nodes_complete',
        data: nodes as unknown as Row<'v_nodes_complete'>[],
        columns: orderedColumns,
        loading: isLoading,
        actions: createStandardActions({
          onView: (rec) => viewModal.open(rec as unknown as V_nodes_completeRowSchema),
        }),
        selectable: false,
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
      }}
      modals={
        <NodeDetailsModal
          isOpen={viewModal.isOpen}
          node={viewModal.record as V_nodes_completeRowSchema}
          onClose={viewModal.close}
        />
      }
    />
  );
}
