// path: components/system-details/StatsConfigModal.tsx
"use client";

import React, { useMemo } from 'react';
import { Modal, Button } from '@/components/common/ui';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { Check, X } from 'lucide-react';

export interface StatsFilterState {
  includeAdminDown: boolean;
  selectedCapacities: string[]; // Empty means ALL
  selectedTypes: string[];      // Empty means ALL
}

interface StatsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  ports: V_ports_management_completeRowSchema[];
  filters: StatsFilterState;
  onApply: (newFilters: StatsFilterState) => void;
}

export const StatsConfigModal: React.FC<StatsConfigModalProps> = ({
  isOpen,
  onClose,
  ports,
  filters,
  onApply
}) => {
  const [localFilters, setLocalFilters] = React.useState<StatsFilterState>(filters);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (isOpen) setLocalFilters(filters);
  }, [isOpen, filters]);

  // Extract unique options from available ports
  const options = useMemo(() => {
    const caps = new Set<string>();
    const types = new Set<string>();

    ports.forEach(p => {
      if (p.port_capacity) caps.add(p.port_capacity);
      const typeLabel = p.port_type_code || p.port_type_name || "Unknown";
      types.add(typeLabel);
    });

    return {
      capacities: Array.from(caps).sort(),
      types: Array.from(types).sort()
    };
  }, [ports]);

  const toggleCapacity = (cap: string) => {
    setLocalFilters(prev => {
      const current = prev.selectedCapacities;
      const exists = current.includes(cap);
      return {
        ...prev,
        selectedCapacities: exists
          ? current.filter(c => c !== cap)
          : [...current, cap]
      };
    });
  };

  const toggleType = (type: string) => {
    setLocalFilters(prev => {
      const current = prev.selectedTypes;
      const exists = current.includes(type);
      return {
        ...prev,
        selectedTypes: exists
          ? current.filter(t => t !== type)
          : [...current, type]
      };
    });
  };

  const handleSave = () => {
    onApply(localFilters);
    onClose();
  };

  const clearAll = () => {
    setLocalFilters({
      includeAdminDown: true,
      selectedCapacities: [],
      selectedTypes: []
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Statistics Calculation" size="md">
      <div className="space-y-6 p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
          Select which ports to include in the utilization and count statistics. Unchecked items will be ignored in calculations.
        </div>

        {/* 1. Status Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Operational Status
          </h4>
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
              localFilters.includeAdminDown
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-400 bg-white dark:bg-gray-700'
            }`}>
              {localFilters.includeAdminDown && <Check size={14} />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={localFilters.includeAdminDown}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, includeAdminDown: e.target.checked }))}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Include Admin Down</span>
              <span className="text-xs text-gray-500">Ports that are administratively disabled</span>
            </div>
          </label>
        </div>

        {/* 2. Capacity Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Port Capacity
            </h4>
            <span className="text-xs text-gray-500">
              {localFilters.selectedCapacities.length === 0 ? "Including All" : `${localFilters.selectedCapacities.length} Selected`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.capacities.map(cap => {
              const isSelected = localFilters.selectedCapacities.length === 0 || localFilters.selectedCapacities.includes(cap);
              // Visual logic: If array is empty, everything is "technically" selected logically, but for UI toggling:
              // - If array empty: Show all as selected or show "All" badge?
              // Standard Filter Logic: Empty = All. Clicking one switches to specific mode.
              const isActive = localFilters.selectedCapacities.includes(cap);

              return (
                <button
                  key={cap}
                  onClick={() => toggleCapacity(cap)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span>{cap}</span>
                  {isActive && <Check size={14} />}
                </button>
              );
            })}
          </div>
          {localFilters.selectedCapacities.length === 0 && (
             <p className="text-xs text-gray-400 italic">Select specific capacities to filter, otherwise all are included.</p>
          )}
        </div>

        {/* 3. Type Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Port Type
            </h4>
            <span className="text-xs text-gray-500">
              {localFilters.selectedTypes.length === 0 ? "Including All" : `${localFilters.selectedTypes.length} Selected`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.types.map(type => {
              const isActive = localFilters.selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                    isActive
                      ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-300'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="truncate pr-2">{type}</span>
                  {isActive && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
           <Button variant="ghost" size="sm" onClick={clearAll} className="text-gray-500">
              Reset to Default
           </Button>
           <div className="flex gap-2">
             <Button variant="outline" onClick={onClose}>Cancel</Button>
             <Button variant="primary" onClick={handleSave}>Apply Filters</Button>
           </div>
        </div>
      </div>
    </Modal>
  );
};