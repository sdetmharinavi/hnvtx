// path: app/dashboard/route-manager/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SearchableSelect } from "@/components/common/ui/select/SearchableSelect";
import { useDeleteJc, useOfcRoutesForSelection, useRouteDetails } from "@/hooks/database/route-manager-hooks";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { FaRoute } from "react-icons/fa";
import { Equipment } from "@/components/route-manager/types";
// import { SpliceMatrixModal } from "@/components/route-manager/SpliceMatrixModal"; // <--- IMPORT THE NEW MODAL
import { FiPlus } from "react-icons/fi";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import { RouteVisualizer } from "@/components/route-manager/RouteVisualizer";
import { FiberSpliceManager } from "@/components/route-manager/FiberSpliceManager";
import { CableSegmentationManager } from "@/components/route-manager/CableSegmentationManager";
import { usePagedData } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/ui/tabs";

// =================================================================
// Main Page Component
// =================================================================
export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<Equipment | null>(null);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null); // <--- For the JC form
  const [isSpliceModalOpen, setIsSpliceModalOpen] = useState(false);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false); // <--- State for JC form modal
  const [activeTab, setActiveTab] = useState("visualizer");

  const supabase = createClient();

  // Data fetching and mutation hooks
  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();
  const { data: routeDetails, isLoading: isLoadingDetails, isError: isErrorRouteDetails, error: errorRouteDetails, refetch: refetchRouteDetails } = useRouteDetails(selectedRouteId);
  const deleteJcMutation = useDeleteJc();

  const handleJcClick = (jc: Equipment) => {
    setSelectedJc(jc);
    setIsSpliceModalOpen(true);
  };

  const handleOpenAddJcModal = () => {
    console.log("=== OPENING JC MODAL ===");
    console.log("selectedRouteId:", selectedRouteId);
    console.log("routeDetails:", routeDetails);
    setEditingJc(null); // Ensure we're in "create" mode
    setIsJcFormModalOpen(true);
  };

  const handleOpenEditJcModal = (jc: Equipment) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  };

  const handleDeleteJc = (jc: Equipment) => {
    if (window.confirm(`Are you sure you want to delete the junction closure "${jc.name}"? This action cannot be undone.`)) {
      if (jc.id) {
        deleteJcMutation.mutate(jc.id);
      } else {
        console.error("Cannot delete junction closure: id is null");
      }
    }
  };

  const routeOptions = routesForSelection?.map((r) => ({ value: r.id, label: r.route_name })) || [];

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Route Manager'
        description='Visualize and manage the fiber splices within your OFC routes.'
        icon={<FaRoute />}
        isLoading={isLoadingRoutes}
        actions={[
          {
            label: "Add Junction Closure",
            onClick: handleOpenAddJcModal,
            variant: "primary",
            leftIcon: <FiPlus />,
            disabled: !selectedRouteId || isLoadingDetails,
          },
        ]}
      />

      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Select an OFC Route to Manage</label>
        <SearchableSelect options={routeOptions} value={selectedRouteId || ""} onChange={(value) => setSelectedRouteId(value)} placeholder={isLoadingRoutes ? "Loading routes..." : "Search and select a route"} disabled={isLoadingRoutes} clearable />
      </div>

      {isLoadingDetails && <PageSpinner text='Loading route details...' />}

      {isErrorRouteDetails && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          Error loading route details: {errorRouteDetails.message}
        </div>
      )}

      {routeDetails && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("visualizer")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "visualizer"
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Route Visualizer
            </button>
            <button
              onClick={() => setActiveTab("fiber-splice")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "fiber-splice"
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Fiber Splice Manager
            </button>
            <button
              onClick={() => setActiveTab("segmentation")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "segmentation"
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Cable Segmentation
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "visualizer" && (
            <RouteVisualizer routeDetails={routeDetails} onJcClick={handleJcClick} onEditJc={handleOpenEditJcModal} onDeleteJc={handleDeleteJc} />
          )}

          {activeTab === "fiber-splice" && (
            <FiberSpliceManager
              junctionClosureId={selectedJc?.id || ""}
              junctionClosureName={selectedJc?.name || ""}
              onSpliceComplete={() => refetchRouteDetails()}
              capacity={routeDetails.route.capacity ?? undefined}
            />
          )}

          {activeTab === "segmentation" && (
            <CableSegmentationManager
              cableId={selectedRouteId || ""}
              cableName={routeDetails.route.route_name || ""}
              onSegmentationComplete={() => refetchRouteDetails()}
            />
          )}
        </div>
      )}

      {/* Modals */}

      <JcFormModal
        isOpen={isJcFormModalOpen}
        onClose={() => setIsJcFormModalOpen(false)}
        onSave={() => refetchRouteDetails()} // Refetch details when a JC is created/updated
        routeId={selectedRouteId}
        editingJc={editingJc}
        rkm={routeDetails?.route.current_rkm ?? null}
      />
    </div>
  );
}
