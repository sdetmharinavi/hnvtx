import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';

export const getEmployeeTableColumns = (): Column<V_employeesRowSchema>[] => [
  {
    title: 'Employee',
    dataIndex: 'employee_name',
    key: 'employee_name',
    width: 220,
    searchable: true,
    sortable: true,
    render: (_, record: V_employeesRowSchema) => (
      <div className="min-w-[180px]">
        <div className="font-medium text-gray-900 dark:text-white">
          {record.employee_name || '—'}
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
    title: 'Contact',
    dataIndex: 'employee_contact',
    key: 'employee_contact',
    width: 220,
    searchable: true,
    editable: true, // Enabled cell edit
    render: (_, record: V_employeesRowSchema) => (
      <div className="space-y-1">
        {record.employee_contact ? (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {record.employee_contact}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic hover:text-gray-500 cursor-pointer">
            Click to add
          </span>
        )}
      </div>
    ),
  },
  {
    title: 'Email',
    dataIndex: 'employee_email',
    key: 'employee_email',
    width: 220,
    searchable: true,
    editable: true, // Enabled cell edit
    render: (_, record: V_employeesRowSchema) => (
      <div className="space-y-1">
        {record.employee_email ? (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {record.employee_email}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic hover:text-gray-500 cursor-pointer">
            Click to add
          </span>
        )}
      </div>
    ),
  },
  {
    title: 'Designation',
    dataIndex: 'employee_designation_name',
    key: 'employee_designation_name',
    width: 180,
    searchable: true,
    sortable: true,
    render: (_, record: V_employeesRowSchema) => record.employee_designation_name || 'Not set',
  },
  {
    title: 'Maintenance Area',
    dataIndex: 'maintenance_area_name',
    key: 'maintenance_area_name',
    width: 200,
    searchable: true,
    sortable: true,
    render: (_, record: V_employeesRowSchema) => record.maintenance_area_name || 'Not set',
  },
  {
    title: 'Address',
    dataIndex: 'employee_addr',
    key: 'employee_addr',
    width: 300,
    searchable: true,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    sortable: true,
    render: (value: unknown) => <StatusBadge status={!!value} />,
  },
];