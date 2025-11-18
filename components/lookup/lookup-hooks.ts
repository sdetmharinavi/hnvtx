// components/lookup/lookup-hooks.ts
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * A simplified hook that provides only the category selection and routing logic for the Lookups page.
 * All data fetching and CRUD actions are now handled by useCrudManager on the page itself.
 */
export function useLookupActions() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = useCallback(
    (category: string) => {
      const newPath = `/dashboard/lookup${category ? `?category=${category}` : ''}`;
      router.push(newPath);
    },
    [router]
  );

  return {
    handlers: {
      handleCategoryChange,
    },
    selectedCategory: searchParams.get('category') || '',
  };
}