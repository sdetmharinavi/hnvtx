// components/AreaTreeItem.tsx
"use client";

import { MaintenanceAreaWithRelations } from "@/components/maintenance-areas/maintenance-areas-types";
import { FiChevronDown, FiChevronRight, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { LuBuilding2 } from "react-icons/lu";

interface AreaTreeItemProps {
  area: MaintenanceAreaWithRelations;
  level: number;
  selectedAreaId: string | null;
  expandedAreas: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleStatus: (e: React.MouseEvent, area: MaintenanceAreaWithRelations) => void;
  isLoading: boolean;
}

export function AreaTreeItem({
  area,
  level,
  selectedAreaId,
  expandedAreas,
  onSelect,
  onToggleExpand,
  onToggleStatus,
  isLoading
}: AreaTreeItemProps) {
  const hasChildren = area.child_areas.length > 0;
  const isSelected = selectedAreaId === area.id;
  const isExpanded = expandedAreas.has(area.id);
  
  // Responsive padding calculation
  const basePadding = 12; // Base padding for mobile
  const levelIndent = level * (window?.innerWidth < 640 ? 16 : 24); // Smaller indent on mobile
  const totalPadding = basePadding + levelIndent;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div
        className={`flex cursor-pointer items-center py-3 px-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isSelected 
            ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800" 
            : "border-l-4 border-l-transparent"
        }`}
        style={{ paddingLeft: `${totalPadding}px` }}
        onClick={() => onSelect(area.id)}
      >
        {/* Main content area */}
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onToggleExpand(area.id); 
              }} 
              className="rounded p-1.5 sm:p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <FiChevronDown className="h-4 w-4 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
              ) : (
                <FiChevronRight className="h-4 w-4 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 sm:w-6 flex-shrink-0" />
          )}

          {/* Building icon */}
          <LuBuilding2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />

          {/* Area information */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate leading-tight">
              {area.name}
            </h3>
            
            {/* Area metadata - responsive layout */}
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 sm:gap-4">
                {area.code && (
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0">
                    {area.code}
                  </span>
                )}
                {area.area_type && (
                  <span className="font-medium truncate">
                    {area.area_type.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status toggle button */}
        <button 
          onClick={(e) => onToggleStatus(e, area)} 
          disabled={isLoading} 
          className="ml-2 sm:ml-auto p-1.5 sm:p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation disabled:opacity-50"
          aria-label={`Toggle status ${area.status ? 'off' : 'on'}`}
        >
          {area.status ? (
            <FiToggleRight className="h-5 w-5 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
          ) : (
            <FiToggleLeft className="h-5 w-5 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      </div>

      {/* Child areas */}
      {isExpanded && hasChildren && (
        <div className="bg-gray-25 dark:bg-gray-900/20">
          {area.child_areas.map(child => (
            <AreaTreeItem
              key={child.id}
              area={child}
              level={level + 1}
              selectedAreaId={selectedAreaId}
              expandedAreas={expandedAreas}
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