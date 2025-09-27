// path: app/dashboard/route-manager/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from "@/components/common/page-header";
import { SearchableSelect, Option } from "@/components/common/ui/select/SearchableSelect";
import { useDeleteJc, useOfcRoutesForSelection } from "@/hooks/database/route-manager-hooks";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { FaRoute } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { FiberSpliceManager } from '@/components/route-manager/FiberSpliceManager';
import { 
    RouteDetailsPayload,
    Equipment
} from '@/schemas/custom-schemas';

const queryKeys = {
  routes: ['routes'] as const,
  routeDetails: (routeId: string | null) => ['routeDetails', routeId] as const,
};

const fetchRouteDetails = async (routeId: string): Promise<RouteDetailsPayload> => {
    const res = await fetch(`/api/route/${routeId}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch route details');
    }
    return res.json();
};

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<Equipment | null>(null);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('visualization');
  
  const queryClient = useQueryClient();
  const deleteJcMutation = useDeleteJc();
  
  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();

  const { data: routeDetails, isLoading, isError, error, refetch: refetchRouteDetails } = useQuery<RouteDetailsPayload>({
    queryKey: queryKeys.routeDetails(selectedRouteId),
    queryFn: () => fetchRouteDetails(selectedRouteId!),
    enabled: !!selectedRouteId,
  });

  const allEquipmentOnRoute = useMemo(() => (routeDetails?.equipment || []), [routeDetails]);
  const currentSegments = useMemo(() => (routeDetails?.segments || []), [routeDetails]);

  // FIX: Explicitly type the entire function signature for the callbacks.
  // This guarantees they match the prop types expected by RouteVisualization.
  const handleOpenEditJcModal: (jc: Equipment) => void = useCallback((jc) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  }, []);
  
  const handleJcClick: (jc: Equipment) => void = useCallback((jc) => {
    setSelectedJc(jc);
    setActiveTab('splicing');
  }, []);
  
  const handleRemoveJc = useCallback((jcId: string) => {
    const jcToRemove = allEquipmentOnRoute.find(jc => jc.id === jcId);
    const name = jcToRemove?.attributes?.name || jcToRemove?.node?.name || "this JC";
    if (window.confirm(`Are you sure you want to delete "${name}"? This will re-calculate all segments.`)) {
        deleteJcMutation.mutate(jcToRemove!.id, {
            onSuccess: () => {
                if (selectedJc?.id === jcId) {
                    setSelectedJc(null);
                    setActiveTab('visualization');
                }
                refetchRouteDetails();
            }
        });
    }
  }, [allEquipmentOnRoute, selectedJc, deleteJcMutation, refetchRouteDetails]);
  
  const routeOptions = useMemo((): Option[] => {
    if (!routesForSelection) return [];
    return routesForSelection
      .filter(r => r.id !== null && r.route_name !== null)
      .map((r) => ({ value: r.id as string, label: r.route_name as string }));
  }, [routesForSelection]);

  return (
    <div className='p-6 space-y-6'>
       <PageHeader
        title='Route Manager'
        description='Visualize routes, add junction closures, and manage fiber splices.'
        icon={<FaRoute />}
        isLoading={isLoadingRoutes}
        actions={[{
          label: "Add Junction Closure",
          onClick: () => { setEditingJc(null); setIsJcFormModalOpen(true); },
          variant: "primary",
          leftIcon: <FiPlus />,
          disabled: !selectedRouteId || isLoading,
        }]}
      />
      
      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Select an OFC Route to Manage</label>
        <SearchableSelect 
            options={routeOptions} 
            value={selectedRouteId || ""} 
            onChange={(v) => { 
                setSelectedRouteId(v); 
                setSelectedJc(null); 
                setActiveTab('visualization'); 
                queryClient.invalidateQueries({ queryKey: queryKeys.routeDetails(v) });
            }} 
            placeholder={isLoadingRoutes ? "Loading routes..." : "Select a route"} 
            disabled={isLoadingRoutes} 
            clearable 
        />
      </div>

      {isLoading && <PageSpinner text='Loading route details...' />}
      {isError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">Error: {error.message}</div>}
      
      {routeDetails && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="visualization">Route Visualization</TabsTrigger>
              <TabsTrigger value="splicing" disabled={!selectedJc}>Splice Management</TabsTrigger>
            </TabsList>
            <TabsContent value="visualization">
              <RouteVisualization 
                routeDetails={{...routeDetails, equipment: allEquipmentOnRoute, segments: currentSegments}} 
                onJcClick={handleJcClick} 
                onEditJc={handleOpenEditJcModal} 
                onDeleteJc={handleRemoveJc} 
              />
            </TabsContent>
            <TabsContent value="splicing">
              <FiberSpliceManager junctionClosureId={selectedJc?.id ?? null} />
            </TabsContent>
          </Tabs>
      )}
      
      <JcFormModal
        isOpen={isJcFormModalOpen}
        onClose={() => { setEditingJc(null); setIsJcFormModalOpen(false); }}
        onSave={() => refetchRouteDetails()}
        routeId={selectedRouteId}
        editingJc={editingJc}
        rkm={routeDetails?.route.current_rkm ?? null}
      />
    </div>
  );
}