"use client";

import { useMemo, useState, useCallback } from "react";
import { FiEdit, FiEye, FiMapPin, FiPlus, FiSearch, FiServer, FiTrash2, FiRefreshCw, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";

import { Filters, useGetLookupTypesByCategory, usePagedSystemsComplete, useTableDelete } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { AddSystemModal } from "@/components/systems/add-system-modal";
import { ConfirmModal } from "@/components/common/ui/Modal/confirmModal";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { DataTable } from "@/components/table/DataTable";
import { TableAction } from "@/components/table/datatable-types";
import { Column } from '@/hooks/database/excel-queries';
import { Row } from "@/hooks/database";
import { PageSkeleton, StatsCardsSkeleton } from "@/components/common/ui/table/TableSkeleton";

const ITEMS_PER_PAGE = 20;

interface SystemData {
  id: string;
  system_name: string;
  s_no: string;
  system_type_name: string;
  node_name: string;
  ip_address: string;
  status: boolean | null;
  commissioned_on: string | null;
  total_count: number;
}

interface SystemStats {
  total: number;
  active: number;
  inactive: number;
  unknown: number;
}

export default function SystemsPage() {
  const supabase = createClient();
  const router = useRouter();

  // --- State Management ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystemType, setSelectedSystemType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // --- Data Fetching ---
  const systemFilters = useMemo(() => {
    const filters: Filters = {};
    if (debouncedSearchQuery) filters.system_name = { operator: "ilike", value: `%${debouncedSearchQuery}%` };
    if (selectedSystemType) filters.system_type_name = { operator: "eq", value: selectedSystemType };
    if (selectedStatus) filters.status = { operator: "eq", value: selectedStatus === "active" };
    return filters;
  }, [debouncedSearchQuery, selectedSystemType, selectedStatus]);

  const {
    data: paginatedSystems,
    isLoading: isLoadingSystems,
    isError: isErrorSystems,
    error: systemsError,
    refetch,
  } = usePagedSystemsComplete(supabase, {
    filters: systemFilters,
    orderBy: "system_name",
    orderDir: "asc",
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const { data: systemTypes = [], isLoading: isLoadingSystemTypes } = useGetLookupTypesByCategory(supabase, "SYSTEM_TYPES");

  const { mutate: deleteSystem, isPending: isDeleting } = useTableDelete(supabase, "systems");

  // --- Derived State ---
  const systemsList = paginatedSystems || [];
  const totalSystems = systemsList.length > 0 ? systemsList[0].total_count : 0;
  const totalPages = Math.ceil(totalSystems / ITEMS_PER_PAGE);

  // Calculate stats
  const systemStats: SystemStats = useMemo(() => {
    // For accurate stats, we need all systems, not just the current page
    // This is a simplified version - ideally you'd have a separate API call for stats
    const stats = {
      total: totalSystems,
      active: systemsList.filter(system => system.status === true).length,
      inactive: systemsList.filter(system => system.status === false).length,
      unknown: systemsList.filter(system => system.status === null).length,
    };
    
    // If we're on page 1 with no filters, we can show accurate counts for the page
    // Otherwise, show totals with note that active/inactive are estimates
    return stats;
  }, [systemsList, totalSystems]);

  // --- Action Handlers ---
  const handleView = useCallback((system: Row<'v_systems_complete'>) => {
    router.push(`/systems/${system.id}`);
  }, [router]);

  const handleEdit = useCallback((system: Row<'v_systems_complete'>) => {
    router.push(`/systems/${system.id}/edit`);
  }, [router]);

  const handleDelete = useCallback((system: Row<'v_systems_complete'>) => {
    deleteManager.deleteSingle({ id: system.id || "", name: String(system.system_name || "this system") });
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Systems data refreshed");
  }, [refetch]);

  const handleExport = useCallback(() => {
    // Implement export functionality
    toast.info("Export functionality coming soon");
  }, []);

  const deleteManager = useDeleteManager({
    tableName: "systems",
    onSuccess: () => {
      toast.success("System deleted successfully!");
      refetch();
    },
  });

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSystemType("");
    setSelectedStatus("");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || selectedSystemType || selectedStatus;

  // --- Error Handling ---
  if (isErrorSystems) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <div className="mx-auto">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Failed to Load Systems
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {systemsError?.message || "An unknown error occurred while loading systems data."}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading State ---
  if (isLoadingSystems && !systemsList.length) {
    return <PageSkeleton />;
  }

  // --- Column Configuration ---
  const columns: Column<Row<"v_systems_complete">>[] = [
    {
      key: "system_name",
      title: "Name",
      dataIndex: "system_name",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 200,
      render: (value: string, record: Row<'v_systems_complete'>) => (
        <div className='flex flex-col'>
          <span className='font-medium text-gray-900 dark:text-white'>{value}</span>
          <span className='text-xs text-gray-500 dark:text-gray-400'>S/N: {record.s_no}</span>
        </div>
      ),
    },
    {
      key: "system_type_name",
      title: "Type",
      dataIndex: "system_type_name",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 150,
    },
    {
      key: "node_name",
      title: "Node / Location",
      dataIndex: "node_name",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 150,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <FiMapPin className="h-3 w-3 text-gray-400" />
          <span>{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "ip_address",
      title: "IP Address",
      dataIndex: "ip_address",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 150,
      render: (value: string) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
          {value || "N/A"}
        </code>
      ),
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 150,
      render: (value: boolean) => getStatusBadge(value),
    },
    {
      key: "commissioned_on",
      title: "Commissioned On",
      dataIndex: "commissioned_on",
      sortable: true,
      searchable: true,
      filterable: true,
      editable: true,
      width: 150,
      render: (value: string) => formatDate(value),
    }
  ];

  const actions: TableAction<'v_systems_complete'>[] = [
    {
      key: "view",
      icon: <FiEye />,
      onClick: (record: Row<'v_systems_complete'>) => handleView(record),
      variant: "primary",
      label: "View",
    },
    {
      key: "edit",
      icon: <FiEdit />,
      onClick: (record: Row<'v_systems_complete'>) => handleEdit(record),
      variant: "secondary",
      disabled: (record: Row<'v_systems_complete'>) => record.status === false,
      label: "Edit",
    },
    {
      key: "delete",
      icon: <FiTrash2 />,
      onClick: (record: Row<'v_systems_complete'>) => handleDelete(record),
      variant: "danger",
      disabled: (record: Row<'v_systems_complete'>) => record.status === false,
      label: "Delete",
    },
  ];

  // --- Helper Functions ---
  const getStatusBadge = (status: boolean | null) => {
    if (status === null) {
      return (
        <span className='rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300'>
          Unknown
        </span>
      );
    }
    return status ? (
      <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300'>
        Active
      </span>
    ) : (
      <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300'>
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- Custom Toolbar ---
  const customToolbar = (
    <div className="flex flex-wrap items-center gap-3 p-4">
      {/* Search */}
      <div className="relative min-w-64">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search systems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* System Type Filter */}
      <select
        value={selectedSystemType}
        onChange={(e) => setSelectedSystemType(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <option value="">All Types</option>
        {systemTypes.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <FiX className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
        <div className='mx-auto'>
          {/* Header */}
          <div className='mb-6'>
            <div className='mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
              <div>
                <h1 className='flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
                  <FiServer className='text-blue-600' /> Systems
                </h1>
                <p className='mt-1 text-gray-600 dark:text-gray-400'>
                  Manage and monitor all network systems across your infrastructure.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingSystems}
                  className='flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  <FiRefreshCw className={`h-4 w-4 ${isLoadingSystems ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)} 
                  className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700'
                >
                  <FiPlus /> Add System
                </button>
              </div>
            </div>

            {/* Stats */}
            {isLoadingSystems && systemsList.length === 0 ? (
              <StatsCardsSkeleton count={4} />
            ) : (
              <div className='grid grid-cols-1 gap-4 text-center sm:grid-cols-2 md:grid-cols-4'>
                <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
                  <div className='text-3xl font-bold text-gray-900 dark:text-white'>
                    {systemStats.total.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>Total Systems</div>
                </div>
                <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
                  <div className='text-3xl font-bold text-green-600 dark:text-green-400'>
                    {systemStats.active.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>Active Systems</div>
                </div>
                <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
                  <div className='text-3xl font-bold text-red-600 dark:text-red-400'>
                    {systemStats.inactive.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>Inactive Systems</div>
                </div>
                <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
                  <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    {isLoadingSystemTypes ? "..." : systemTypes?.length.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>System Types</div>
                </div>
              </div>
            )}
          </div>

          <DataTable
            title='Systems'
            data={systemsList}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: ITEMS_PER_PAGE,
              total: totalSystems,
              onChange: (page, pageSize) => setCurrentPage(page),
            }}
            actions={actions}
            searchable={true}
            filterable={true}
            sortable={true}
            selectable={true}
            exportable={true}
            refreshable={true}
            density='default'
            bordered={true}
            striped={true}
            hoverable={true}
            className='mt-6'
            emptyText='No systems found matching your criteria'
            tableName='v_systems_complete'
            loading={isLoadingSystems}
            customToolbar={customToolbar}
          />
        </div>
      </div>

      {/* Modals */}
      <AddSystemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size='md'
      />
    </>
  );
}