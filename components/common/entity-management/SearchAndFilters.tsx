// components/common/entity-management/SearchAndFilters.tsx
import { BaseEntity, EntityConfig } from '@/components/common/entity-management/types';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar';
import { useMemo } from 'react';

interface SearchAndFiltersProps<T extends BaseEntity> {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFilters: boolean; // Kept for interface compatibility
  onToggleFilters: () => void; // Kept for compatibility
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClearFilters: () => void;
  config: EntityConfig<T>;
}

// Helper for basic English pluralization
function getPluralLabel(label: string) {
  if (
    label.endsWith('s') ||
    label.endsWith('x') ||
    label.endsWith('z') ||
    label.endsWith('ch') ||
    label.endsWith('sh')
  ) {
    return label + 'es';
  }
  if (label.endsWith('y')) {
    const len = label.length;
    if (len > 1 && !['a', 'e', 'i', 'o', 'u'].includes(label[len - 2].toLowerCase())) {
      return label.substring(0, len - 1) + 'ies';
    }
  }
  return label + 's';
}

export function SearchAndFilters<T extends BaseEntity>({
  searchTerm,
  onSearchChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showFilters,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleFilters,
  filters,
  onFilterChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearFilters,
  config,
}: SearchAndFiltersProps<T>) {
  // Map the EntityConfig filter options to GenericFilterBar config
  const filterConfigs: FilterConfig[] = useMemo(() => {
    return config.filterOptions.map((option) => ({
      key: option.key,
      label: option.label,
      // Map entity config type to GenericFilterBar type
      type: option.type === 'select' ? 'native-select' : undefined,
      options: option.options || [],
      // THE FIX: Use smart pluralization function
      placeholder: `All ${getPluralLabel(option.label)}`,
    }));
  }, [config.filterOptions]);

  // Adapter to convert key/value pairs back to the filters object expected by parent
  const handleFilterChange = (key: string, value: string | null) => {
    const newFilters = { ...filters };
    if (value === null || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFilterChange(newFilters);
  };

  return (
    <GenericFilterBar
      searchQuery={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={`Search ${config.entityPluralName.toLowerCase()}...`}
      filters={filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
    />
  );
}
