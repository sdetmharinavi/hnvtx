import { Column } from "@/hooks/database/excel-queries";
import { Row } from "@/hooks/database";
import StatusBadge from "@/components/common/ui/badges/StatusBadge";

// Columns for employees table using DataTable component
// Note: We type columns against Row<"employees">; relation fields are accessed via custom render using any casts.
type LookupOptions = {
  designationMap?: Record<string, string>;
  areaMap?: Record<string, string>;
};

export const getEmployeeTableColumns = (
  options?: LookupOptions
): Column<Row<"employees">>[] => [
  {
    title: "Employee",
    dataIndex: "employee_name",
    key: "employee_name",
    width: 220,
    searchable: true,
    render: (_, record: Row<"employees">) => (
      <div className="min-w-[180px]">
        <div className="font-medium text-gray-900 dark:text-white">
          {record.employee_name || "—"}
        </div>
        {record.employee_pers_no && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ID: {record.employee_pers_no}
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Contact",
    dataIndex: "employee_contact",
    key: "contact",
    width: 220,
    searchable: true,
    render: (_, record: Row<"employees">) => (
      <div className="space-y-1">
        {record.employee_contact && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {record.employee_contact}
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Email",
    dataIndex: "employee_contact",
    key: "email",
    width: 220,
    searchable: true,
    render: (_, record: Row<"employees">) => (
      <div className="space-y-1">
        {record.employee_email && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {record.employee_email}
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Designation",
    dataIndex: "employee_designation_id",
    key: "designation",
    width: 180,
    render: (_, record: Row<"employees">) => {
      const id = record?.employee_designation_id as unknown as string | null;
      return (id && options?.designationMap?.[id]) || "Not set";
    },
  },
  {
    title: "Maintenance Area",
    dataIndex: "maintenance_terminal_id",
    key: "maintenance_area",
    width: 200,
    render: (_, record: Row<"employees">) => {
      const id = record?.maintenance_terminal_id as unknown as string | null;
      return (id && options?.areaMap?.[id]) || "Not set";
    },
  },
  {
    title: "Address",
    dataIndex: "employee_addr",
    key: "employee_addr",
    width: 300,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (value: boolean) => <StatusBadge status={!!value} />,
  },
  // {
  //   title: "Created",
  //   dataIndex: "created_at",
  //   key: "created_at",
  //   width: 180,
  //   render: (value: string | null) => (value ? formatDate(value, { format: "dd/mm/yyyy" }) : "—"),
  // },
  // {
  //   title: "Updated",
  //   dataIndex: "updated_at",
  //   key: "updated_at",
  //   width: 180,
  //   render: (value: string | null) => (value ? formatDate(value, { format: "dd/mm/yyyy" }) : "—"),
  // },
];
