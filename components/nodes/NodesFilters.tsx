// components/nodes/NodesFilters.tsx
"use client";

import { memo } from "react";
import { FiSearch } from "react-icons/fi";
import { Input } from "@/components/common/ui/Input";
import { SearchableSelect, Option } from "@/components/common/ui/select/SearchableSelect";

interface NodesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // Node Types
  nodeTypes: Array<{ id: string; name: string }>;
  selectedNodeType?: string;
  onNodeTypeChange: (value: string | null) => void;
  // Maintenance Areas (New)
  maintenanceAreas: Array<{ id: string; name: string }>;
  selectedMaintenanceArea?: string;
  onMaintenanceAreaChange: (value: string | null) => void;
}

const NodesFiltersComponent = memo(({
  searchQuery,
  onSearchChange,
  nodeTypes,
  selectedNodeType = "",
  onNodeTypeChange,
  maintenanceAreas,
  selectedMaintenanceArea = "",
  onMaintenanceAreaChange
}: NodesFiltersProps) => {

  const nodeTypeOptions: Option[] = (nodeTypes || []).map((nt) => ({ value: nt.id, label: nt.name }));
  
  // Create options for Maintenance Areas
  const maintenanceAreaOptions: Option[] = (maintenanceAreas || []).map((ma) => ({ value: ma.id, label: ma.name }));

  return (
    <div className='w-full space-y-3 sm:space-y-0'>
      <div className='flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-start'>
        <div className='relative flex-1 sm:max-w-md lg:max-w-lg'>
          <Input
            type='text'
            placeholder='Search nodes...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400 dark:text-gray-500" />}
            clearable={true}
            onClear={() => onSearchChange("")}
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        
        {/* Node Type Filter */}
        <div className='w-full sm:w-56'>
          <SearchableSelect
            options={nodeTypeOptions}
            value={selectedNodeType}
            onChange={(v) => onNodeTypeChange(v)}
            placeholder='All Node Types'
            searchPlaceholder='Search types...'
            clearable={true}
          />
        </div>

        {/* Maintenance Area Filter */}
        <div className='w-full sm:w-64'>
          <SearchableSelect
            options={maintenanceAreaOptions}
            value={selectedMaintenanceArea}
            onChange={(v) => onMaintenanceAreaChange(v)}
            placeholder='All Maintenance Areas'
            searchPlaceholder='Search areas...'
            clearable={true}
          />
        </div>
      </div>
    </div>
  );
});

NodesFiltersComponent.displayName = "NodesFilters";
export const NodesFilters = NodesFiltersComponent;