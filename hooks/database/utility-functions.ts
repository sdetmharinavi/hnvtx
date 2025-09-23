/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryKey } from '@tanstack/react-query';
import {
  AggregationOptions,
  DeduplicationOptions,
  EnhancedOrderBy,
  FilterOperator,
  Filters,
  OrderBy,
  PerformanceOptions,
} from './queries-type-helpers';
import { Json } from '@/types/supabase-types';
// The rich 'Filters' type is no longer needed for the RPCs.
// We'll define a simpler type.
export type RpcFilters = Record<string, string | number | boolean | string[] | null>;

/**
 * Converts a filter object from the UI into a simple JSON object
 * suitable for our generic RPC functions.
 *
 * @param filters The filter object from the UI state.
 * @returns A Json-compatible object.
 */
export function buildRpcFilters(filters: RpcFilters): Json {
  const rpcFilters: { [key: string]: Json | undefined } = {};

  for (const key in filters) {
    const filterValue = filters[key];

    // Only include filters that have a meaningful value
    if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
      rpcFilters[key] = filterValue as Json;
    }
  }

  // Special handling for the 'or' filter, which should be a string
  if (filters.or && typeof filters.or === 'string') {
    rpcFilters.or = filters.or;
  }

  return rpcFilters;
}

// // Usage example:
// const myFilters: RpcFilters = {
//   status: true,
//   name: 'Central', // For ILIKE
//   node_type_id: ['uuid1', 'uuid2'], // For IN
//   // For a complex OR, you would construct the PostgREST string
//   or: '(maintenance_area_name.ilike.*North*,code.eq.NRT)'
// };

// --- UTILITY FUNCTIONS ---
export const createQueryKey = (
  tableName: string,
  filters?: Filters,
  columns?: string,
  orderBy?: OrderBy[],
  deduplication?: DeduplicationOptions,
  aggregation?: AggregationOptions,
  enhancedOrderBy?: EnhancedOrderBy[],
  limit?: number,
  offset?: number
): QueryKey => {
  const key: unknown[] = ['table', tableName];
  const params: Record<string, unknown> = {
    filters,
    columns,
    orderBy,
    deduplication,
    aggregation,  
    enhancedOrderBy,
    limit,
    offset,
  };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createRpcQueryKey = (
  functionName: string,
  args?: Record<string, unknown>,
  performance?: PerformanceOptions
): QueryKey => {
  const key: unknown[] = ['rpc', functionName];
  const params = { args, performance };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createUniqueValuesKey = (
  tableName: string,
  column: string,
  filters?: Filters,
  orderBy?: OrderBy[],
  enhancedOrderBy?: EnhancedOrderBy[]
): QueryKey => [
  'unique',
  tableName,
  column,
  { filters, orderBy, enhancedOrderBy }
];

export function applyFilters(query: any, filters: Filters): any {
  let modifiedQuery = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === '$or' || key === 'or') {
      if (typeof value === 'string') {
        modifiedQuery = modifiedQuery.or(value);
      } else {
        console.warn('Unsupported $or filter format; expected a raw string.');
      }
      return;
    }

    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'operator' in value
    ) {
      const { operator, value: filterValue } = value as {
        operator: FilterOperator;
        value: unknown;
      };

      if (
        operator in modifiedQuery &&
        typeof (modifiedQuery as any)[operator] === 'function'
      ) {
        modifiedQuery = modifiedQuery[operator](key, filterValue);
      } else {
        console.warn(`Unsupported or dynamic operator used: ${operator}`);
      }
    } else if (Array.isArray(value)) {
      modifiedQuery = modifiedQuery.in(key, value);
    } else {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  return modifiedQuery;
}

// Enhanced version with better type safety and validation
export function applyOrdering(query: any, orderBy: OrderBy[]): any {
  let modifiedQuery = query;

  orderBy.forEach(({ column, ascending = true, nullsFirst, foreignTable }) => {
    // Validate column name to prevent injection
    if (!column || typeof column !== 'string') {
      console.warn(`Invalid column name: ${column}`);
      return;
    }

    // Build the column reference
    const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;

    // Build options object
    const options: { ascending: boolean; nullsFirst?: boolean } = { ascending };
    if (nullsFirst !== undefined) {
      options.nullsFirst = nullsFirst;
    }

    try {
      modifiedQuery = modifiedQuery.order(orderColumn, options);
    } catch (error) {
      console.error(`Error applying order by ${orderColumn}:`, error);
      // Continue with other orderings even if one fails
    }
  });

  return modifiedQuery;
}

// Alternative version with more explicit type handling for EnhancedOrderBy
export function applyEnhancedOrdering(
  query: any,
  orderBy: EnhancedOrderBy[]
): any {
  let modifiedQuery = query;

  orderBy.forEach(
    ({ column, ascending = true, nullsFirst, foreignTable, dataType }) => {
      // Validate column name to prevent injection
      if (!column || typeof column !== 'string') {
        console.warn(`Invalid column name: ${column}`);
        return;
      }

      const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;

      const options: any = { ascending };
      if (nullsFirst !== undefined) {
        options.nullsFirst = nullsFirst;
      }

      // Optional: Add type-specific handling
      if (dataType) {
        switch (dataType) {
          case 'numeric':
            // Supabase handles numeric sorting automatically
            break;
          case 'text':
            // For case-insensitive text sorting, you'd need custom SQL
            // This is handled at the PostgreSQL level
            break;
          case 'date':
          case 'timestamp':
            // Date sorting is handled well by default
            break;
          default:
            break;
        }
      }

      try {
        modifiedQuery = modifiedQuery.order(orderColumn, options);
      } catch (error) {
        console.error(
          `Error applying enhanced order by ${orderColumn}:`,
          error
        );
      }
    }
  );

  return modifiedQuery;
}

export function buildDeduplicationQuery(
  tableName: string,
  deduplication: DeduplicationOptions,
  filters?: Filters,
  orderBy?: OrderBy[]
): string {
  const { columns, orderBy: dedupOrderBy } = deduplication;
  const partitionBy = columns.join(', ');
  const rowNumberOrder = dedupOrderBy?.length
    ? dedupOrderBy
        .map((o) => `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}`)
        .join(', ')
    : 'id ASC';

  let finalOrderClause = '';
  if (orderBy && orderBy.length > 0) {
    const orderParts = orderBy.map(
      (o) =>
        `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}${
          o.nullsFirst !== undefined
            ? o.nullsFirst
              ? ' NULLS FIRST'
              : ' NULLS LAST'
            : ''
        }`
    );
    finalOrderClause = `ORDER BY ${orderParts.join(', ')}`;
  }

  let whereClause = '';
  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'operator' in value
        ) {
          const filterValue =
            typeof value.value === 'string'
              ? `'${value.value.toString().replace(/'/g, "''")}'`
              : value.value;
          return `${key} = ${filterValue}`;
        }
        if (Array.isArray(value)) {
          const arrayValues = value
            .map((v) =>
              typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
            )
            .join(',');
          return `${key} IN (${arrayValues})`;
        }
        const filterValue =
          typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        return `${key} = ${filterValue}`;
      });

    if (conditions.length > 0)
      whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  return `
    WITH deduplicated AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionBy} ORDER BY ${rowNumberOrder}) as rn
      FROM ${tableName}
      ${whereClause}
    )
    SELECT * FROM deduplicated WHERE rn = 1 ${finalOrderClause}
  `;
}

/**
 * Converts a rich "Filters" object (used by the PostgREST query builder)
 * into a simple key-value JSON object suitable for RPC functions.
 * It strips out complex operators and preserves simple values.
 *
 * @param filters The rich Filters object.
 * @returns A Json-compatible object.
 */
export function convertRichFiltersToSimpleJson(filters: Filters): Json {
  const simpleFilters: { [key: string]: Json | undefined } = {};

  for (const key in filters) {
    // Skip the client-side only '$or' operator
    if (key === '$or') {
      continue;
    }

    const filterValue = filters[key];

    // Check if the value is a simple primitive (string, number, boolean, or null)
    if (
      typeof filterValue === 'string' ||
      typeof filterValue === 'number' ||
      typeof filterValue === 'boolean' ||
      filterValue === null
    ) {
      simpleFilters[key] = filterValue;
    }
    // You can also handle simple arrays if your RPCs support the 'IN' operator
    else if (Array.isArray(filterValue)) {
      simpleFilters[key] = filterValue;
    }
    // We explicitly IGNORE complex objects like { operator: 'neq', value: '...' }
    // because the RPC function doesn't know how to handle them.
  }

  return simpleFilters;
}
