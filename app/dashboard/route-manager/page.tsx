// path: app/dashboard/route-manager/page.tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { useDeleteJc, useOfcRoutesForSelection, useRouteDetails } from '@/hooks/database/route-manager-hooks';
import { PageSpinner } from '@/components/common/ui/LoadingSpinner';
import { FaRoute } from 'react-icons/fa';
import { JunctionClosure } from '@/components/route-manager/types';
import { SpliceMatrixModal } from '@/components/route-manager/SpliceMatrixModal'; // <--- IMPORT THE NEW MODAL
import { FiPlus } from 'react-icons/fi';
import { JcFormModal } from '@/components/route-manager/JcFormModal';
import { RouteVisualizer } from '@/components/route-manager/RouteVisualizer';
import { usePagedData } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';


// =================================================================
// Main Page Component
// =================================================================
export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JunctionClosure | null>(null);
  const [editingJc, setEditingJc] = useState<JunctionClosure | null>(null); // <--- For the JC form
  const [isSpliceModalOpen, setIsSpliceModalOpen] = useState(false);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false); // <--- State for JC form modal

  const supabase = createClient();

  // Data fetching and mutation hooks
  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();
  const { data: jcData, isLoading: isLoadingJc, isError: isErrorJc } = usePagedData<JunctionClosure>(
    supabase,
    'v_junction_closures_complete', // Just pass the view name as a string
    {
      limit: 20,
      offset: 0,
      orderBy: 'name',
      filters: { status: true }
    }
  );
  const { data: routeDetails, isLoading: isLoadingDetails, isError: isErrorRouteDetails, error: errorRouteDetails, refetch: refetchRouteDetails } = useRouteDetails(selectedRouteId);
  const deleteJcMutation = useDeleteJc();

  console.log("jcData",jcData);

  

  const handleJcClick = (jc: JunctionClosure) => {
    setSelectedJc(jc);
    setIsSpliceModalOpen(true);
  };

  const handleOpenAddJcModal = () => {
      setEditingJc(null); // Ensure we're in "create" mode
      setIsJcFormModalOpen(true);
  }

  const handleOpenEditJcModal = (jc: JunctionClosure) => {
    setEditingJc(jc);
    setIsJcFormModalOpen(true);
  };

  // const handleDeleteJc = (jc: JunctionClosure) => {
  //     if (window.confirm(`Are you sure you want to delete the junction closure "${jc.name}"? This action cannot be undone.`)) {
  //         deleteJcMutation.mutate(jc.id);
  //     }
  // };

  const routeOptions = routesForSelection?.map(r => ({ value: r.id, label: r.route_name })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Manager"
        description="Visualize and manage the fiber splices within your OFC routes."
        icon={<FaRoute />}
        isLoading={isLoadingRoutes}
        actions={[
            {
                label: 'Add Junction Closure',
                onClick: handleOpenAddJcModal,
                variant: 'primary',
                leftIcon: <FiPlus />,
                disabled: !selectedRouteId || isLoadingDetails,
            }
        ]}
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select an OFC Route to Manage
        </label>
        <SearchableSelect
          options={routeOptions}
          value={selectedRouteId || ''}
          onChange={(value) => setSelectedRouteId(value)}
          placeholder={isLoadingRoutes ? "Loading routes..." : "Search and select a route"}
          disabled={isLoadingRoutes}
          clearable
        />
      </div>

      {isLoadingDetails && <PageSpinner text="Loading route details..." />}

      {/* {isError && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          Error loading route details: {error.message}
        </div>
      )} */}

      {routeDetails && (
        <RouteVisualizer
          routeDetails={routeDetails}
          onJcClick={handleJcClick}
          onEditJc={handleOpenEditJcModal}
          // onDeleteJc={handleDeleteJc}
          onDeleteJc={() => {}}
        />
      )}

      {/* Modals */}
      <SpliceMatrixModal
        jc={selectedJc}
        isOpen={isSpliceModalOpen}
        onClose={() => setIsSpliceModalOpen(false)}
      />

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
