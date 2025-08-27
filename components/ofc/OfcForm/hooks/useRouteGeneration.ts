"use client"

// components/ofc/OfcForm/hooks/useRouteGeneration.ts
import { useEffect, useMemo } from "react";
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
    if (isEdit || !startingNodeId || !endingNodeId || !nodesData) return;

    const startingNodeName = nodesData.find(node => node.id === startingNodeId)?.name;
    const endingNodeName = nodesData.find(node => node.id === endingNodeId)?.name;

    if (startingNodeName && endingNodeName) {
      const routeName = `${startingNodeName}⇔${endingNodeName}_${routeData.nextRouteNumber}`;
      setValue("route_name" as Path<T>, routeName as PathValue<T, Path<T>>);
    }
  }, [startingNodeId, endingNodeId, routeData.nextRouteNumber, isEdit, setValue, nodesData]);

  return {
    ...routeData,
    isLoading: existingRoutesLoading,
  };
};