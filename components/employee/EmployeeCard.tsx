// components/employee/EmployeeCard.tsx
import React from 'react';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';
import { FiPhone, FiMail, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { StatusBadge } from '@/components/common/ui';
import { Button } from '@/components/common/ui/Button';

interface EmployeeCardProps {
  employee: V_employeesRowSchema;
  onEdit: (employee: V_employeesRowSchema) => void;
  onDelete: (employee: V_employeesRowSchema) => void;
  canDelete: boolean;
  canEdit: boolean;
  viewMode?: 'grid' | 'list';
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  onEdit, 
  onDelete, 
  canDelete,
  canEdit,
  viewMode = 'grid'
}) => {
  const initials = employee.employee_name?.charAt(0).toUpperCase() || '?';

  // --- GRID VIEW (Desktop Cards) ---
  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full group relative">
        
        {/* Status Indicator */}
        <div className="absolute top-4 right-4">
             <span className={`w-3 h-3 rounded-full block ${employee.status ? 'bg-green-500' : 'bg-red-500'}`} title={employee.status ? 'Active' : 'Inactive'} />
        </div>

        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3 border-2 border-white dark:border-gray-700 shadow-sm">
            {initials}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate w-full" title={employee.employee_name || ''}>
            {employee.employee_name}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
            {employee.employee_designation_name || 'No Designation'}
          </p>
           {employee.employee_pers_no && (
             <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
               ID: {employee.employee_pers_no}
             </span>
           )}
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-1">
          {employee.employee_contact && (
            <div className="flex items-center justify-center gap-2">
               <a href={`tel:${employee.employee_contact}`} className="hover:text-blue-600 flex items-center gap-2 transition-colors">
                  <FiPhone className="w-4 h-4" /> {employee.employee_contact}
               </a>
            </div>
          )}
          {employee.employee_email && (
            <div className="flex items-center justify-center gap-2">
               <a href={`mailto:${employee.employee_email}`} className="hover:text-blue-600 flex items-center gap-2 transition-colors truncate max-w-full">
                  <FiMail className="w-4 h-4" /> <span className="truncate">{employee.employee_email}</span>
               </a>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
             <FiMapPin className="w-3 h-3" /> {employee.maintenance_area_name || 'Unassigned'}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(employee)}>
              Edit
            </Button>
            {canDelete && (<Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2" onClick={() => onDelete(employee)}>
              <FiTrash2 className="w-4 h-4" />
            </Button>)}
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW (Mobile / Compact) ---
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
            {initials}
            </div>
            <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{employee.employee_name}</h3>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {employee.employee_designation_name}
            </div>
            </div>
        </div>
        <StatusBadge status={employee.status ?? false} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        {employee.employee_contact && (
             <a href={`tel:${employee.employee_contact}`} className="flex items-center justify-center gap-2 p-2 rounded bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm font-medium border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <FiPhone className="w-3.5 h-3.5" /> Call
             </a>
        )}
        {employee.employee_email && (
             <a href={`mailto:${employee.employee_email}`} className="flex items-center justify-center gap-2 p-2 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-medium border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <FiMail className="w-3.5 h-3.5" /> Email
             </a>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
         <FiMapPin className="w-3 h-3" />
         <span className="truncate">{employee.maintenance_area_name}</span>
      </div>

      {canEdit && (
         <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button size="xs" variant="outline" onClick={() => onEdit(employee)}>Edit</Button>
            {canDelete && (<Button size="xs" variant="ghost" className="text-red-500" onClick={() => onDelete(employee)}>Delete</Button>)}
         </div>
      )}
    </div>
  );
};