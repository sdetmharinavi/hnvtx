// components/maintenance-areas/MaintenanceAreasPage.tsx
"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableWithRelations, useTableQuery, Filters } from "@/hooks/database";
import { MaintenanceAreaWithRelations } from "@/components/maintenance-areas/maintenance-areas-types";
import { AreasToolbar } from "@/components/maintenance-areas/AreasToolbar";
import { AreasView } from "@/components/maintenance-areas/AreasView";
import { AreaDetailsPanel } from "@/components/maintenance-areas/AreaDetailsPanel";
import { AreaFormModal } from "@/components/maintenance-areas/AreaFormModal";
import { useDelete } from "@/components/maintenance-areas/useDelete";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { useMaintenanceAreasMutations } from "@/components/maintenance-areas/useMaintenanceAreasMutations";
import { useDebounce } from "use-debounce";
import { FiDownload, FiPlus } from "react-icons/fi";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";

export default function MaintenanceAreasPage() {
  const supabase = createClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filters, setFilters] = useState<{ status?: string; areaType?: string }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "tree">("tree");
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<MaintenanceAreaWithRelations | null>(null);

  // Data queries
  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === 'true';
    if (filters.areaType) f.area_type_id = filters.areaType;
    return f;
  }, [filters]);

  const areasQuery = useTableWithRelations(
    supabase,
    "maintenance_areas",
    ["area_type:area_type_id(id, name)", "parent_area:parent_id(id, name, code)"],
    {
      filters: serverFilters,
      orderBy: [{ column: "name", ascending: true }],
    }
  );

  const { data: areaTypes = [] } = useTableQuery(supabase, "lookup_types", {
    filters: { category: { operator: 'eq', value: 'MAINTENANCE_AREA_TYPES' } },
    orderBy: [{ column: 'name', ascending: true }]
  });
  
  // Data mutations
  const {
    createAreaMutation,
    updateAreaMutation,
    toggleStatusMutation,
    handleFormSubmit
  } = useMaintenanceAreasMutations(supabase, () => {
    areasQuery.refetch();
    setFormOpen(false);
    setEditingArea(null);
  });

  const deleteManager = useDelete({
    tableName: "maintenance_areas",
    onSuccess: () => {
      if (selectedAreaId === deleteManager.itemToDelete?.id) {
        setSelectedAreaId(null);
      }
      areasQuery.refetch();
    },
  });
  
  // Derived state
  const allAreas = useMemo(() => (areasQuery.data as MaintenanceAreaWithRelations[]) || [], [areasQuery.data]);
  const selectedArea = useMemo(() => allAreas.find(area => area.id === selectedAreaId) || null, [selectedAreaId, allAreas]);

  // Event handlers
  const handleOpenCreateForm = () => {
    setEditingArea(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (area: MaintenanceAreaWithRelations) => {
    setEditingArea(area);
    setFormOpen(true);
  };
  
  const toggleExpanded = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  // Download Configuration
  const columns = useDynamicColumnConfig("maintenance_areas");

  const tableExcelDownload = useTableExcelDownload(supabase, "maintenance_areas", {
    onSuccess: () => {
      toast.success("Export successful");
    },
    onError: () => toast.error("Export failed"),
  });

  const handleExport = async () => {
    const tableName = "maintenance_areas";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: columns,
      filters: {},
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };
  


  return (
    <div className='p-4 md:p-6 dark:bg-gray-900 min-h-screen'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Panel */}
        <div className='lg:col-span-2 flex flex-col'>
          <div className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Maintenance Areas</h1>
              <p className='text-gray-600 dark:text-gray-400'>Manage maintenance areas, zones, and terminals</p>
            </div>
            <button 
              onClick={handleExport}
              className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 w-full sm:w-auto justify-center'
            >
              <FiDownload className='h-4 w-4' />
              Export
            </button>
            <button 
              onClick={handleOpenCreateForm} 
              className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 w-full sm:w-auto justify-center'
            >
              <FiPlus className='h-4 w-4' />
              Add Area
            </button>
          </div>
          
          <div className='rounded-lg bg-white shadow dark:bg-gray-800 dark:shadow-gray-700/50 flex-grow flex flex-col'>
            <AreasToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              areaTypes={areaTypes}
            />
            
            <AreasView
              areasQuery={areasQuery}
              allAreas={allAreas}
              debouncedSearchTerm={debouncedSearchTerm}
              viewMode={viewMode}
              selectedAreaId={selectedAreaId}
              expandedAreas={expandedAreas}
              setSelectedAreaId={setSelectedAreaId}
              toggleExpanded={toggleExpanded}
              toggleStatusMutation={toggleStatusMutation}
            />
          </div>
        </div>

        {/* Right Panel */}
        <AreaDetailsPanel
          selectedArea={selectedArea}
          onEdit={handleOpenEditForm}
          onDelete={deleteManager.deleteSingle}
        />
      </div>

      {/* Modals */}
      {isFormOpen && (
        <AreaFormModal 
          isOpen={isFormOpen} 
          onClose={() => setFormOpen(false)}
          onSubmit={(data) => handleFormSubmit(data, editingArea)}
          area={editingArea}
          allAreas={allAreas}
          areaTypes={areaTypes}
          isLoading={createAreaMutation.isPending || updateAreaMutation.isPending}
        />
      )}
      
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
    </div>
  );
}