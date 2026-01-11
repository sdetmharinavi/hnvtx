// hooks/database/search-utils.ts

/**
 * Constructs a SQL-compatible OR search string for Supabase RPCs.
 * Used for server-side filtering.
 *
 * @param query The search term entered by the user.
 * @param fields The list of database column names to search against.
 * @returns A string formatted for the `or` filter (e.g., "(name.ilike.%term%,code.ilike.%term%)") or undefined.
 */
export function buildServerSearchString(
  query: string | undefined,
  fields: string[]
): string | undefined {
  if (!query || query.trim() === '') return undefined;

  const term = query.trim().replace(/'/g, "''"); // Escape single quotes for SQL
  const conditions = fields.map((field) => {
    // Handle casting for non-text fields if hinted (e.g., "ip_address::text")
    // The field name passed in should already include the cast if needed
    return `${field} ILIKE '%${term}%'`;
  });

  return `(${conditions.join(' OR ')})`;
}

/**
 * Performs client-side filtering on an array of data.
 * Used for local/offline search responsiveness.
 *
 * @param data The array of records to filter.
 * @param query The search term.
 * @param fields The keys of the record object to check.
 * @returns The filtered array.
 */
export function performClientSearch<T>(
  data: T[],
  query: string | undefined,
  fields: (keyof T)[]
): T[] {
  if (!data || data.length === 0) return [];
  if (!query || query.trim() === '') return data;

  const lowerQuery = query.toLowerCase().trim();

  return data.filter((item) => {
    return fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
}

/**
 * Performs consistent client-side sorting.
 *
 * @param data The array of records to sort.
 * @param sortField The field to sort by.
 * @param direction 'asc' or 'desc'.
 * @returns The sorted array.
 */
export function performClientSort<T>(
  data: T[],
  sortField: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  if (!data) return [];

  const sorted = [...data].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    // Handle nulls: nulls always go last in this implementation
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    // String comparison using locale
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
    }

    // Number/Boolean comparison
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  });

  return direction === 'asc' ? sorted : sorted.reverse();
}

/**
 * Performs client-side pagination.
 *
 * @param data The filtered and sorted data array.
 * @param currentPage The current page number (1-based).
 * @param pageSize The number of items per page.
 * @returns The slice of data for the current page.
 */
export function performClientPagination<T>(data: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
}
