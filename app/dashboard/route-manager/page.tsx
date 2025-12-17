'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useRouteDetails } from '@/hooks/database/route-manager-hooks';
import { PageSpinner, ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/tabs';
import { JcFormModal } from '@/components/route-manager/JcFormModal';
import RouteVisualization from '@/components/route-manager/ui/RouteVisualization';
import { FiberSpliceManager } from '@/components/route-manager/FiberSpliceManager';
import { JointBox } from '@/schemas/custom-schemas';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import RouteSelection from '@/components/route-manager/RouteSelection';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { FiUpload, FiDownload, FiPlus, FiRefreshCw, FiGitMerge, FiMap } from 'react-icons/fi';
import { Map } from 'lucide-react';
import {
  useExportRouteTopology,
  useImportRouteTopology,
} from '@/hooks/database/excel-queries/useRouteTopologyExcel';
import { ActionButton } from '@/components/common/page-header';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JointBox | null>(null);
  const [editingJc, setEditingJc] = useState<JointBox | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('visualization');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  // Permissions
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN;
  const canDelete = !!isSuperAdmin;

  const {
    data: routeDetails,
    isLoading: isLoadingRouteDetails,
    refetch: refetchRouteDetails,
    error: routeDetailsError,
    isError: routeDetailsIsError,
  } = useRouteDetails(selectedRouteId as string);

  const deleteManager = useDeleteManager({
    tableName: 'junction_closures',
    onSuccess: () => {
      refetchRouteDetails();
      // If the deleted JC was the currently selected one, clear selection and go back to visualization
      if (selectedJc && deleteManager.itemToDelete?.id === selectedJc.id) {
        setSelectedJc(null);
        setActiveTab('visualization');
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
    setActiveTab('visualization');
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
      toast.error('Please select a route to export.');
    }
  }, [selectedRouteId, routeDetails?.route?.route_name, exportTopology]);

  const handleOpenEditJcModal = useCallback((jc: JointBox) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  }, []);

  const handleJcClick = useCallback((jc: JointBox) => {
    setSelectedJc(jc);
    setActiveTab('splicing');
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

  const headerActions = useMemo(
    (): ActionButton[] => {
      const actions: ActionButton[] = [
        {
          label: 'Refresh',
          onClick: () => {
            refetchRouteDetails();
            toast.success('Route details refreshed!');
          },
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
          hideTextOnMobile: true,
        },
      ];

      if (canEdit) {
        actions.push({
          label: isUploading ? 'Importing...' : 'Import Topology',
          onClick: handleUploadClick,
          variant: 'outline',
          leftIcon: <FiUpload />,
          disabled: isUploading || !selectedRouteId,
          hideTextOnMobile: true,
        });

        actions.push({
          label: 'Add Junction Closure',
          onClick: handleAddJunctionClosure,
          variant: 'primary',
          leftIcon: <FiPlus />,
          disabled: !selectedRouteId || isLoadingRouteDetails,
        });
      }
      return actions;
    },
    [
      isLoadingRouteDetails,
      isExporting,
      isUploading,
      selectedRouteId,
      handleAddJunctionClosure,
      refetchRouteDetails,
      handleExportClick,
      handleUploadClick,
      canEdit
    ]
  );

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-[calc(100vh-64px)] flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      
      {/* Route Selection Header */}
      <RouteSelection
        selectedRouteId={selectedRouteId}
        onRouteChange={handleRouteChange}
        isLoadingRouteDetails={isLoadingRouteDetails}
        actions={headerActions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {routeDetailsIsError ? (
          <ErrorDisplay 
            error={routeDetailsError?.message} 
            title="Failed to load route details"
            actions={[{ label: "Retry", onClick: () => refetchRouteDetails(), variant: "primary" }]}
          />
        ) : isLoadingRouteDetails ? (
           <div className="flex-1 flex items-center justify-center min-h-[400px]">
             <PageSpinner text="Loading route topology..." />
           </div>
        ) : !selectedRouteId ? (
           <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <FancyEmptyState 
                icon={Map}
                title="No Route Selected"
                description="Please select an Optical Fiber Cable route from the dropdown above to manage its topology, junction closures, and splicing."
              />
           </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4">
             {/* If route is selected but no data returned (unlikely due to schema validation, but safe to handle) */}
             {!routeDetails ? (
                 <ErrorDisplay error="Route data is empty or invalid." />
             ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                    <TabsList className="bg-transparent p-0">
                      <TabsTrigger 
                        value="visualization"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-2"
                      >
                        <FiMap className="mr-2" /> Route Visualization
                      </TabsTrigger>
                      <TabsTrigger 
                        value="splicing" 
                        disabled={!selectedJc}
                        className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-2 disabled:opacity-50"
                      >
                        <FiGitMerge className="mr-2" /> 
                        Splice Management {selectedJc && `(${selectedJc.node?.name || 'JC'})`}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1">
                    <TabsContent value="visualization" className="h-full mt-0 focus-visible:outline-none">
                      <RouteVisualization
                        routeDetails={{
                          ...routeDetails,
                          jointBoxes: allJointBoxesOnRoute,
                          segments: currentSegments,
                        }}
                        onJcClick={handleJcClick}
                        onEditJc={handleOpenEditJcModal}
                        onDeleteJc={handleRemoveJc}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    </TabsContent>
                    
                    <TabsContent value="splicing" className="h-full mt-0 focus-visible:outline-none">
                      <FiberSpliceManager 
                        junctionClosureId={selectedJc?.id ?? null} 
                        canEdit={canEdit}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
             )}
          </div>
        )}
      </div>

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
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        loading={deleteManager.isPending}
        type="danger"
      />
    </div>
  );
}