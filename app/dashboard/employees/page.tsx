// app/dashboard/employees/page.tsx
"use client";

import { useMemo, useState, useCallback } from "react";

import { FiDownload, FiPlus } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableQuery,
  useTableUpdate,
  useToggleStatus,
} from "@/hooks/database";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import EmployeeForm from "@/components/employee/EmployeeForm";
import EmployeeDetailsModal from "@/components/employee/EmployeeDetailsModal";
import { EmployeeFilters } from "@/components/employee/EmployeeFilters";
import { EmployeeStats } from "@/components/employee/EmployeeStats";
import {
  EmployeeWithRelations,
  EmployeeFilters as EmployeeFiltersType,
} from "@/components/employee/employee-types";
import { TablesInsert } from "@/types/supabase-types";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { formatDate } from "@/utils/formatters";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { getEmployeeTableColumns } from "@/components/employee/EmployeeTableColumns";
import { getEmployeeTableActions } from "@/components/employee/EmployeeTableActions";
import { BulkActions } from "@/components/employee/BulkActions";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { useDebouncedCallback } from "use-debounce";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
// import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";

const EmployeesPage = () => {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithRelations | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [filters, setFilters] = useState<EmployeeFiltersType>({
    search: "",
    designation: "",
    status: "",
    maintenanceTerminal: "",
  });

  // Convert filters to server format
  const serverFilters = useMemo(() => {
    const dbFilters: Record<string, string | boolean> = {};
    if (filters.designation) {
      dbFilters.employee_designation_id = filters.designation;
    }
    if (filters.status !== "") {
      dbFilters.status = filters.status === "true";
    }
    if (filters.maintenanceTerminal) {
      dbFilters.maintenance_terminal_id = filters.maintenanceTerminal;
    }
    return dbFilters;
  }, [filters.designation, filters.status, filters.maintenanceTerminal]);

  // Fetch data
  const {
    data: employeesData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useTableQuery(supabase, "employees", {
    filters: {
      ...serverFilters,
      ...(filters.search
        ? { employee_name: { operator: "ilike", value: `%${filters.search}%` } }
        : {}),
    },
    orderBy: [{ column: "employee_name", ascending: true }],
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
    includeCount: true,
  });

  const firstData = employeesData?.[0];
  const totalCount = firstData?.total_count || 0;
  

  const { data: designations = [] } = useTableQuery(
    supabase,
    "employee_designations",
    {
      orderBy: [{ column: "name", ascending: true }],
    }
  );

  const { data: maintenanceAreas = [] } = useTableQuery(
    supabase,
    "maintenance_areas",
    {
      filters: { status: true },
      orderBy: [{ column: "name" }],
    }
  );

  // Lookup maps for rendering names in table
  const designationMap = useMemo(() => {
    return Object.fromEntries(
      (designations as Row<"employee_designations">[]).map((d) => [
        String(d.id),
        String(d.name ?? ""),
      ])
    ) as Record<string, string>;
  }, [designations]);

  const areaMap = useMemo(() => {
    return Object.fromEntries(
      (maintenanceAreas as Row<"maintenance_areas">[]).map((a) => [
        String(a.id),
        String(a.name ?? ""),
      ])
    ) as Record<string, string>;
  }, [maintenanceAreas]);

  // Server-side results
  const pageData = (employeesData as EmployeeWithRelations[]) || [];

  // Mutations
  const { mutate: insertEmployee, isPending: isInserting } = useTableInsert(
    supabase,
    "employees",
    {
      onSuccess: () => setShowForm(false),
      onSettled: () => refetchEmployees(),
    }
  );

  const { mutate: updateEmployee, isPending: isUpdating } = useTableUpdate(
    supabase,
    "employees",
    {
      onSuccess: () => {
        setShowForm(false);
        setEditingEmployee(null);
      },
      onSettled: () => refetchEmployees(),
    }
  );

  const { mutate: toggleStatus } = useToggleStatus(supabase, "employees");
  const deleteManager = useDeleteManager({
    tableName: "employees",
    onSuccess: () => setShowForm(false),
  });

  // Handlers
  const handleFormSubmit = (data: {
    employee_name: string;
    employee_pers_no?: string | null | undefined;
    employee_contact?: string | null | undefined;
    employee_email?: string | undefined;
    employee_dob?: Date | null | undefined;
    employee_doj?: Date | null | undefined;
    employee_designation_id?: string | null | undefined;
    employee_addr?: string | null | undefined;
    maintenance_terminal_id?: string | null | undefined;
    remark?: string | null | undefined;
  }) => {
    // Convert form data (Date fields) to DB insert shape (strings)
    const payload: TablesInsert<"employees"> = {
      employee_name: data.employee_name,
      employee_pers_no: data.employee_pers_no ?? null,
      employee_contact: data.employee_contact ?? null,
      employee_email: data.employee_email ?? null,
      employee_dob: data.employee_dob
        ? formatDate(data.employee_dob, { format: "yyyy-mm-dd" })
        : null,
      employee_doj: data.employee_doj
        ? formatDate(data.employee_doj, { format: "yyyy-mm-dd" })
        : null,
      employee_designation_id: data.employee_designation_id ?? null,
      employee_addr: data.employee_addr ?? null,
      maintenance_terminal_id: data.maintenance_terminal_id ?? null,
      remark: data.remark ?? null,
    };

    if (editingEmployee) {
      updateEmployee({ id: editingEmployee.id, data: payload });
    } else {
      insertEmployee(payload);
    }
  };

  const handleToggleStatus = (employee: EmployeeWithRelations) => {
    if (employee.id) {
      toggleStatus({ id: employee.id, status: !employee.status });
    }
  };

  const handleDelete = (employee: EmployeeWithRelations) => {
    deleteManager.deleteSingle({
      id: employee.id,
      name: employee.employee_name || "this employee",
    });
  };

  // Bulk handlers
  const handleBulkDelete = async () => {
    if (!selectedEmployees.length) return;
    const items = pageData
      .filter((e) => e.id && selectedEmployees.includes(e.id))
      .map((e) => ({
        id: e.id as string,
        name: e.employee_name || "this employee",
      }));
    deleteManager.deleteMultiple(items);
    setSelectedEmployees([]);
  };

  const handleBulkUpdateStatus = async (newStatus: "active" | "inactive") => {
    if (!selectedEmployees.length) return;
    const target = newStatus === "active";
    const ids = selectedEmployees.slice();
    await Promise.all(
      ids.map(
        (id) =>
          new Promise<void>((resolve) => {
            updateEmployee(
              { id, data: { status: target } },
              {
                onSettled: () => resolve(),
              }
            );
          })
      )
    );
    setSelectedEmployees([]);
  };

  // Download Configuration
  const tableExcelDownload = useTableExcelDownload(supabase, "employees");
  const columnsForExcelExport = useDynamicColumnConfig("employees");

  const handleExport = () => {
    const tableName = "employees";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: columnsForExcelExport as Column<Row<typeof tableName>>[],
      filters: serverFilters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  // DataTable setup
  const columns = useMemo(
    () => getEmployeeTableColumns({ designationMap, areaMap }),
    [designationMap, areaMap]
  );
  // const columns = useDynamicColumnConfig("employees")
  const actions = useMemo(
    () =>
      getEmployeeTableActions({
        onView: (id: string) => setViewingEmployee(id),
        onEdit: (id: string) => {
          const emp = (
            employeesData as EmployeeWithRelations[] | undefined
          )?.find((e) => e.id === id);
          if (emp) {
            setEditingEmployee(emp);
            setShowForm(true);
          }
        },
        onToggleStatus: (record: Row<"employees">) => {
          const emp = record as unknown as EmployeeWithRelations;
          handleToggleStatus(emp);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onDelete: (id: string, _displayName?: string) => {
          const emp = (
            employeesData as EmployeeWithRelations[] | undefined
          )?.find((e) => e.id === id);
          if (emp) handleDelete(emp);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employeesData]
  );

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300);

// Define handleSearch before using it in customToolbar
const handleSearch = useCallback((value: string) => {
  // Update the input value immediately for better UX
  setFilters(prev => ({ ...prev, search: value }));
  // Debounce the actual search operation (safe even if immediate set happens)
  debouncedSearch(value);
}, [debouncedSearch]);

// Memoize customToolbar to prevent unnecessary remounts of the search input
const customToolbar = useMemo(() => (
  <EmployeeFilters
    filters={filters}
    showFilters={showFilters}
    designations={designations}
    maintenanceAreas={maintenanceAreas}
    onMaintenanceAreaChange={(value) =>
      setFilters((prev) => ({ ...prev, maintenanceTerminal: value }))
    }
    onSearchChange={handleSearch}
    onFilterToggle={() => setShowFilters((prev) => !prev)}
    onDesignationChange={(value) =>
      setFilters((prev) => ({ ...prev, designation: value }))
    }
    onStatusChange={(value) =>
      setFilters((prev) => ({ ...prev, status: value }))
    }
  />
), [filters, showFilters, designations, maintenanceAreas, handleSearch]);

  const isLoading = employeesLoading || isInserting || isUpdating || deleteManager.isPending;
  const isError = employeesError

  return (
    <>
      {isError && console.log("Error loading employees")}
      <div className="mx-auto space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your organization&apos;s employees and their information
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1">
                Total Employees:{" "}
                <span className="font-bold text-gray-800 dark:text-white">
                  {totalCount}
                </span>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 order-1 sm:order-2">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-base bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg font-medium transition-all duration-200 min-h-[40px]"
                >
                  <FiDownload className="text-base flex-shrink-0" />
                  <span>Export Employees</span>
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 w-full sm:w-auto justify-center"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Employee
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="overflow-hidden">
            <BulkActions
              selectedCount={selectedEmployees.length}
              isOperationLoading={isUpdating}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onClearSelection={() => setSelectedEmployees([])}
            />
          </div>

          {/* DataTable */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <DataTable
              tableName="employees"
              data={pageData as unknown as Row<"employees">[]}
              columns={columns}
              loading={isLoading}
              pagination={{
                current: currentPage,
                pageSize: pageLimit,
                total: totalCount,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100, 500],
                onChange: (page, pageSize) => {
                  setCurrentPage(page);
                  setPageLimit(pageSize);
                },
              }}
              actions={actions}
              selectable={true}
              exportable={false}
              exportOptions={{
                fileName: `employees-export-${new Date().toISOString()}.xlsx`,
                filters: serverFilters,
              }}
              onRowSelect={(selectedRows) => {
                const ids = selectedRows
                  .map((row) => row.id)
                  .filter((id): id is string => typeof id === "string");
                setSelectedEmployees(ids);
              }}
              searchable={false}
              filterable={false}
              customToolbar={customToolbar}
            />
          </div>

          {/* Stats */}
          <EmployeeStats
            total={totalCount}
            active={pageData.filter((emp) => emp.status).length}
            inactive={pageData.filter((emp) => !emp.status).length}
          />

          {/* Form Modal */}
          {showForm && (
            <EmployeeForm
              employee={editingEmployee}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingEmployee(null);
              }}
              isLoading={isInserting || isUpdating}
              designations={designations}
              maintenanceAreas={maintenanceAreas}
            />
          )}

          {/* Confirm Modal */}
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
          {/* View Details Modal */}
          {viewingEmployee && (
            <EmployeeDetailsModal
              employeeId={viewingEmployee}
              onClose={() => setViewingEmployee(null)}
              onEdit={() => {
                const emp = (
                  employeesData as EmployeeWithRelations[] | undefined
                )?.find((e) => e.id === viewingEmployee);
                if (emp) {
                  setEditingEmployee(emp);
                  setShowForm(true);
                }
                setViewingEmployee(null);
              }}
            />
          )}
      </div>
    </>
  );
};

export default EmployeesPage;
