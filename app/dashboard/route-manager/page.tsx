// app/dashboard/route-manager/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouteDetails } from "@/hooks/database/route-manager-hooks";
import { PageSpinner, ConfirmModal } from "@/components/common/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { FiberSpliceManager } from "@/components/route-manager/FiberSpliceManager";
import { JointBox } from "@/schemas/custom-schemas";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import RouteSelection from "@/components/route-manager/RouteSelection";

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JointBox | null>(null);
  const [editingJc, setEditingJc] = useState<JointBox | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization");

  const { data: routeDetails, isLoading: isLoadingRouteDetails, refetch: refetchRouteDetails, error: routeDetailsError, isError: routeDetailsIsError } = useRouteDetails(selectedRouteId as string);

  const deleteManager = useDeleteManager({
    tableName: "junction_closures",
    onSuccess: () => {
      refetchRouteDetails();
      if (selectedJc && selectedJc.id === deleteManager.deleteConfig?.items[0]?.id) {
        setSelectedJc(null);
        setActiveTab("visualization");
      }
    },
  });

  const allJointBoxesOnRoute = useMemo(() => routeDetails?.jointBoxes || [], [routeDetails]);
  const currentSegments = useMemo(() => routeDetails?.segments || [], [routeDetails]);

  const handleRouteChange = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId);
    setSelectedJc(null);
    setActiveTab("visualization");
  }, []);

  const handleAddJunctionClosure = useCallback(() => {
    setEditingJc(null);
    setIsJcFormModalOpen(true);
  }, []);

  const handleOpenEditJcModal = useCallback((jc: JointBox) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  }, []);

  const handleJcClick = useCallback((jc: JointBox) => {
    setSelectedJc(jc);
    setActiveTab("splicing");
  }, []);

  const handleRemoveJc = useCallback(
    (jcId: string) => {
      const jcToRemove = allJointBoxesOnRoute.find((jc) => jc.id === jcId);
      if (!jcToRemove) return;
      const name = jcToRemove.attributes?.name || jcToRemove.node?.name || `JC ${jcId.slice(-4)}`;
      deleteManager.deleteSingle({ id: jcId, name });
    },
    [allJointBoxesOnRoute, deleteManager]
  );

  return (
    <div className='p-6 space-y-6'>
      <RouteSelection selectedRouteId={selectedRouteId} onRouteChange={handleRouteChange} onAddJunctionClosure={handleAddJunctionClosure} isLoadingRouteDetails={isLoadingRouteDetails} />

      {isLoadingRouteDetails && <PageSpinner text='Loading route details...' />}
      {routeDetailsIsError && <div className='p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg'>Error: {routeDetailsError.message}</div>}

      {routeDetails && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList>
            <TabsTrigger value='visualization'>Route Visualization</TabsTrigger>
            <TabsTrigger value='splicing' disabled={!selectedJc}>
              Splice Management
            </TabsTrigger>
          </TabsList>
          <TabsContent value='visualization'>
            <RouteVisualization routeDetails={{ ...routeDetails, jointBoxes: allJointBoxesOnRoute, segments: currentSegments }} onJcClick={handleJcClick} onEditJc={handleOpenEditJcModal} onDeleteJc={handleRemoveJc} />
          </TabsContent>
          <TabsContent value='splicing'>
            <FiberSpliceManager junctionClosureId={selectedJc?.id ?? null} />
          </TabsContent>
        </Tabs>
      )}

      {isJcFormModalOpen && (
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
      )}

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
