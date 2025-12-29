// components/employee/EmployeeCard.tsx
import React from 'react';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';
import { FiPhone, FiMail, FiMapPin, FiTrash2, FiEdit2 } from 'react-icons/fi';
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
  viewMode = 'grid',
}) => {
  const initials =
    employee.employee_name
      ?.split(' ')
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  // Generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-cyan-500 to-cyan-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const avatarColor = getAvatarColor(employee.employee_name || '');

  // --- GRID VIEW (Desktop Cards) ---
  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden group">
        {/* Header with linear background */}
        <div className="relative h-24 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={employee.status ?? false} />
          </div>

          {/* Avatar - Overlapping header */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <div
              className={`w-20 h-20 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800`}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-5 px-5">
          <div className="text-center mb-4">
            <h3
              className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate"
              title={employee.employee_name || ''}
            >
              {employee.employee_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
              {employee.employee_designation_name || 'No Designation'}
            </p>
            {employee.employee_pers_no && (
              <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                ID: {employee.employee_pers_no}
              </span>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-2.5 mb-4">
            {employee.employee_contact && (
              <a
                href={`tel:${employee.employee_contact}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group/item"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover/item:scale-110 transition-transform">
                  <FiPhone className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {employee.employee_contact}
                </span>
              </a>
            )}

            {employee.employee_email && (
              <a
                href={`mailto:${employee.employee_email}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group/item"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/item:scale-110 transition-transform">
                  <FiMail className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                  {employee.employee_email}
                </span>
              </a>
            )}

            {employee.maintenance_area_name && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                  {employee.maintenance_area_name}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 group/btn hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
                onClick={() => onEdit(employee)}
              >
                <FiEdit2 className="w-4 h-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                Edit
              </Button>
              {canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 px-3 group/btn"
                  onClick={() => onDelete(employee)}
                >
                  <FiTrash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LIST VIEW (Mobile / Compact) ---
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-linear-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div
          className={`w-12 h-12 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {employee.employee_name}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {employee.employee_designation_name || 'No Designation'}
          </div>
          {employee.employee_pers_no && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              ID: {employee.employee_pers_no}
            </div>
          )}
        </div>
        <StatusBadge status={employee.status ?? false} />
      </div>

      {/* Contact Actions */}
      <div className="p-4 pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {employee.employee_contact && (
            <a
              href={`tel:${employee.employee_contact}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 active:scale-95 transition-all"
            >
              <FiPhone className="w-4 h-4" /> Call
            </a>
          )}
          {employee.employee_email && (
            <a
              href={`mailto:${employee.employee_email}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all"
            >
              <FiMail className="w-4 h-4" /> Email
            </a>
          )}
        </div>

        {employee.maintenance_area_name && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
            <FiMapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {employee.maintenance_area_name}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(employee)}>
              <FiEdit2 className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700"
                onClick={() => onDelete(employee)}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
