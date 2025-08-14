
import { DesignationWithRelations } from "@/components/designations/designationTypes";
import { BiBriefcase, BiToggleLeft, BiToggleRight } from "react-icons/bi";

interface DesignationListItemProps {
  designation: DesignationWithRelations;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStatus: (e: React.MouseEvent, designation: DesignationWithRelations) => void;
  isLoading: boolean;
}

export function DesignationListItem({
  designation,
  isSelected,
  onSelect,
  onToggleStatus,
  isLoading,
}: DesignationListItemProps) {
  return (
    <div
      className={`cursor-pointer border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800" : "border-l-4 border-l-transparent"
      }`}
      onClick={() => onSelect(designation.id)}>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <BiBriefcase className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            <h3 className='font-medium text-gray-900 dark:text-gray-100'>{designation.name}</h3>
          </div>
          {designation.parent_designation && (
            <span className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
              Child of: {designation.parent_designation.name}
            </span>
          )}
        </div>
        <button onClick={(e) => onToggleStatus(e, designation)} disabled={isLoading}>
          {designation.status ? <BiToggleRight className='h-5 w-5 text-green-500 dark:text-green-400' /> : <BiToggleLeft className='h-5 w-5 text-gray-400 dark:text-gray-500' />}
        </button>
      </div>
    </div>
  );
}