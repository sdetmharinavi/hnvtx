// hooks/data/useNotesData.ts
import { createGenericDataQuery } from './useGenericDataQuery';

export const useNotesData = createGenericDataQuery<'v_technical_notes'>({
  tableName: 'v_technical_notes',
  searchFields: ['title', 'content', 'author_name', 'author_email'],
  defaultSortField: 'created_at',
  orderBy: 'desc',
  // rpcLimit removed
  activeStatusField: 'is_published',
  filterFn: (note, filters) => {
    if (filters.is_published) {
      const isPublished = filters.is_published === 'true';
      if (note.is_published !== isPublished) return false;
    }
    if (filters.author_id && note.author_id !== filters.author_id) return false;
    return true;
  },
});