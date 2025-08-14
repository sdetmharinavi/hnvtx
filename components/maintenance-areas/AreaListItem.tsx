// components/AreaListItem.tsx
"use client";


import { MaintenanceAreaWithRelations } from "@/components/maintenance-areas/maintenance-areas-types";
import { FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { LuBuilding2 } from "react-icons/lu";

interface AreaListItemProps {
  area: MaintenanceAreaWithRelations;
  selectedAreaId: string | null;
  onSelect: (id: string) => void;
  onToggleStatus: (e: React.MouseEvent, area: MaintenanceAreaWithRelations) => void;
  isLoading: boolean;
}

export function AreaListItem({
  area,
  selectedAreaId,
  onSelect,
  onToggleStatus,
  isLoading
}: AreaListItemProps) {
  return (
    <div
      key={`list-${area.id}`}
      className={`cursor-pointer border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
        selectedAreaId === area.id 
          ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800" 
          : "border-l-4 border-l-transparent"
      }`}
      onClick={() => onSelect(area.id)}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <LuBuilding2 className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            <h3 className='font-medium text-gray-900 dark:text-gray-100'>{area.name}</h3>
            {area.code && (
              <span className='rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300'>
                {area.code}
              </span>
            )}
          </div>
          <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
            {area.area_type && <span className='font-medium'>{area.area_type.name}</span>}
            {area.parent_area && (
              <span className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
                Child of: {area.parent_area.name}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => onToggleStatus(e, area)} 
          disabled={isLoading}
        >
          {area.status ? (
            <FiToggleRight className='h-5 w-5 text-green-500 dark:text-green-400' />
          ) : (
            <FiToggleLeft className='h-5 w-5 text-gray-400 dark:text-gray-500' />
          )}
        </button>
      </div>
    </div>
  );
}