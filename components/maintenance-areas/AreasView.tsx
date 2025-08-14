// components/maintenance-areas/AreasView.tsx
import { MaintenanceAreaWithRelations } from "./maintenance-areas-types";
import { AreaTreeItem } from "./AreaTreeItem";
import { AreaListItem } from "./AreaListItem";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { useMemo } from "react";

interface AreasViewProps {
  areasQuery: UseQueryResult;
  allAreas: MaintenanceAreaWithRelations[];
  debouncedSearchTerm: string;
  viewMode: "list" | "tree";
  selectedAreaId: string | null;
  expandedAreas: Set<string>;
  setSelectedAreaId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  // Match the variables shape used by the toggle status mutation
  toggleStatusMutation: UseMutationResult<
    unknown,
    Error,
    {
      id: string;
      status: boolean;
      nameField?:
        | "email"
        | "address"
        | "code"
        | "status"
        | "created_at"
        | "id"
        | "name"
        | "parent_id"
        | "updated_at"
        | "area_type_id"
        | "contact_number"
        | "contact_person"
        | "latitude"
        | "longitude";
    },
    unknown
  >;
}

export function AreasView({
  areasQuery,
  allAreas,
  debouncedSearchTerm,
  viewMode,
  selectedAreaId,
  expandedAreas,
  setSelectedAreaId,
  toggleExpanded,
  toggleStatusMutation
}: AreasViewProps) {
  const searchedAreas = useMemo(() => {
    if (!debouncedSearchTerm) return allAreas;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return allAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(searchLower) ||
        area.code?.toLowerCase().includes(searchLower) ||
        area.contact_person?.toLowerCase().includes(searchLower) ||
        area.contact_number?.toLowerCase().includes(searchLower) ||
        area.email?.toLowerCase().includes(searchLower) ||
        area.address?.toLowerCase().includes(searchLower) ||
        area.latitude?.toLowerCase().includes(searchLower) ||
        area.longitude?.toLowerCase().includes(searchLower)
    );
  }, [allAreas, debouncedSearchTerm]);

  const hierarchicalAreas = useMemo(() => {
    const relevantAreas = debouncedSearchTerm ? searchedAreas : allAreas;
    const areasMap = new Map<string, MaintenanceAreaWithRelations>();
    
    relevantAreas.forEach(area => {
      areasMap.set(area.id, { 
        ...area, 
        child_areas: []
      });
    });
    
    const tree: MaintenanceAreaWithRelations[] = [];
    
    areasMap.forEach(area => {
      if (area.parent_id && areasMap.has(area.parent_id)) {
        const parent = areasMap.get(area.parent_id)!;
        parent.child_areas.push(area);
      } else {
        tree.push(area);
      }
    });
    
    const sortByName = (a: MaintenanceAreaWithRelations, b: MaintenanceAreaWithRelations) => 
      a.name.localeCompare(b.name);
    
    tree.sort(sortByName);
    tree.forEach(function sortChildren(area) {
      area.child_areas.sort(sortByName);
      area.child_areas.forEach(sortChildren);
    });
    
    return tree;
  }, [allAreas, searchedAreas, debouncedSearchTerm]);

  const handleToggleStatus = (e: React.MouseEvent, area: MaintenanceAreaWithRelations) => {
    e.stopPropagation();
    toggleStatusMutation.mutate({ id: area.id, status: !area.status });
  };

  return (
    <div className='flex-grow overflow-y-auto'>
      {areasQuery.isLoading ? (
        <div className='p-8 text-center text-gray-600 dark:text-gray-400'>Loading areas...</div>
      ) : areasQuery.isError ? (
        <div className='p-6 text-center text-red-500'>Error: {areasQuery.error.message}</div>
      ) : allAreas.length === 0 ? (
        <div className='p-8 text-center text-gray-500 dark:text-gray-400'>No areas found.</div>
      ) : viewMode === "tree" ? (
        <div>
          {hierarchicalAreas.length === 0 ? (
            <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
              No areas match your search criteria.
            </div>
          ) : (
            hierarchicalAreas.map((area) => (
              <AreaTreeItem
                key={area.id}
                area={area}
                level={0}
                selectedAreaId={selectedAreaId}
                expandedAreas={expandedAreas}
                onSelect={setSelectedAreaId}
                onToggleExpand={toggleExpanded}
                onToggleStatus={handleToggleStatus}
                isLoading={toggleStatusMutation.isPending}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          {searchedAreas.length === 0 ? (
            <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
              No areas match your search criteria.
            </div>
          ) : (
            searchedAreas.map((area) => (
              <AreaListItem
                key={area.id}
                area={area}
                selectedAreaId={selectedAreaId}
                onSelect={setSelectedAreaId}
                onToggleStatus={handleToggleStatus}
                isLoading={toggleStatusMutation.isPending}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}