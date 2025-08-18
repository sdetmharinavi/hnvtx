# DRY Guide: Building Data Pages (based on Rings & Employees)

This guide outlines patterns from `app/dashboard/rings/page.tsx` and `app/dashboard/employees/page.tsx` to help build future CRUD/data pages with minimal duplication.

## Core Building Blocks

- __Data access hooks__ (`@/hooks/database`):
  - `useTableQuery()` for simple tables.
  - `useTableWithRelations()` when joining related tables (e.g., rings with lookup types and maintenance areas).
  - Mutations: `useTableInsert()`, `useTableUpdate()`, `useTableDelete()`, `useToggleStatus()`.
- __Table layer__ (`@/components/table/DataTable`):
  - Supports pagination, actions, selection, custom toolbar, export.
  - Columns defined separately per entity.
- __Columns__:
  - Employees: `components/employee/EmployeeTableColumns.tsx` via `getEmployeeTableColumns()`.
- __Filters UI__:
  - Employees: `components/employee/EmployeeFilters.tsx` (search + dropdowns), typed by `components/employee/employee-types.ts`.
- __Modals / Forms__:
  - Employees: `components/employee/EmployeeForm.tsx` and `EmployeeDetailsModal.tsx`.

## Page Skeleton Template

1) __State__

- Pagination: `currentPage`, `pageLimit`.
- Filters: local UI state -> derived server filters (memoized).
- Debounced search: `useDebounce`/`useDebouncedCallback`.
- Selection (optional): selected IDs.
- Modal state: add/edit/view flags.

2) __Filters -> Server Filters__

- Keep a small UI type, e.g. `EmployeeFilters` with string fields.
- Derive DB filters with `useMemo`, convert empty to undefined.
- Example: employees maps `status` string to boolean.

3) __Data Fetch__

- Prefer `useTableQuery` for single-table lists.
- Use `useTableWithRelations` for joined displays (e.g., rings shows related `lookup_types` and `maintenance_areas`).
- Always pass `orderBy`, `limit`, `offset`.

4) __Total Count Strategy__

- If your hooks provide window `total_count`, read it.
- Fallback to HEAD count: `supabase.from(table).select("id", { count: "exact", head: true })`.
- Use max(windowCount, headCount, pageLen) to avoid undercount.

5) __Columns__

- Define per-entity `getXTableColumns()` function in a colocated `components/<entity>/` file.
- Use `Row<"table">` for types; for relations, use custom `render` functions casting as needed.
- Centralize formatting (e.g., `formatDate`) in `@/utils/formatters`.

6) __Actions__

- Build an array of row actions with keys, labels, icons, and `hidden` predicates.
- Use shared mutation hooks (toggle status, delete) and wrap confirmations in a generic modal (`ConfirmModal`).

7) __Toolbar__

- Compose filters component into a `customToolbar` for the `DataTable`.
- Leave `searchable=false` and `filterable=false` on `DataTable` if filtering handled externally.

8) __Modals / Forms__

- Add/Edit: open with `editingRecord` or `null` for create.
- On success, `refetch()` and close modal.

## Suggested Abstractions to Reuse

- __ListPageTemplate__ (optional HOC or component):
  - Props: `tableName`, `columns`, `queryHook`, `filtersUI`, `rowActions`, `header`, `exportOptions?`.
  - Internally handle pagination, debounced search, count calculation, and render `DataTable` with `customToolbar`.
- __FilterBuilder__ helpers:
  - Map UI filters to DB filters (e.g., `status: "true" | "false" | "" -> boolean | undefined`).
- __Lookup maps__ utilities:
  - `toIdNameMap(rows)` for fast rendering of related names in tables.

## Minimal Step-by-Step for a New Page

1. __Create columns__ in `components/<entity>/<Entity>TableColumns.ts(x)`.
2. __Create filters UI__ in `components/<entity>/<Entity>Filters.tsx` if needed.
3. __Create form/modal__ for add/edit if page is editable.
4. __Implement page__ `app/dashboard/<entity>/page.tsx`:
   - Local state: pagination, filters, modal flags.
   - Derive server filters via `useMemo`.
   - Fetch data with `useTableQuery` or `useTableWithRelations`.
   - Compute `totalCount` using window count + HEAD fallback.
   - Assemble `columns`, `actions`, and `customToolbar`.
   - Render `DataTable` with pagination handlers.
5. __Wire mutations__ via `useTableInsert`, `useTableUpdate`, `useTableDelete`, `useToggleStatus`.
6. __Test__ pagination, filtering, create/update/delete, toggling status.

## Example References

- Employees Page: `app/dashboard/employees/page.tsx`
  - Filters: `components/employee/EmployeeFilters.tsx`
  - Columns: `components/employee/EmployeeTableColumns.tsx`
  - Form/Details: `components/employee/EmployeeForm.tsx`, `EmployeeDetailsModal.tsx`

## Conventions

- Keep entity-specific code under `components/<entity>/`.
- Keep page logic under `app/dashboard/<entity>/page.tsx`.
- Use Tailwind utilities consistently; encapsulate repeated UI in shared components.
- Keep icons in page/components, not mixed into hooks.

## Checklist

- [X] Columns defined and typed
- [X] Filters UI working and mapped to DB
- [ ] Pagination state + handlers
- [ ] Accurate total count
- [ ] Row actions wired
- [ ] Modals open/close, refetch on success
- [ ] No duplicate logic (extract helpers if repeated)
