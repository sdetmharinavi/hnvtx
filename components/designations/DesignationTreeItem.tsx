
import { DesignationWithRelations } from "@/components/designations/designationTypes";
import { FiBriefcase, FiChevronDown, FiChevronRight, FiToggleLeft, FiToggleRight } from "react-icons/fi";

interface DesignationTreeItemProps {
  designation: DesignationWithRelations;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleStatus: (e: React.MouseEvent, designation: DesignationWithRelations) => void;
  isLoading: boolean;
}

export function DesignationTreeItem({
  designation,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onToggleStatus,
  isLoading,
}: DesignationTreeItemProps) {
  return (
    <div className='border-b border-gray-100 dark:border-gray-700 last:border-b-0'>
      <div
        className={`flex cursor-pointer items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800" : "border-l-4 border-l-transparent"}`}
        style={{ paddingLeft: `${16 + level * 24}px` }}
        onClick={() => onSelect(designation.id)}>
        <div className='flex flex-1 items-center gap-2 truncate'>
          {designation.child_designations.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(designation.id);
              }}
              className='rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700'>
              {isExpanded ? <FiChevronDown className='h-4 w-4 text-gray-400 dark:text-gray-500' /> : <FiChevronRight className='h-4 w-4 text-gray-400 dark:text-gray-500' />}
            </button>
          ) : (
            <div className='w-6' />
          )}
          <FiBriefcase className='h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500' />
          <div className='flex-1 truncate'>
            <h3 className='font-medium text-gray-900 dark:text-gray-100 truncate'>{designation.name}</h3>
          </div>
        </div>
        <button onClick={(e) => onToggleStatus(e, designation)} disabled={isLoading} className='ml-auto'>
          {designation.status ? <FiToggleRight className='h-5 w-5 text-green-500 dark:text-green-400' /> : <FiToggleLeft className='h-5 w-5 text-gray-400 dark:text-gray-500' />}
        </button>
      </div>
      {isExpanded && designation.child_designations.length > 0 && (
        <div>
          {designation.child_designations.map((child) => (
            <DesignationTreeItem
              key={child.id}
              designation={child}
              level={level + 1}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onToggleStatus={onToggleStatus}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}