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
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { FiUpload, FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";
import { useExportRouteTopology, useImportRouteTopology } from "@/hooks/database/excel-queries/useRouteTopologyExcel";
import { ActionButton } from "@/components/common/page-header";
import { useUser } from "@/providers/UserProvider";
import { UserRole } from "@/types/user-roles";

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JointBox | null>(null);
  const [editingJc, setEditingJc] = useState<JointBox | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const { isSuperAdmin, role } = useUser();

  // --- PERMISSIONS ---
  // Admins/Asset Admins can Edit (Create JCs, Splice)
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN;
  // Super Admin can Delete (Deleting a JC is destructive to the route segments)
  const canDelete = !!isSuperAdmin;

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

  const { mutate: exportTopology, isPending: isExporting } = useExportRouteTopology(supabase);
  const { mutate: importTopology, isPending: isUploading } = useImportRouteTopology(supabase);

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
  
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedRouteId) {
      importTopology({ file, routeId: selectedRouteId });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportClick = useCallback(() => {
  if (selectedRouteId && routeDetails?.route?.route_name) {
    exportTopology({ routeId: selectedRouteId, routeName: routeDetails.route.route_name });
  } else {
    toast.error("Please select a route to export.");
  }
}, [selectedRouteId, routeDetails?.route?.route_name, exportTopology]);

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
  
  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
        {
            label: 'Refresh',
            onClick: () => { refetchRouteDetails(); toast.success('Route details refreshed!'); },
            variant: 'outline',
            leftIcon: <FiRefreshCw className={isLoadingRouteDetails ? 'animate-spin' : ''} />,
            disabled: isLoadingRouteDetails,
        },
        {
            label: isExporting ? 'Exporting...' : 'Export Topology',
            onClick: handleExportClick,
            variant: 'outline',
            leftIcon: <FiDownload />,
            disabled: isExporting || !selectedRouteId,
        }
    ];

    // Restrict Import to Admins
    if (canEdit) {
        actions.push({
            label: isUploading ? 'Importing...' : 'Import Topology',
            onClick: handleUploadClick,
            variant: 'outline',
            leftIcon: <FiUpload />,
            disabled: isUploading || !selectedRouteId,
        });
    }

    // Restrict Add JC to Admins
    if (canEdit) {
        actions.push({
            label: 'Add Junction Closure',
            onClick: handleAddJunctionClosure,
            variant: 'primary',
            leftIcon: <FiPlus />,
            disabled: !selectedRouteId || isLoadingRouteDetails,
        });
    }

    return actions;
  }, [isLoadingRouteDetails, isExporting, isUploading, selectedRouteId, handleAddJunctionClosure, refetchRouteDetails, handleExportClick, handleUploadClick, canEdit]);

  return (
    <div className='p-6 space-y-6'>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx"
      />
      <RouteSelection 
        selectedRouteId={selectedRouteId} 
        onRouteChange={handleRouteChange} 
        isLoadingRouteDetails={isLoadingRouteDetails}
        actions={headerActions}
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
            <RouteVisualization 
                routeDetails={{ ...routeDetails, jointBoxes: allJointBoxesOnRoute, segments: currentSegments }} 
                onJcClick={handleJcClick} 
                onEditJc={handleOpenEditJcModal} 
                onDeleteJc={handleRemoveJc} 
                canEdit={canEdit}
                canDelete={canDelete}
            />
          </TabsContent>
          <TabsContent value='splicing'>
            <FiberSpliceManager 
                junctionClosureId={selectedJc?.id ?? null} 
                canEdit={canEdit}
            />
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