"use client";

import React, { useMemo, useState } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useCrudPage } from "@/hooks/useCrudPage";
import { useTableQuery } from "@/hooks/database";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { Button, ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import EmployeeForm from "@/components/employee/EmployeeForm";
import EmployeeDetailsModal from "@/components/employee/EmployeeDetailsModal";
import EmployeeFilters from "@/components/employee/EmployeeFilters";
import { getEmployeeTableColumns } from "@/components/employee/EmployeeTableColumns";
import { getEmployeeTableActions } from "@/components/employee/EmployeeTableActions";
import { EmployeeWithRelations } from "@/components/employee/employee-types";
import { BulkActions } from "@/components/common/BulkActions";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";

const EmployeesPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    data: employeesData,
    totalCount,
    isLoading,
    isMutating,
    error,
    refetch,
    pagination,
    search,
    filters,
    modal,
    actions: crudActions,
    bulkActions,
    deleteModal,
  } = useCrudPage({
    tableName: "employees",
    relations: ["employee_designations(name)", "maintenance_areas(name, code)"],
    searchColumn: "employee_name",
  });

  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(
    null
  );

  const supabase = createClient();
  const { data: designations = [] } = useTableQuery(
    supabase,
    "employee_designations",
    { orderBy: [{ column: "name" }] }
  );
  const { data: maintenanceAreas = [] } = useTableQuery(
    supabase,
    "maintenance_areas",
    { filters: { status: true }, orderBy: [{ column: "name" }] }
  );

  const columns = useMemo(
    () =>
      getEmployeeTableColumns({
        designationMap: Object.fromEntries(
          designations.map((d) => [d.id, d.name])
        ),
        areaMap: Object.fromEntries(
          maintenanceAreas.map((a) => [a.id, a.name])
        ),
      }),
    [designations, maintenanceAreas]
  );

  const tableActions = useMemo(
    () =>
      getEmployeeTableActions({
        onView: (id) => setViewingEmployeeId(id),
        onEdit: (id) => {
          const emp = employeesData.find((e) => e.id === id);
          if (emp) modal.openEditModal(emp);
        },
        onToggleStatus: (record) => crudActions.handleToggleStatus(record),
        onDelete: (employeeId, displayName = "this employee") =>
          crudActions.handleDelete({ id: employeeId, name: displayName }),
      }),
    [employeesData, modal, crudActions]
  );

  // Download Configurations
  const exportColumns = useDynamicColumnConfig("employees");
  const tableExcelDownload = useTableExcelDownload(
    supabase,
    "employees",
    {
      onSuccess: () => {
        toast.success("Export successful");
        
      },
      onError: () => toast.error("Export failed"),
    }
  );

  const handleExport = async () => {
    const tableName = "employees";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: exportColumns,
      // filters: filters.filters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: "Retry",
            onClick: refetch,
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Employee Management ({totalCount})
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<FiDownload />} onClick={handleExport}>
            Export
          </Button>
          <Button onClick={modal.openAddModal} leftIcon={<FiPlus />}>
            Add Employee
          </Button>
        </div>
      </div>
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="employee"
        showStatusUpdate={true}
      />

      <DataTable
        tableName="employees"
        data={employeesData as Row<"employees">[]}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows) => {
          // Update selection with new row IDs
          bulkActions.handleRowSelect(selectedRows);
        }}
        searchable={false} // Turn off internal search
        filterable={false} // Turn off internal filters
        showColumnsToggle={true}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
        customToolbar={
          <EmployeeFilters
            searchQuery={search.searchQuery} // <-- PASS THE SEARCH QUERY DOWN
            showFilters={showFilters}
            filters={filters.filters}
            onSearchChange={search.setSearchQuery}
            onFilterToggle={() => setShowFilters(!showFilters)}
            onDesignationChange={(value) =>
              filters.setFilters((prev) => ({
                ...prev,
                employee_designation_id: value,
              }))
            }
            onStatusChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, status: value }))
            }
            onMaintenanceAreaChange={(value) =>
              filters.setFilters((prev) => ({
                ...prev,
                maintenance_terminal_id: value,
              }))
            }
            designations={designations as Row<"employee_designations">[]}
            maintenanceAreas={maintenanceAreas as Row<"maintenance_areas">[]}
          />
        }
      />

      {modal.isModalOpen && (
        <EmployeeForm
          employee={modal.editingRecord as EmployeeWithRelations | null}
          onSubmit={crudActions.handleSave}
          onCancel={modal.closeModal}
          isLoading={isMutating}
          designations={designations as Row<"employee_designations">[]}
          maintenanceAreas={maintenanceAreas as Row<"maintenance_areas">[]}
        />
      )}

      {viewingEmployeeId && (
        <EmployeeDetailsModal
          employeeId={viewingEmployeeId}
          onClose={() => setViewingEmployeeId(null)}
          onEdit={() => {
            const emp = employeesData.find((e) => e.id === viewingEmployeeId);
            if (emp) modal.openEditModal(emp);
            setViewingEmployeeId(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.isLoading}
        type="danger"
      />
    </div>
  );
};

export default EmployeesPage;
