// app/dashboard/logical-paths/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiGitBranch, FiEye } from "react-icons/fi";

import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/page-header";
import { ErrorDisplay } from "@/components/common/ui";
import { DataTable } from "@/components/table/DataTable";
import { SearchAndFilters } from "@/components/common/filters/SearchAndFilters";

import { Row, usePagedData } from "@/hooks/database";
import { DataQueryHookReturn } from "@/hooks/useCrudManager";
import type { TableAction } from "@/components/table/datatable-types";

import { LogicalPathsTableColumns } from "@/config/table-columns/LogicalPathsTableColumns";
import { V_end_to_end_pathsRowSchema } from "@/schemas/zod-schemas";
import { createClient } from "@/utils/supabase/client";
import { StatProps } from "@/components/common/page-header/StatCard";
import { Filters } from "@/hooks/database/queries-type-helpers";
import { useQuery } from "@tanstack/react-query";

type LogicalPathView = Row<"v_end_to_end_paths"> & { id: string | null };

const useLogicalPathsData = (params: {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  statusFilter?: string;
}): DataQueryHookReturn<LogicalPathView> => {
  const { currentPage, pageLimit, searchQuery, statusFilter } = params;
  const supabase = createClient();

  const searchFilters = useMemo(() => {
    const filters: Filters = {};
    if (searchQuery && searchQuery.trim() !== "") {
      const term = searchQuery.trim().replace(/'/g, "''");
      const searchString = `path_name ILIKE '%${term}%' OR route_names ILIKE '%${term}%'`;
      filters.or = searchString;
    }
    if (statusFilter) {
      filters.operational_status = statusFilter;
    }
    return filters;
  }, [searchQuery, statusFilter]);

  const { data, isLoading, isFetching, error, refetch } =
    usePagedData<V_end_to_end_pathsRowSchema>(supabase, "v_end_to_end_paths", {
      filters: searchFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      orderBy: "path_name",
    });

  const mappedData = useMemo(() => {
    return (data?.data || []).map((path) => ({
      ...path,
      id: path.path_id,
    }));
  }, [data]);

  return {
    data: mappedData,
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

const usePathStats = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ["logical-path-stats"],
    queryFn: async () => {
      const [active, provisioned] = await Promise.all([
        supabase
          .from("v_end_to_end_paths")
          .select("*", { count: "exact", head: true })
          .ilike("operational_status", "Active"),
        supabase
          .from("v_end_to_end_paths")
          .select("*", { count: "exact", head: true })
          .ilike("operational_status", "Provisioned"),
      ]);

      return {
        active: active.count || 0,
        provisioned: provisioned.count || 0,
      };
    },
    staleTime: 60 * 1000,
  });
};

export default function LogicalPathsPage() {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: logicalPaths,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLogicalPathsData({
    currentPage,
    pageLimit,
    searchQuery,
    statusFilter,
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };
  const hasActiveFilters = !!searchQuery || !!statusFilter;

  const tableActions = useMemo<TableAction<"v_end_to_end_paths">[]>(() => {
    return [
      {
        key: "view",
        label: "View Details",
        icon: <FiEye />,
        onClick: (record) => {
          if (record.source_system_id) {
            router.push(`/dashboard/systems/${record.source_system_id}`);
          } else {
            toast.info("This path does not have a source system assigned.");
          }
        },
        variant: "secondary",
      },
    ];
  }, [router]);

  const { data: stats } = usePathStats();

  const headerActions = useStandardHeaderActions<"v_end_to_end_paths">({
    data: logicalPaths,
    onRefresh: async () => {
      await refetch();
      toast.success("Logical paths refreshed!");
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: { tableName: "v_end_to_end_paths" },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    return [
      {
        value: totalCount,
        label: "Total Paths",
        onClick: () => setStatusFilter(""),
        isActive: !statusFilter,
      },
      {
        value: stats?.active ?? "-",
        label: "Active (Live)",
        color: "success",
        onClick: () => setStatusFilter("Active"),
        isActive: statusFilter === "Active",
      },
      {
        value: stats?.provisioned ?? "-",
        label: "Provisioned (Planned)",
        color: "primary",
        onClick: () => setStatusFilter("Provisioned"),
        isActive: statusFilter === "Provisioned",
      },
    ];
  }, [totalCount, statusFilter, stats]);

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: refetch, variant: "primary" }]}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Logical Fiber Paths Viewer"
        description="Read-only view of end-to-end service paths."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      <DataTable<"v_end_to_end_paths">
        autoHideEmptyColumns={true}
        tableName="v_end_to_end_paths"
        data={logicalPaths}
        columns={LogicalPathsTableColumns(logicalPaths)}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        searchable={false}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setCurrentPage(page);
            setPageLimit(limit);
          },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={statusFilter ? 1 : 0}
            searchPlaceholder="Search by path or route name..."
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Provisioned">Provisioned</option>
                <option value="Faulty">Faulty</option>
              </select>
            </div>
          </SearchAndFilters>
        }
      />
    </div>
  );
}
