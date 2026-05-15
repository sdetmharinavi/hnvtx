// hooks/data/useCategoriesData.ts
'use client';

import { useMemo } from 'react';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { CategoryInfo, GroupedLookupsByCategory } from '@/components/categories/categories-types';
import { useQuery } from '@tanstack/react-query';

export function useCategoriesData() {
  const supabase = createClient();

  const {
    data: allLookups = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['categories-data-all'],
    queryFn: async (): Promise<Lookup_typesRowSchema[]> => {
      const { data, error } = await supabase
        .from('lookup_types')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  // Client-Side Processing (Deduplication & Grouping)
  const processedData = useMemo(() => {
    if (!allLookups)
      return {
        categories: [],
        groupedLookups: {} as GroupedLookupsByCategory,
        categoryCounts: {} as Record<string, CategoryInfo>,
      };

    // A. Group by Category
    const groupedLookups: GroupedLookupsByCategory = {};
    const categoryCounts: Record<string, CategoryInfo> = {};

    // Helper to track unique categories found
    const uniqueCategoriesMap = new Map<string, Lookup_typesRowSchema>();

    allLookups.forEach((lookup) => {
      const cat = lookup.category;
      if (!cat) return;

      // Grouping
      if (!groupedLookups[cat]) groupedLookups[cat] = [];
      groupedLookups[cat].push(lookup);

      // Deduplication (Keep the first one encountered as the "Representative")
      if (!uniqueCategoriesMap.has(cat)) {
        uniqueCategoriesMap.set(cat, lookup);
      }
    });

    // B. Calculate Counts
    Object.keys(groupedLookups).forEach((cat) => {
      const lookups = groupedLookups[cat];
      categoryCounts[cat] = {
        name: cat,
        lookupCount: lookups.length,
        hasSystemDefaults: lookups.some((l) => l.is_system_default),
      };
    });

    // C. Sort Categories Alphabetically
    const categories = Array.from(uniqueCategoriesMap.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );

    return { categories, groupedLookups, categoryCounts };
  }, [allLookups]);

  return {
    ...processedData,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}