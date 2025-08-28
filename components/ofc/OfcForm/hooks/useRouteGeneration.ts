"use client"

// components/ofc/OfcForm/hooks/useRouteGeneration.ts
import { useEffect, useMemo, useRef } from "react";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";

interface UseRouteGenerationProps<T extends FieldValues> {
    startingNodeId: string | null;
    endingNodeId: string | null;
    nodesData: Array<{ id: string; name: string }> | undefined;
    isEdit: boolean;
    setValue: UseFormSetValue<T>;
}

export const useRouteGeneration = <T extends FieldValues>({
  startingNodeId,
  endingNodeId,
  nodesData,
  isEdit,
  setValue,
}: UseRouteGenerationProps<T>) => {
  // Use refs to track previous values and prevent unnecessary updates
  const prevStartingNodeId = useRef<string | null>(null);
  const prevEndingNodeId = useRef<string | null>(null);
  const prevIsEdit = useRef<boolean>(isEdit);
  const isInitialMount = useRef(true);
  const supabase = createClient();
  
  // Fetch existing routes between selected nodes
  const { data: existingRoutes, isLoading: existingRoutesLoading } = useTableQuery(
    supabase,
    "ofc_cables",
    {
      filters: startingNodeId && endingNodeId ? {
        $or: {
          operator: "or",
          value: `and(sn_id.eq.${startingNodeId},en_id.eq.${endingNodeId}),and(sn_id.eq.${endingNodeId},en_id.eq.${startingNodeId})`,
        },
      } : {},
      columns: "id, route_name",
      includeCount: true,
      enabled: Boolean(startingNodeId && endingNodeId),
      staleTime: 30000, // 30 seconds cache
    }
  );

  const routeData = useMemo(() => {
    const routes = existingRoutes || [];
    const routeCount = Array.isArray(routes) ? routes.length : 0;
    const nextRouteNumber = routeCount + 1;
    
    return {
      existingRoutes: routes.map((route: unknown) => (route as { route_name: string }).route_name),
      routeCount,
      nextRouteNumber,
    };
  }, [existingRoutes]);

  // Auto-generate route name for new cables
  useEffect(() => {
    // Skip if this is the initial mount and we're in edit mode
    if (isInitialMount.current) {
      if (isEdit) {
        isInitialMount.current = false;
        return;
      }
      isInitialMount.current = false;
    }

    // Skip if nothing has changed
    if (
      startingNodeId === prevStartingNodeId.current &&
      endingNodeId === prevEndingNodeId.current &&
      isEdit === prevIsEdit.current
    ) {
      return;
    }

    // Get current values before updating refs
    const prevStart = prevStartingNodeId.current;
    const prevEnd = prevEndingNodeId.current;
    const prevEdit = prevIsEdit.current;
    
    // Update refs with current values
    prevStartingNodeId.current = startingNodeId;
    prevEndingNodeId.current = endingNodeId;
    prevIsEdit.current = isEdit;

    // Skip if we're in edit mode and the route name is already set
    if (isEdit && startingNodeId && endingNodeId) {
      return;
    }

    // Only proceed if we have both nodes selected and we're not in edit mode
    if (!startingNodeId || !endingNodeId || isEdit) {
      // Only clear if we're not in the middle of a node change
      if ((!startingNodeId || !endingNodeId) && !existingRoutesLoading) {
        setValue("route_name" as Path<T>, "" as PathValue<T, Path<T>>, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      return;
    }

    const startingNodeName = nodesData?.find(node => node.id === startingNodeId)?.name;
    const endingNodeName = nodesData?.find(node => node.id === endingNodeId)?.name;

    if (startingNodeName && endingNodeName) {
      // Only update if the nodes have actually changed
      if (prevStart !== startingNodeId || prevEnd !== endingNodeId || prevEdit !== isEdit) {
        const routeName = `${startingNodeName}⇔${endingNodeName}_${routeData.nextRouteNumber}`;
        setValue("route_name" as Path<T>, routeName as PathValue<T, Path<T>>, { 
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else if (!existingRoutesLoading) {
      setValue("route_name" as Path<T>, "" as PathValue<T, Path<T>>, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }  
  }, [
    startingNodeId, 
    endingNodeId, 
    routeData.nextRouteNumber, 
    isEdit, 
    setValue, 
    nodesData, 
    existingRoutesLoading
  ]);

  return {
    ...routeData,
    isLoading: existingRoutesLoading,
  };
};