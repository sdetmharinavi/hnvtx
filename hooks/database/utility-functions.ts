/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryKey } from "@tanstack/react-query";
import { AggregationOptions, DeduplicationOptions, FilterOperator, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { Json } from "@/types/supabase-types";

// --- UTILITY FUNCTIONS ---
export const createQueryKey = (
  tableName: string,
  filters?: Filters,
  columns?: string,
  orderBy?: OrderBy[],
  deduplication?: DeduplicationOptions,
  aggregation?: AggregationOptions,
  limit?: number,
  offset?: number
): QueryKey => {
  const key: unknown[] = ["table", tableName];
  const params: Record<string, unknown> = { filters, columns, orderBy, deduplication, aggregation, limit, offset };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createRpcQueryKey = (functionName: string, args?: Record<string, unknown>, performance?: PerformanceOptions): QueryKey => {
  const key: unknown[] = ["rpc", functionName];
  const params = { args, performance };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createUniqueValuesKey = (tableName: string, column: string, filters?: Filters, orderBy?: OrderBy[]): QueryKey => ["unique", tableName, column, { filters, orderBy }];

// export function applyFilters(query: any, filters: Filters): any {
//   let modifiedQuery = query;
//   Object.entries(filters).forEach(([key, value]) => {
//     if (value === undefined || value === null) return;

//     // Support raw OR conditions: pass a prebuilt PostgREST or() string
//     if (key === "$or") {
//       if (typeof value === "string" && typeof modifiedQuery.or === "function") {
//         modifiedQuery = modifiedQuery.or(value);
//       } else if (
//         typeof value === "object" && !Array.isArray(value) && "operator" in value && (value as any).operator === "or"
//       ) {
//         const v = (value as any).value;
//         if (typeof v === "string" && typeof modifiedQuery.or === "function") {
//           modifiedQuery = modifiedQuery.or(v);
//         } else {
//           console.warn("$or filter value must be a string representing PostgREST conditions");
//         }
//       } else {
//         console.warn("Unsupported $or filter format; expected string or { operator: 'or', value: string }");
//       }
//       return;
//     }

//     if (typeof value === "object" && !Array.isArray(value) && "operator" in value) {
//       const { operator, value: filterValue } = value as { operator: FilterOperator; value: unknown };
//       if (operator === "or" && typeof filterValue === "string" && typeof modifiedQuery.or === "function") {
//         modifiedQuery = modifiedQuery.or(filterValue as string);
//       } else if (operator in modifiedQuery && typeof (modifiedQuery as any)[operator] === 'function') {
//         modifiedQuery = modifiedQuery[operator](key, filterValue);
//       } else {
//         console.warn(`Unsupported or dynamic operator used: ${operator}`);
//       }
//     } else if (Array.isArray(value)) {
//       modifiedQuery = modifiedQuery.in(key, value);
//     } else {
//       modifiedQuery = modifiedQuery.eq(key, value);
//     }
//   });
//   return modifiedQuery;
// }

export function applyFilters(query: any, filters: Filters): any {
  let modifiedQuery = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "$or") {
      if (typeof value === "string") {
        modifiedQuery = modifiedQuery.or(value);
      } else {
        console.warn("Unsupported $or filter format; expected a raw string.");
      }
      return;
    }

    if (typeof value === "object" && !Array.isArray(value) && "operator" in value) {
      const { operator, value: filterValue } = value as { operator: FilterOperator; value: unknown };
      
      // --- START OF THE FIX ---
      // For operators like 'in' and 'not.in', the Supabase client expects the
      // value to be a single string in the format '(item1,item2,...)'.
      // We no longer need a complex switch statement.

      if (operator in modifiedQuery && typeof (modifiedQuery as any)[operator] === 'function') {
        // This now works for operators like 'eq', 'gt', 'ilike', etc.
        // AND it works for 'in' and 'not.in' because we pass the pre-formatted string directly.
        modifiedQuery = modifiedQuery[operator](key, filterValue);
      } else {
        console.warn(`Unsupported or dynamic operator used: ${operator}`);
      }
      // --- END OF THE FIX ---

    } else if (Array.isArray(value)) {
      // This handles cases where the filter value is already an array, which is also valid for .in()
      modifiedQuery = modifiedQuery.in(key, value);
    } else {
      // Default to exact match
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  return modifiedQuery;
}

export function applyOrdering(query: any, orderBy: OrderBy[]): any {
  let modifiedQuery = query;
  orderBy.forEach(({ column, ascending = true, nullsFirst, foreignTable }) => {
    const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;
    const options: { ascending: boolean; nullsFirst?: boolean } = { ascending };
    if (nullsFirst !== undefined) options.nullsFirst = nullsFirst;
    modifiedQuery = modifiedQuery.order(orderColumn, options);
  });
  return modifiedQuery;
}

export function buildDeduplicationQuery(tableName: string, deduplication: DeduplicationOptions, filters?: Filters, orderBy?: OrderBy[]): string {
  const { columns, orderBy: dedupOrderBy } = deduplication;
  const partitionBy = columns.join(', ');
  const rowNumberOrder = dedupOrderBy?.length
    ? dedupOrderBy.map(o => `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}`).join(', ')
    : 'id ASC';

  let finalOrderClause = '';
  if (orderBy && orderBy.length > 0) {
    const orderParts = orderBy.map(o =>
      `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}${o.nullsFirst !== undefined ? (o.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST') : ''}`
    );
    finalOrderClause = `ORDER BY ${orderParts.join(', ')}`;
  }

  let whereClause = '';
  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null) // FIX: Ensure value is not null
      .map(([key, value]) => {
        // FIX: Added check for null on value before accessing properties
        if (value && typeof value === 'object' && !Array.isArray(value) && 'operator' in value) {
          const filterValue = typeof value.value === 'string' ? `'${value.value.toString().replace(/'/g, "''")}'` : value.value;
          return `${key} = ${filterValue}`;
        }
        if (Array.isArray(value)) {
          const arrayValues = value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(',');
          return `${key} IN (${arrayValues})`;
        }
        const filterValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        return `${key} = ${filterValue}`;
      });

    if (conditions.length > 0) whereClause = `WHERE ${conditions.join(' AND ')}`;
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