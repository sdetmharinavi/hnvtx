import { Categories } from '@/components/categories/categories-types';

export function formatCategoryName(category: Categories): string {
  return category.category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
