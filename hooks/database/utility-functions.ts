// hooks/database/utility-functions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryKey } from "@tanstack/react-query";
import {
  AggregationOptions,
  DeduplicationOptions,
  EnhancedOrderBy,
  FilterOperator,
  Filters,
  OrderBy,
} from './queries-type-helpers';
import { Json } from '@/types/supabase-types';

export function buildRpcFilters(filters: Filters): Json {
  const rpcFilters: { [key: string]: Json | undefined } = {};

  for (const key in filters) {
    const filterValue = filters[key];

    // FIX: Correctly handle 'or' filter.
    // If it's an object (Record<string, string>), pass it as a JSON object.
    // If it's a string, pass it as a string.
    if (key === 'or') {
       if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
         rpcFilters.or = filterValue as unknown as Json;
       } else if (typeof filterValue === 'string' && filterValue.trim() !== '') {
          rpcFilters.or = filterValue;
       }
       continue;
    }

    if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
      rpcFilters[key] = filterValue as Json;
    }
  }

  return rpcFilters;
}

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
  const params: Record<string, unknown> = { filters, columns, orderBy, deduplication, aggregation, enhancedOrderBy, limit, offset };
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createRpcQueryKey = (
  functionName: string,
  args?: Record<string, unknown>,
  performance?: any,
): QueryKey => {
  const key: unknown[] = ['rpc', functionName];
  const params = { args, performance };
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createUniqueValuesKey = (
  tableName: string,
  column: string,
  filters?: Filters,
  orderBy?: OrderBy[],
  enhancedOrderBy?: EnhancedOrderBy[]
): QueryKey => ['unique', tableName, column, { filters, orderBy, enhancedOrderBy }];

export function applyFilters(query: any, filters: Filters): any {
  let modifiedQuery = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'or') {
      if (typeof value === 'string' && value.trim() !== '') {
        const orConditions = value.replace(/[()]/g, '');
        if (orConditions) {
          modifiedQuery = modifiedQuery.or(orConditions);
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const orConditions = Object.entries(value)
          .map(([col, val]) => `${col}.ilike.%${String(val).replace(/%/g, '')}%`)
          .join(',');
        if (orConditions) {
          modifiedQuery = modifiedQuery.or(orConditions);
        }
      }
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value) && 'operator' in value) {
      const { operator, value: filterValue } = value as { operator: FilterOperator; value: unknown };
      if (operator in modifiedQuery && typeof (modifiedQuery as any)[operator] === 'function') {
        modifiedQuery = modifiedQuery[operator](key, filterValue);
      }
    } else if (Array.isArray(value)) {
      modifiedQuery = modifiedQuery.in(key, value);
    } else {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  return modifiedQuery;
}

export function applyOrdering(query: any, orderBy: OrderBy[]): any {
  let modifiedQuery = query;
  orderBy.forEach(({ column, ascending = true, nullsFirst, foreignTable }) => {
    if (!column || typeof column !== 'string') return;
    const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;
    const options: { ascending: boolean; nullsFirst?: boolean } = { ascending };
    if (nullsFirst !== undefined) {
      options.nullsFirst = nullsFirst;
    }
    try {
      modifiedQuery = modifiedQuery.order(orderColumn, options);
    } catch (error) {
      console.error(`Error applying order by ${orderColumn}:`, error);
    }
  });
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

export function convertRichFiltersToSimpleJson(filters: Filters): Json {
  const simpleFilters: { [key: string]: Json | undefined } = {};
  for (const key in filters) {
    if (key === 'or' && typeof filters.or === 'object' && filters.or !== null) {
      const orConditions = Object.entries(filters.or)
        .map(([col, val]) => `${col}.ilike.%${String(val).replace(/%/g, '')}%`)
        .join(',');
      if (orConditions) {
        simpleFilters.or = `(${orConditions})`;
      }
      continue;
    }
    const filterValue = filters[key];
    if (
      typeof filterValue === 'string' ||
      typeof filterValue === 'number' ||
      typeof filterValue === 'boolean' ||
      filterValue === null
    ) {
      simpleFilters[key] = filterValue;
    } else if (Array.isArray(filterValue)) {
      simpleFilters[key] = filterValue;
    }
  }
  return simpleFilters;
}