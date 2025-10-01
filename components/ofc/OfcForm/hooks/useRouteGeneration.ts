// components/ofc/OfcForm/hooks/useRouteGeneration.ts
'use client';

import { useMemo } from 'react';
import { useExistingRoutesQuery } from './useExistingRoutesQuery';

interface UseRouteGenerationProps {
  startingNodeId: string | null;
  endingNodeId: string | null;
  startingNodeName: string | null;
  endingNodeName: string | null;
  isEdit: boolean;
}

export const useRouteGeneration = ({
  startingNodeId,
  endingNodeId,
  startingNodeName,
  endingNodeName,
  isEdit,
}: UseRouteGenerationProps) => {
  const { data: existingRoutes, isLoading: existingRoutesLoading } = 
    useExistingRoutesQuery(startingNodeId, endingNodeId);

  const routeData = useMemo(() => {
    const routes = existingRoutes || [];
    const routeCount = routes.length;
    const nextRouteNumber = routeCount + 1;

    return {
      existingRoutes: routes.map(route => route.route_name),
      routeCount,
      nextRouteNumber,
    };
  }, [existingRoutes]);

  // **THE FIX: Calculate the name with useMemo. This is a pure calculation, not a side effect.**
  const generatedRouteName = useMemo(() => {
    if (isEdit || existingRoutesLoading || !startingNodeName || !endingNodeName) {
      return null;
    }
    return `${startingNodeName}⇔${endingNodeName}_${routeData.nextRouteNumber}`;
  }, [
    isEdit, 
    startingNodeName, 
    endingNodeName, 
    existingRoutesLoading, 
    routeData.nextRouteNumber
  ]);

  return {
    ...routeData,
    isLoading: existingRoutesLoading,
    generatedRouteName, // <-- Return the calculated name
  };
};