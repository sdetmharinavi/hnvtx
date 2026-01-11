// hooks/data/useCategoriesData.ts
'use client';

import { useMemo, useCallback } from 'react';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { createClient } from '@/utils/supabase/client';
import { CategoryInfo, GroupedLookupsByCategory } from '@/components/categories/categories-types';

export function useCategoriesData() {
  const supabase = createClient();

  // 1. Online Fetcher (Fetch all lookup types)
  const onlineQueryFn = useCallback(async () => {
    const { data, error } = await supabase
      .from('lookup_types')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }, [supabase]);

  // 2. Offline Fetcher (Fetch all from Dexie)
  const localQueryFn = useCallback(() => {
    return localDb.lookup_types.orderBy('category').toArray();
  }, []);

  // 3. Local First Hook
  const {
    data: allLookups = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useLocalFirstQuery<'lookup_types'>({
    queryKey: ['categories-data-all'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.lookup_types,
  });

  // 4. Client-Side Processing (Deduplication & Grouping)
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

      // Deduplication (Keep the first one encountered as the "Representative" for the category list)
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
