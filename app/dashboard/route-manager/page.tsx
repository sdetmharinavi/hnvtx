// path: app/dashboard/route-manager/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SearchableSelect } from "@/components/common/ui/select/SearchableSelect";
import { useDeleteJc, useOfcRoutesForSelection, useRouteDetails } from "@/hooks/database/route-manager-hooks";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { FaRoute } from "react-icons/fa";
import { Equipment } from "@/components/route-manager/types";
import { FiPlus } from "react-icons/fi";
import { JcFormModal } from "@/components/route-manager/JcFormModal";
import RouteVisualization from "@/components/route-manager/ui/RouteVisualization";
import { FiberSpliceManager } from "@/components/route-manager/FiberSpliceManager";

export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<Equipment | null>(null);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visualizer");

  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();
  const { data: routeDetails, isLoading: isLoadingDetails, isError: isErrorRouteDetails, error: errorRouteDetails, refetch: refetchRouteDetails } = useRouteDetails(selectedRouteId);
  const deleteJcMutation = useDeleteJc();

  const handleJcClick = (jc: Equipment) => {
    setSelectedJc(jc);
    setActiveTab("fiber-splice"); // Switch to splice manager on click
  };

  const handleOpenAddJcModal = () => {
    setEditingJc(null);
    setIsJcFormModalOpen(true);
  };

  const handleOpenEditJcModal = (jc: Equipment) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  };

  const handleDeleteJc = (jc: Equipment) => {
    if (window.confirm(`Are you sure you want to delete "${jc.name}"? This will re-calculate all segments.`)) {
        deleteJcMutation.mutate(jc.id);
    }
  };

  const routeOptions = routesForSelection?.map((r) => ({ value: r.id, label: r.route_name })) || [];

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Route Manager'
        description='Visualize routes, add junction closures, and manage fiber splices.'
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
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("visualizer")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "visualizer" ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Route Visualizer
            </button>
            <button
              onClick={() => setActiveTab("fiber-splice")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "fiber-splice" ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Fiber Splice Manager
            </button>
          </div>

          {activeTab === "visualizer" && (
            <RouteVisualization 
              routeDetails={routeDetails} 
              onJcClick={handleJcClick} 
              onEditJc={handleOpenEditJcModal} 
              onDeleteJc={handleDeleteJc} 
            />
          )}

          {activeTab === "fiber-splice" && (
            <FiberSpliceManager
              junctionClosureId={selectedJc?.id || routeDetails.equipment[0]?.id || null}
            />
          )}
        </div>
      )}

      <JcFormModal
        isOpen={isJcFormModalOpen}
        onClose={() => setIsJcFormModalOpen(false)}
        onSave={() => refetchRouteDetails()}
        routeId={selectedRouteId}
        editingJc={editingJc}
        rkm={routeDetails?.route.distance_km ?? null}
      />
    </div>
  );
}