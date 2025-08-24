"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { ConfirmModal } from "@/components/common/ui/Modal";
import {
  useTableWithRelations,
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  Filters,
} from "@/hooks/database";
import { TablesInsert, TablesUpdate } from "@/types/supabase-types";
import { createClient } from "@/utils/supabase/client";
import {
  MdWork as Briefcase,
  MdAdd as Plus,
  MdInfo as Info,
} from "react-icons/md";
import {
  DesignationWithRelations,
  EmployeeDesignation,
} from "@/components/designations/designationTypes";
import { useDelete } from "@/components/designations/useDelete";
import { SearchAndFilters } from "@/components/designations/SearchAndFilters";
import { ViewModeToggle } from "@/components/designations/ViewModeToggle";
import { DesignationTreeItem } from "@/components/designations/DesignationTreeItem";
import { DesignationListItem } from "@/components/designations/DesignationListItem";
import { DesignationDetailsPanel } from "@/components/designations/DesignationDetailsPanel";
import { DesignationFormModal } from "@/components/designations/DesignationFormModal";
import { DEFAULTS } from "@/config/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

export default function DesignationManagerPage() {
  const supabase = createClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(
    searchTerm,
    DEFAULTS.DEBOUNCE_DELAY
  );
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDesignationId, setSelectedDesignationId] = useState<
    string | null
  >(null);
  const [expandedDesignations, setExpandedDesignations] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithRelations | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  // Data queries
  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === "true";
    return f;
  }, [filters]);

  const designationsQuery = useTableWithRelations(
    supabase,
    "employee_designations",
    ["parent_designation:parent_id(id, name)"],
    {
      filters: serverFilters,
      orderBy: [{ column: "name", ascending: true }],
    }
  );

  // Data mutations
  const onMutationSuccess = () => {
    designationsQuery.refetch();
    setFormOpen(false);
    setEditingDesignation(null);
  };

  const createDesignationMutation = useTableInsert(
    supabase,
    "employee_designations",
    { onSuccess: onMutationSuccess }
  );
  const updateDesignationMutation = useTableUpdate(
    supabase,
    "employee_designations",
    { onSuccess: onMutationSuccess }
  );
  const toggleStatusMutation = useToggleStatus(
    supabase,
    "employee_designations",
    { onSuccess: onMutationSuccess }
  );

  const deleteManager = useDelete({
    tableName: "employee_designations",
    onSuccess: () => {
      if (selectedDesignationId === deleteManager.itemToDelete?.id) {
        setSelectedDesignationId(null);
        setShowDetailsPanel(false);
      }
      designationsQuery.refetch();
    },
  });

  // Derived state
  const allDesignations = useMemo(
    () => (designationsQuery.data as DesignationWithRelations[]) || [],
    [designationsQuery.data]
  );

  const searchedDesignations = useMemo(() => {
    if (!debouncedSearchTerm) return allDesignations;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return allDesignations.filter((designation) =>
      designation.name.toLowerCase().includes(searchLower)
    );
  }, [allDesignations, debouncedSearchTerm]);

  const hierarchicalDesignations = useMemo(() => {
    const relevantDesignations = debouncedSearchTerm
      ? searchedDesignations
      : allDesignations;
    const designationsMap = new Map<string, DesignationWithRelations>();

    relevantDesignations.forEach((designation) => {
      designationsMap.set(designation.id, {
        ...designation,
        child_designations: [],
      });
    });

    const tree: DesignationWithRelations[] = [];
    designationsMap.forEach((designation) => {
      if (designation.parent_id && designationsMap.has(designation.parent_id)) {
        const parent = designationsMap.get(designation.parent_id)!;
        parent.child_designations.push(designation);
      } else {
        tree.push(designation);
      }
    });

    const sortByName = (
      a: DesignationWithRelations,
      b: DesignationWithRelations
    ) => a.name.localeCompare(b.name);
    tree.sort(sortByName);
    tree.forEach(function sortChildren(designation) {
      designation.child_designations.sort(sortByName);
      designation.child_designations.forEach(sortChildren);
    });

    return tree;
  }, [allDesignations, searchedDesignations, debouncedSearchTerm]);

  const selectedDesignation = useMemo(() => {
    return (
      allDesignations.find(
        (designation) => designation.id === selectedDesignationId
      ) || null
    );
  }, [selectedDesignationId, allDesignations]);

  // Event handlers
  const handleOpenCreateForm = () => {
    setEditingDesignation(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (designation: DesignationWithRelations) => {
    setEditingDesignation(designation);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: TablesInsert<"employee_designations">) => {
    if (editingDesignation) {
      updateDesignationMutation.mutate({
        id: editingDesignation.id,
        data: data as TablesUpdate<"employee_designations">,
      });
    } else {
      createDesignationMutation.mutate(data);
    }
  };

  const handleToggleStatus = (
    e: React.MouseEvent,
    designation: EmployeeDesignation
  ) => {
    e.stopPropagation();
    toggleStatusMutation.mutate({
      id: designation.id,
      status: !designation.status,
    });
  };

  const handleRefresh = () => {
    designationsQuery.refetch();
  };

  const toggleExpanded = (designationId: string) => {
    setExpandedDesignations((prev) => {
      const next = new Set(prev);
      if (next.has(designationId)) {
        next.delete(designationId);
      } else {
        next.add(designationId);
      }
      return next;
    });
  };

  const handleDesignationSelect = (designationId: string) => {
    setSelectedDesignationId(designationId);
    setShowDetailsPanel(true);
  };

  const isLoading =
    designationsQuery.isLoading ||
    createDesignationMutation.isPending ||
    updateDesignationMutation.isPending ||
    toggleStatusMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <PageHeader
        isLoading={isLoading}
        exportConfig={{
          tableName: "employee_designations",
          filters: serverFilters,
          maxRows: 1000,
          customStyles: {},
        }}
        // Remove the built-in functionality and only use customActions
        showExport={true}
        showRefresh={false} // Disable built-in refresh since you have custom refresh
        onAddNew={undefined} // Remove built-in add since you have custom add
        customActions={[
          {
            label: "Add Designation",
            onClick: handleOpenCreateForm,
            variant: "outline",
            disabled: isLoading,
            hideOnMobile: false,
            hideTextOnMobile: false,
            tooltip: "Add new designation",
            leftIcon: <FiPlus />,
          },
          {
            label: "Refresh",
            onClick: handleRefresh,
            variant: "outline",
            disabled: isLoading,
            hideOnMobile: false,
            hideTextOnMobile: false,
            tooltip: "Refresh",
            leftIcon: (
              <FiRefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            ),
          },
        ]}
        countLabel="Total Designations"
        title="Designations"
        description="Manage designations"
        totalCount={designationsQuery.data?.length || 0}
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-80px)]">
        {/* Left Panel - List */}
        <div
          className={`flex-1 flex flex-col ${
            showDetailsPanel ? "hidden lg:flex" : "flex"
          } lg:border-r lg:border-gray-200 lg:dark:border-gray-700`}
        >
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((p) => !p)}
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            {designationsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading designations...
                  </p>
                </div>
              </div>
            ) : designationsQuery.isError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 inline-block mb-4">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-600 dark:text-red-400">
                    Error: {designationsQuery.error.message}
                  </p>
                </div>
              </div>
            ) : allDesignations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No designations found.
                  </p>
                  <button
                    onClick={handleOpenCreateForm}
                    className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Designation
                  </button>
                </div>
              </div>
            ) : viewMode === "tree" ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {hierarchicalDesignations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No designations match your search criteria.
                    </p>
                  </div>
                ) : (
                  hierarchicalDesignations.map((designation) => (
                    <DesignationTreeItem
                      key={designation.id}
                      designation={designation}
                      level={0}
                      isSelected={selectedDesignationId === designation.id}
                      isExpanded={expandedDesignations.has(designation.id)}
                      onSelect={handleDesignationSelect}
                      onToggleExpand={toggleExpanded}
                      onToggleStatus={handleToggleStatus}
                      isLoading={toggleStatusMutation.isPending}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {searchedDesignations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No designations match your search criteria.
                    </p>
                  </div>
                ) : (
                  searchedDesignations.map((designation) => (
                    <DesignationListItem
                      key={designation.id}
                      designation={designation}
                      isSelected={selectedDesignationId === designation.id}
                      onSelect={handleDesignationSelect}
                      onToggleStatus={handleToggleStatus}
                      isLoading={toggleStatusMutation.isPending}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div
          className={`${
            showDetailsPanel ? "flex" : "hidden lg:flex"
          } flex-col w-full lg:w-96 xl:w-1/3 bg-white dark:bg-gray-800 border-t lg:border-t-0 border-gray-200 dark:border-gray-700`}
        >
          {/* Mobile Details Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Details
              </h2>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Details Header */}
          <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Designation Details
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedDesignation ? (
              <DesignationDetailsPanel
                designation={selectedDesignation}
                onEdit={handleOpenEditForm}
                onDelete={deleteManager.deleteSingle}
              />
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <Info className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a designation to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <DesignationFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          designation={editingDesignation}
          allDesignations={allDesignations}
          isLoading={
            createDesignationMutation.isPending ||
            updateDesignationMutation.isPending
          }
        />
      )}
      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size="md"
      />
    </div>
  );
}
