// app/dashboard/route-manager/page.tsx
"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouteDetails } from "@/hooks/database/route-manager-hooks";
import { PageSpinner, ConfirmModal } from "@/components/common/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { FiberSpliceManager } from "@/components/route-manager/FiberSpliceManager";
import { JointBox } from "@/schemas/custom-schemas";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import RouteSelection from "@/components/route-manager/RouteSelection";
import { useStandardHeaderActions } from "@/components/common/page-header";
import { toast } from "sonner";
import { Row } from "@/hooks/database";
import { useCableSegmentsExcelUpload } from "@/hooks/database/excel-queries/useCableSegmentsExcelUpload";
import { buildUploadConfig } from "@/constants/table-column-keys";
import { createClient } from "@/utils/supabase/client";
import { FiUpload } from "react-icons/fi";

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JointBox | null>(null);
  const [editingJc, setEditingJc] = useState<JointBox | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: routeDetails, isLoading: isLoadingRouteDetails, refetch: refetchRouteDetails, error: routeDetailsError, isError: routeDetailsIsError } = useRouteDetails(selectedRouteId as string);

  const deleteManager = useDeleteManager({
    tableName: "junction_closures",
    onSuccess: () => {
      refetchRouteDetails();
      if (selectedJc && selectedJc.id === deleteManager.itemToDelete?.id) {
        setSelectedJc(null);
        setActiveTab("visualization");
      }
    },
  });

  const { mutate: uploadSegments, isPending: isUploading } = useCableSegmentsExcelUpload(createClient());

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
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedRouteId) {
      const uploadConfig = buildUploadConfig('cable_segments');
      uploadSegments({
        file,
        columns: uploadConfig.columnMapping,
        original_cable_id: selectedRouteId,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
  
  const headerActions = useStandardHeaderActions<'cable_segments'>({
    data: currentSegments as Row<'cable_segments'>[],
    onRefresh: async () => {
      await refetchRouteDetails();
      toast.success('Route details refreshed!');
    },
    onAddNew: handleAddJunctionClosure,
    isLoading: isLoadingRouteDetails,
    exportConfig: {
      tableName: 'cable_segments',
      fileName: `segments_${routeDetails?.route?.route_name ?? selectedRouteId}`,
      filters: selectedRouteId ? { original_cable_id: selectedRouteId } : undefined,
    },
  });

  // Inject the upload button into the header actions
  const finalHeaderActions = useMemo(() => {
    const uploadAction = {
      label: isUploading ? 'Uploading...' : 'Upload Segments',
      onClick: handleUploadClick,
      variant: 'outline' as const,
      leftIcon: <FiUpload />,
      disabled: isUploading || !selectedRouteId,
    };
    // Insert the upload button before the "Add New" button
    const addNewIndex = headerActions.findIndex(a => a.label === 'Add New');
    if (addNewIndex !== -1) {
      const actions = [...headerActions];
      actions.splice(addNewIndex, 0, uploadAction);
      return actions;
    }
    return [...headerActions, uploadAction];
  }, [headerActions, isUploading, selectedRouteId, handleUploadClick]);


  return (
    <div className='p-6 space-y-6'>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />
      <RouteSelection 
        selectedRouteId={selectedRouteId} 
        onRouteChange={handleRouteChange} 
        isLoadingRouteDetails={isLoadingRouteDetails}
        actions={finalHeaderActions}
      />

      {isLoadingRouteDetails && <PageSpinner text='Loading route details...' />}
      {routeDetailsIsError && <div className='p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg'>Error: {routeDetailsError.message}</div>}

      {routeDetails && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList>
            <TabsTrigger value='visualization'>Route Visualization</TabsTrigger>
            <TabsTrigger value='splicing' disabled={!selectedJc}>
              Splice Management {selectedJc && `(${selectedJc.node?.name || 'JC'})`}
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