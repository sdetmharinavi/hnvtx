// path: app/dashboard/route-manager/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/page-header";
import { SearchableSelect, Option } from "@/components/common/ui/select/SearchableSelect";
import { useOfcRoutesForSelection } from "@/hooks/database/route-manager-hooks";
import { PageSpinner, ConfirmModal } from "@/components/common/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { FaRoute } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { FiberSpliceManager } from "@/components/route-manager/FiberSpliceManager";
import { RouteDetailsPayload, Equipment } from "@/schemas/custom-schemas";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { toast } from "sonner";

const queryKeys = {
  routes: ["routes"] as const,
  routeDetails: (routeId: string | null) => ["routeDetails", routeId] as const,
};

const fetchRouteDetails = async (routeId: string): Promise<RouteDetailsPayload> => {
  const res = await fetch(`/api/route/${routeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch route details");
  }
  return res.json();
};

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<Equipment | null>(null);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization");

  const queryClient = useQueryClient();

  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();

  const {
    data: routeDetails,
    isLoading,
    isError,
    error,
    refetch: refetchRouteDetails,
  } = useQuery<RouteDetailsPayload>({
    queryKey: queryKeys.routeDetails(selectedRouteId),
    queryFn: () => fetchRouteDetails(selectedRouteId!),
    enabled: !!selectedRouteId,
  });

  const deleteManager = useDeleteManager({
    tableName: "junction_closures",
    onSuccess: () => {
      toast.success("Junction Closure deleted successfully.");
      refetchRouteDetails();
      if (selectedJc && selectedJc.id === deleteManager.deleteConfig?.items[0]?.id) {
        setSelectedJc(null);
        setActiveTab("visualization");
      }
    },
  });

  const allEquipmentOnRoute = useMemo(() => routeDetails?.equipment || [], [routeDetails]);
  const currentSegments = useMemo(() => routeDetails?.segments || [], [routeDetails]);

  const handleOpenEditJcModal = useCallback((jc: Equipment) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  }, []);

  const handleJcClick = useCallback((jc: Equipment) => {
    setSelectedJc(jc);
    setActiveTab("splicing");
  }, []);

  const handleRemoveJc = useCallback(
    (jcId: string) => {
      const jcToRemove = allEquipmentOnRoute.find((jc) => jc.id === jcId);
      if (!jcToRemove) return;
      const name = jcToRemove.attributes?.name || jcToRemove.node?.name || `JC ${jcId.slice(-4)}`;
      deleteManager.deleteSingle({ id: jcId, name });
    },
    [allEquipmentOnRoute, deleteManager]
  );

  const routeOptions = useMemo((): Option[] => {
    if (!routesForSelection) return [];
    return routesForSelection.filter((r) => r.id !== null && r.route_name !== null).map((r) => ({ value: r.id as string, label: r.route_name as string }));
  }, [routesForSelection]);

  return (
    <div className='p-6 space-y-6'>
      <PageHeader
        title='Route Manager'
        description='Visualize routes, add junction closures, and manage fiber splices.'
        icon={<FaRoute />}
        isLoading={isLoadingRoutes}
        actions={[
          {
            label: "Add Junction Closure",
            onClick: () => {
              setEditingJc(null);
              setIsJcFormModalOpen(true);
            },
            variant: "primary",
            leftIcon: <FiPlus />,
            disabled: !selectedRouteId || isLoading,
          },
        ]}
      />

      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Select an OFC Route to Manage</label>
        <SearchableSelect
          options={routeOptions}
          value={selectedRouteId || ""}
          onChange={(v) => {
            setSelectedRouteId(v);
            setSelectedJc(null);
            setActiveTab("visualization");
            // CORRECTED: Invalidate splice details when route changes
            queryClient.invalidateQueries({ queryKey: ["jc-splicing-details"] });
          }}
          placeholder={isLoadingRoutes ? "Loading routes..." : "Select a route"}
          disabled={isLoadingRoutes}
          clearable
        />
      </div>

      {isLoading && <PageSpinner text='Loading route details...' />}
      {isError && <div className='p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg'>Error: {error.message}</div>}

      {routeDetails && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList>
            <TabsTrigger value='visualization'>Route Visualization</TabsTrigger>
            <TabsTrigger value='splicing' disabled={!selectedJc}>
              Splice Management
            </TabsTrigger>
          </TabsList>
          <TabsContent value='visualization'>
            <RouteVisualization routeDetails={{ ...routeDetails, equipment: allEquipmentOnRoute, segments: currentSegments }} onJcClick={handleJcClick} onEditJc={handleOpenEditJcModal} onDeleteJc={handleRemoveJc} />
          </TabsContent>
          <TabsContent value='splicing'>
            <FiberSpliceManager junctionClosureId={selectedJc?.id ?? null} />
          </TabsContent>
        </Tabs>
      )}

      <JcFormModal
        isOpen={isJcFormModalOpen}
        onClose={() => {
          setEditingJc(null);
          setIsJcFormModalOpen(false);
        }}
        onSave={() => refetchRouteDetails()}
        routeId={selectedRouteId}
        editingJc={editingJc}
        rkm={routeDetails?.route.current_rkm ?? null}
      />

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        loading={deleteManager.isPending}
        type='danger'
      />
    </div>
  );
}
