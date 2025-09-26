"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from "@/components/common/page-header";
import { SearchableSelect } from "@/components/common/ui/select/SearchableSelect";
import { useDeleteJc, useOfcRoutesForSelection } from "@/hooks/database/route-manager-hooks";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { FaRoute } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { z } from 'zod';
import { 
    junction_closuresRowSchema, 
    cable_segmentsRowSchema,
    fiber_splicesRowSchema,
    v_ofc_cables_completeRowSchema
} from '@/schemas/zod-schemas';
import { projectDefaultSplices, projectSegments } from '@/components/route-manager/logic/project';

// --- Types are now correctly inferred from the single source of truth ---
export type CableRoute = z.infer<typeof v_ofc_cables_completeRowSchema> & {
    start_site: { id: string | null; name: string | null };
    end_site: { id: string | null; name: string | null };
    evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
};
export type Equipment = z.infer<typeof junction_closuresRowSchema> & {
  node?: { name: string | null; } | null;
  status: 'existing' | 'planned'; 
  attributes: { position_on_route: number; name?: string; } 
};
export type CableSegment = z.infer<typeof cable_segmentsRowSchema>;
export type FiberSplice = z.infer<typeof fiber_splicesRowSchema>;

export interface RouteDetailsPayload {
    route: CableRoute;
    equipment: Equipment[];
    segments: CableSegment[];
    splices: FiberSplice[];
}

const queryKeys = {
  routes: ['routes'] as const,
  routeDetails: (routeId: string | null) => ['routeDetails', routeId] as const,
};

const fetchRouteDetails = async (routeId: string): Promise<RouteDetailsPayload> => {
    const res = await fetch(`/api/route/${routeId}`);
    if (!res.ok) throw new Error('Failed to fetch route details');
    return res.json();
};

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedJc, setSelectedJc] = useState<Equipment | null>(null);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null);
  const [plannedJCs, setPlannedJCs] = useState<Equipment[]>([]);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const deleteJcMutation = useDeleteJc();
  
  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();

  const { data: routeDetails, isLoading, isError, error, refetch: refetchRouteDetails } = useQuery<RouteDetailsPayload>({
    queryKey: queryKeys.routeDetails(selectedRouteId),
    queryFn: () => fetchRouteDetails(selectedRouteId!),
    enabled: !!selectedRouteId,
  });

  const allEquipmentOnRoute = useMemo(() => [...(routeDetails?.equipment || []), ...plannedJCs], [routeDetails, plannedJCs]);
  const projectedSegments = useMemo(() => {
      if (!routeDetails) return [];
      return projectSegments(routeDetails.route, allEquipmentOnRoute);
  }, [routeDetails, allEquipmentOnRoute]);

  const projectedSplices = useMemo(() => {
      if (!routeDetails) return [];
      return projectDefaultSplices(routeDetails.route, projectedSegments, allEquipmentOnRoute);
  }, [routeDetails, projectedSegments, allEquipmentOnRoute]);

  const handleOpenEditJcModal = (jc: Equipment) => {
    setSelectedJc(jc);
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  };
  
  const handleRemoveJc = (jcId: string) => {
    const jcToRemove = allEquipmentOnRoute.find(jc => jc.id === jcId);
    // FIX: Correctly access the name for the confirmation prompt.
    const name = jcToRemove?.attributes?.name || (jcToRemove?.node as { name: string })?.name || "this JC";
    if (window.confirm(`Are you sure you want to delete "${name}"? This will re-calculate all segments.`)) {
        if (jcToRemove?.status === 'planned') {
            setPlannedJCs(prev => prev.filter(jc => jc.id !== jcId));
        } else {
          deleteJcMutation.mutate(jcToRemove!.id);
            refetchRouteDetails();
        }
    }
  };

  // On click JC, open splice tab
  // TODO: Implement this
  // To be implemented?
  
  const routeOptions = routesForSelection?.map((r) => ({ value: r.id, label: r.route_name })) || [];

  return (
    <div className='p-6 space-y-6'>
       <PageHeader
        title='Route Manager'
        description='Visualize routes, add junction closures, and manage fiber splices.'
        icon={<FaRoute />}
        isLoading={isLoadingRoutes}
        actions={[{
          label: "Add Junction Closure",
          onClick: () => setIsJcFormModalOpen(true),
          variant: "primary",
          leftIcon: <FiPlus />,
          disabled: !selectedRouteId || isLoading,
        }]}
      />
      
      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Select an OFC Route to Manage</label>
        <SearchableSelect options={routeOptions} value={selectedRouteId || ""} onChange={(v) => setSelectedRouteId(v)} placeholder={isLoadingRoutes ? "Loading routes..." : "Select a route"} disabled={isLoadingRoutes} clearable />
      </div>

      {isLoading && <PageSpinner text='Loading route details...' />}
      {isError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">Error: {error.message}</div>}
      
      {routeDetails && (
        <RouteVisualization routeDetails={{...routeDetails, equipment: allEquipmentOnRoute, segments: projectedSegments}} onJcClick={() => {}} onEditJc={handleOpenEditJcModal} onDeleteJc={handleRemoveJc} />
      )}
      
      <JcFormModal
        isOpen={isJcFormModalOpen}
        onClose={() => setIsJcFormModalOpen(false)}
        onSave={() => refetchRouteDetails()}
        routeId={selectedRouteId}
        editingJc={selectedJc}
        rkm={routeDetails?.route.current_rkm ?? null}
      />
    </div>
  );
}