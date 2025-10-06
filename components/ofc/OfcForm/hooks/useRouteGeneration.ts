// components/ofc/OfcForm/hooks/useRouteGeneration.ts
'use client';

import { useEffect, useMemo } from 'react';
import { UseFormSetValue, FieldValues, Path, PathValue } from 'react-hook-form';
import { useExistingRoutesQuery } from '@/components/ofc/OfcForm/hooks/useExistingRoutesQuery';

interface UseRouteGenerationProps<T extends FieldValues> {
  startingNodeId: string | null;
  endingNodeId: string | null;
  startingNodeName: string | null;
  endingNodeName: string | null;
  isEdit: boolean;
  setValue: UseFormSetValue<T>;
}

export const useRouteGeneration = <T extends FieldValues>({
  startingNodeId,
  endingNodeId,
  startingNodeName,
  endingNodeName,
  isEdit,
  setValue,
}: UseRouteGenerationProps<T>) => {
  
  // ** Removed the unnecessary generic type argument.**
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

  useEffect(() => {
    if (isEdit) {
      return;
    }

    if (!startingNodeId || !endingNodeId) {
      setValue('route_name' as Path<T>, '' as PathValue<T, Path<T>>);
      return;
    }
    
    if (existingRoutesLoading) {
      return;
    }

    if (startingNodeName && endingNodeName) {
      const routeName = `${startingNodeName}⇔${endingNodeName}_${routeData.nextRouteNumber}`;
      setValue('route_name' as Path<T>, routeName as PathValue<T, Path<T>>, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    startingNodeId,
    endingNodeId,
    startingNodeName,
    endingNodeName,
    isEdit,
    existingRoutesLoading,
    routeData.nextRouteNumber,
    setValue,
  ]);

  return {
    ...routeData,
    isLoading: existingRoutesLoading,
    generatedRouteName: null,
  };
};