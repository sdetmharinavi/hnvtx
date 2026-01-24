import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useNotesData = createGenericDataQuery<'v_technical_notes'>({
  tableName: 'v_technical_notes',
  searchFields: ['title', 'content', 'author_name', 'author_email'],
  defaultSortField: 'created_at',
  orderBy: 'desc',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (note, filters) => {
    // 1. Status Filter
    if (filters.is_published) {
      const isPublished = filters.is_published === 'true';
      if (note.is_published !== isPublished) return false;
    }

    // 2. Author Filter (if needed in future)
    if (filters.author_id && note.author_id !== filters.author_id) return false;

    return true;
  },
});