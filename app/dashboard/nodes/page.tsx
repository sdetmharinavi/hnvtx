// app/dashboard/nodes/page.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { GenericEntityCard } from "@/components/common/ui/GenericEntityCard";
import { NodeDetailsModal } from "@/config/node-details-config";
import { ErrorDisplay } from "@/components/common/ui";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useNodesData } from "@/hooks/data/useNodesData";
import {
  useLookupTypeOptions,
  useMaintenanceAreaOptions,
} from "@/hooks/data/useDropdownOptions";
import { useDuplicateFinder } from "@/hooks/useDuplicateFinder";
import { V_nodes_completeRowSchema } from "@/schemas/zod-schemas";
import { TABLE_COLUMN_KEYS } from "@/constants/table-column-keys";
import { NodesTableColumns } from "@/config/table-columns/NodesTableColumns";
import useOrderedColumns from "@/hooks/useOrderedColumns";
import { useStandardHeaderActions } from "@/components/common/page-header";
import { FiCpu, FiMapPin, FiNavigation, FiCopy } from "react-icons/fi";
import { createStandardActions } from "@/components/table/action-helpers";
import L from "leaflet";
import { getNodeIcon } from "@/utils/getNodeIcons";
import GenericRemarks from "@/components/common/GenericRemarks";
import { DataGrid } from "@/components/common/DataGrid";
import { StatProps } from "@/components/common/page-header/StatCard";

export default function NodesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const {
    data: nodes,
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
    viewModal,
  } = useCrudManager<"nodes", V_nodes_completeRowSchema>({
    tableName: "nodes",
    localTableName: "v_nodes_complete",
    dataQueryHook: useNodesData,
    searchColumn: ["name", "remark"],
    displayNameField: "name",
    syncTables: ["nodes", "v_nodes_complete"],
  });

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    nodes,
    "name",
    "Nodes",
  );

  const { options: nodeTypeOptions, isLoading: loadingNodeTypes } =
    useLookupTypeOptions("NODE_TYPES");
  const { options: areaOptions, isLoading: loadingAreas } =
    useMaintenanceAreaOptions();

  const filterConfigs = useMemo(
    () => [
      {
        key: "coordinates_status",
        type: "native-select" as const,
        options: [
          { value: "with_coords", label: "With Coordinates" },
          { value: "without_coords", label: "Without Coordinates" },
        ],
        placeholder: "All Locations",
      },
      {
        key: "node_type_id",
        type: "multi-select" as const,
        options: nodeTypeOptions,
        isLoading: loadingNodeTypes,
        sortOptions: false,
      },
      {
        key: "maintenance_terminal_id",
        type: "multi-select" as const,
        options: areaOptions,
        isLoading: loadingAreas,
      },
    ],
    [nodeTypeOptions, areaOptions, loadingNodeTypes, loadingAreas],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const isInitialLoad = isLoading && nodes.length === 0;

  const columns = NodesTableColumns(
    nodes,
    showDuplicates ? duplicateSet : undefined,
  );
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_nodes_complete,
  ]);

  const headerActions = useStandardHeaderActions({
    data: nodes,
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    isFetching: isFetching,
  });

  headerActions.push({
    label: showDuplicates ? "Hide Duplicates" : "Find Duplicates",
    onClick: toggleDuplicates,
    variant: "outline",
    leftIcon: <FiCopy />,
    hideTextOnMobile: true,
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    return [
      {
        value: totalCount,
        label: "Total Nodes",
        color: "default",
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
        label: "Active",
        color: "success",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, status: "true" })),
        isActive: currentStatus === "true",
      },
      {
        value: inactiveCount,
        label: "Inactive",
        color: "danger",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, status: "false" })),
        isActive: currentStatus === "false",
      },
    ];
  }, [
    totalCount,
    activeCount,
    inactiveCount,
    filters.filters.status,
    filters.setFilters,
  ]);

  const renderItem = useCallback(
    (node: V_nodes_completeRowSchema) => {
      const iconRaw = getNodeIcon(null, node.node_type_name, false);
      const iconHtml = (iconRaw.options as L.DivIconOptions).html as
        | string
        | undefined;

      const iconElement: React.ReactNode = iconHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: iconHtml }}
          className="scale-90 origin-center"
        />
      ) : (
        <FiMapPin className="w-7 h-7 text-gray-900 dark:text-gray-100" />
      );

      const coords =
        node.latitude && node.longitude
          ? `${node.latitude.toFixed(5)}, ${node.longitude.toFixed(5)}`
          : "No Coordinates";
      const hasCoordinates = !!(node.latitude && node.longitude);

      return (
        <GenericEntityCard
          key={node.id}
          entity={node}
          title={node.name || "Unnamed Node"}
          status={node.status}
          showStatusLabel={false}
          headerIcon={iconElement}
          subBadge={
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {node.node_type_name || node.node_type_code || "Unknown Type"}
            </span>
          }
          dataItems={[
            {
              icon: FiMapPin,
              label: "Maintenance Area",
              value: node.maintenance_area_name || "Unassigned",
            },
            {
              icon: FiNavigation,
              label: "Coordinates",
              value: (
                <span
                  className={`font-mono text-xs ${hasCoordinates ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-gray-400"}`}
                >
                  {coords}
                </span>
              ),
            },
          ]}
          customFooter={<GenericRemarks remark={node.remark || ""} />}
          onView={viewModal.open}
        />
      );
    },
    [viewModal.open],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={nodes}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={nodes.length === 0 && !isLoading}
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
    [nodes, renderItem, isLoading, totalCount, pagination],
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: refetch }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: "Node Data Viewer",
        description:
          "Read-only view of network locations, towers, and exchanges.",
        icon: <FiCpu />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder="Search node name, remark..."
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: "v_nodes_complete",
        data: nodes,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching,
        actions: createStandardActions({ onView: viewModal.open }),
        selectable: false,
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
      }}
      isEmpty={nodes.length === 0 && !isLoading}
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
