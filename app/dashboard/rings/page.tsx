// app/dashboard/rings/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import { DataTable } from "@/components/table/DataTable";
import { Filters, Row, useTableQuery, useTableWithRelations } from "@/hooks/database";
import { useTableDelete, useToggleStatus } from "@/hooks/database/basic-mutation-hooks";
import { getRingsTableColumns } from "@/components/rings/RingsTableColumns";
import { RingsFilters } from "@/components/rings/RingsFilters";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { RingModal } from "@/components/rings/RingModal";
import { RingsHeader } from "@/components/rings/RingsHeader";

const RingsPage = () => {
  const supabase = createClient();

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  const filters = useMemo<Filters>(() => {
    const f: Filters = {};
    if (debouncedSearch) f.name = { operator: "ilike", value: `%${debouncedSearch}%` };
    return f;
  }, [debouncedSearch]);

  // Reset to first page when filters/search change to avoid empty pages
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Data fetching via shared hook
  const {
    data: ringsData = [],
    isLoading: ringsLoading,
    refetch,
  } = useTableWithRelations(supabase, "rings", ["ring_type:ring_type_id(id, code)", "maintenance_terminal:maintenance_terminal_id(id,name)"], {
    filters,
    orderBy: [{ column: "name", ascending: true }],
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
  });


  const columns = useMemo(() => getRingsTableColumns(), []);

  // Accurate total count: prefer window total_count from query, fallback to exact head count
  const [totalCount, setTotalCount] = useState(0);
  useEffect(() => {
    // Try to read total_count from current page results (when includeCount is enabled)
    const windowCount = (Array.isArray(ringsData) && (ringsData as Array<Row<"rings"> & { total_count?: number }>)[0]?.total_count) || 0;

    // Also fetch an exact count using a lightweight HEAD request as fallback
    let q = supabase.from("rings").select("id", { count: "exact", head: true });
    if (debouncedSearch) {
      q = q.ilike("name", `%${debouncedSearch}%`);
    }
    q.then(({ count, error }) => {
      const pageLen = Array.isArray(ringsData) ? (ringsData as Array<unknown>).length : 0;
      if (error) {
        console.error("Failed to fetch rings count:", error);
        // Fallback priority: windowCount -> pageLen -> 0
        setTotalCount(windowCount || pageLen || 0);
      } else {
        const headCount = count || 0;
        // Use the max to avoid zero when data exists
        setTotalCount(Math.max(windowCount, headCount, pageLen));
      }
    });
  }, [supabase, debouncedSearch, ringsData]);

  // Mutations
  const deleteRing = useTableDelete(supabase, "rings", { invalidateQueries: true });
  const toggleRingStatus = useToggleStatus(supabase, "rings", { invalidateQueries: true });

  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRing, setEditingRing] = useState<Row<"rings"> | null>(null);

  const openAddModal = () => {
    setEditingRing(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ring: Row<"rings">) => {
    setEditingRing(ring);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Actions for rows
  const actions = useMemo(
    () => [
      {
        key: "edit",
        label: "Edit Name",
        icon: <FiEdit2 />,
        onClick: (record: Row<"rings">) => openEditModal(record),
      },
      {
        key: "activate",
        label: "Activate",
        icon: <FiToggleRight />,
        hidden: (record: Row<"rings">) => Boolean((record as any).status) === true,
        onClick: (record: Row<"rings">) => {
          toggleRingStatus.mutate({ id: (record as any).id as string, status: true });
        },
      },
      {
        key: "deactivate",
        label: "Deactivate",
        icon: <FiToggleLeft />,
        hidden: (record: Row<"rings">) => Boolean((record as any).status) === false,
        onClick: (record: Row<"rings">) => {
          toggleRingStatus.mutate({ id: (record as any).id as string, status: false });
        },
      },
      {
        key: "delete",
        label: "Delete",
        icon: <FiTrash2 />,
        variant: "danger" as const,
        onClick: (record: Row<"rings">) => {
          const name = String((record as any).name ?? "this ring");
          if (window.confirm(`Delete ${name}? This action cannot be undone.`)) {
            deleteRing.mutate((record as any).id as string);
          }
        },
      },
    ],
    [toggleRingStatus, deleteRing]
  );

  // Toolbar for DataTable (filters only; export handled by DataTable when exportable=true)
  const customToolbar = (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full'>
      <RingsFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </div>
  );

  return (
    <div className='mx-auto space-y-4'>
      {/* Header */}
      <RingsHeader
        onRefresh={refetch}
        onAddNew={openAddModal}
        isLoading={ringsLoading}
        totalCount={totalCount}
      />

      {/* Table */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
        <DataTable
          tableName='rings'
          data={ringsData as unknown as Row<"rings">[]}
          columns={columns}
          loading={ringsLoading}
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (page: number, pageSize: number) => {
              setCurrentPage(page);
              setPageLimit(pageSize);
            },
          }}
          actions={actions as any}
          selectable={false}
          exportable={false}
          searchable={false}
          filterable={false}
          customToolbar={customToolbar}
        />
      </div>

      {/* Add/Edit Modal */}
      <RingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingRing={editingRing as any}
        onCreated={() => {
          refetch();
          closeModal();
        }}
        onUpdated={() => {
          refetch();
          closeModal();
        }}
      />
    </div>
  );
};

export default RingsPage;
