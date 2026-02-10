import { PageHeader } from "@/components/common/page-header";
import { ActionButton } from "@/components/common/page-header";
import { Option, SearchableSelect } from "@/components/common/ui/select/SearchableSelect";
import { useOfcRoutesForSelection } from "@/hooks/database/route-manager-hooks";
import React, { useCallback, useMemo } from "react";
import { FaRoute } from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";

interface RouteSelectionProps {
  selectedRouteId: string | null;
  onRouteChange: (routeId: string | null) => void;
  isLoadingRouteDetails: boolean;
  actions?: ActionButton[];
}

const RouteSelection: React.FC<RouteSelectionProps> = ({
  selectedRouteId,
  onRouteChange,
  isLoadingRouteDetails,
  actions
}) => {
  const queryClient = useQueryClient();
  const { data: routesForSelection, isLoading: isLoadingRoutesData } = useOfcRoutesForSelection();

  const routeOptions = useMemo((): Option[] => {
    if (!routesForSelection) return [];
    
    return routesForSelection
      .filter(r => r.id !== null && r.route_name !== null)
      .map((r) => {
        const capacity = r.capacity;
        const routeName = r.route_name;
        const displayLabel = `${routeName}(${capacity}F)`
        return ({ value: r.id as string, label: displayLabel as string })});
  }, [routesForSelection]);

  const handleRouteChange = useCallback((value: string | null) => {
    onRouteChange(value);
    queryClient.invalidateQueries({ queryKey: ['jc-splicing-details'] });
  }, [onRouteChange, queryClient]);

  return (
    <>
      <PageHeader
        title='Route Manager'
        description='Visualize routes, add junction closures, and manage fiber splices.'
        icon={<FaRoute />}
        isLoading={isLoadingRoutesData}
        actions={actions}
      />
      
      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
          Select an OFC Route to Manage
        </label>
        <SearchableSelect 
          options={routeOptions} 
          value={selectedRouteId || ""} 
          onChange={handleRouteChange} 
          placeholder={isLoadingRoutesData ? "Loading routes..." : "Select a route"} 
          disabled={isLoadingRoutesData || isLoadingRouteDetails} 
          clearable 
        />
      </div>
    </>
  );
};

export default RouteSelection;