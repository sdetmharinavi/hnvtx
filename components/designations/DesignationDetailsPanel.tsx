
import { FiBriefcase, FiEdit3, FiTrash2 } from "react-icons/fi";
import { DetailItem } from "./DetailItem";
import { DesignationWithRelations } from "@/components/designations/designationTypes";

interface DesignationDetailsPanelProps {
  designation: DesignationWithRelations | null;
  onEdit: (designation: DesignationWithRelations) => void;
  onDelete: (designation: { id: string; name: string }) => void;
}

export function DesignationDetailsPanel({ designation, onEdit, onDelete }: DesignationDetailsPanelProps) {
  if (!designation) {
    return (
      <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
        <FiBriefcase className='mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600' />
        <p>Select a designation to view details</p>
      </div>
    );
  }

  return (
    <div className='p-4 space-y-4'>
      <div className='mb-2 flex items-start justify-between'>
        <h3 className='text-xl font-bold text-gray-900 dark:text-white'>{designation.name}</h3>
        <span className={`rounded-full px-2 py-1 text-xs ${designation.status ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"}`}>
          {designation.status ? "Active" : "Inactive"}
        </span>
      </div>
      <DetailItem label='Parent Designation' value={designation.parent_designation?.name} />

      <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
        <div className='flex gap-2'>
          <button
            onClick={() => onEdit(designation)}
            className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'>
            <FiEdit3 className='h-4 w-4' /> Edit
          </button>
          <button
            onClick={() => onDelete({ id: designation.id, name: designation.name })}
            className='flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'>
            <FiTrash2 className='h-4 w-4' /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}