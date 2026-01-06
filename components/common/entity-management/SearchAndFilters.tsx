// components/common/entity-management/SearchAndFilters.tsx
import { BaseEntity, EntityConfig } from '@/components/common/entity-management/types';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar';
import { useMemo } from 'react';

interface SearchAndFiltersProps<T extends BaseEntity> {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFilters: boolean; // Kept for interface compatibility but controlled internally by GenericFilterBar
  onToggleFilters: () => void; // Kept for compatibility
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClearFilters: () => void;
  config: EntityConfig<T>;
}

export function SearchAndFilters<T extends BaseEntity>({
  searchTerm,
  onSearchChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showFilters, // GenericFilterBar handles visibility internally
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleFilters,
  filters,
  onFilterChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearFilters, // GenericFilterBar handles clear via onFilterChange(key, null)
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
      placeholder: `All ${option.label}s`,
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
