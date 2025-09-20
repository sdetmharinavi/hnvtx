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
import { Button } from '@/components/common/ui';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import { JcFormModal } from '@/components/route-manager/JcFormModal';

// =================================================================
// Sub-component for visualizing the route topology
// =================================================================
interface RouteVisualizerProps {
  routeDetails: NonNullable<ReturnType<typeof useRouteDetails>['data']>;
  onJcClick: (jc: JunctionClosure) => void;
  onEditJc: (jc: JunctionClosure) => void; // <--- ADDED for editing
  onDeleteJc: (jc: JunctionClosure) => void; // <--- ADDED for deleting
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ routeDetails, onJcClick, onEditJc, onDeleteJc }) => {
    // ... (The content of this component remains exactly the same, but now it receives onEditJc and onDeleteJc)
    const { route, junction_closures } = routeDetails;
    const sortedJCs = [...junction_closures].sort((a, b) => (a.position_km || 0) - (b.position_km || 0));

    const points = [
      { type: 'node' as const, id: route.start_node.id, name: route.start_node.name, position: 0 },
      ...[...junction_closures].sort((a, b) => (a.position_km || 0) - (b.position_km || 0)).map(jc => ({ type: 'jc' as const, ...jc, position: jc.position_km || 0 })),
      { type: 'node' as const, id: route.end_node.id, name: route.end_node.name, position: route.current_rkm || 1 },
    ];
  
    // 2. Create segments between each consecutive point
    const segments = [];
    const totalDistance = route.current_rkm || 1; // Avoid division by zero
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];
      
      segments.push({
        id: `seg-${startPoint.id}-${endPoint.id}`,
        startPercentage: (startPoint.position / totalDistance) * 100,
        endPercentage: (endPoint.position / totalDistance) * 100,
        length: endPoint.position - startPoint.position,
      });
    }

    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-12">Route Topology</h3>
        <div className="relative flex items-center w-full h-16">
  
          {/* 3. Render each segment as a line */}
          {segments.map(seg => (
            <div
              key={seg.id}
              className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-300 dark:bg-gray-600 group cursor-pointer"
              style={{
                left: `${seg.startPercentage}%`,
                width: `${seg.endPercentage - seg.startPercentage}%`,
              }}
            >
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Tooltip for the segment */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Capacity: {route.capacity}F<br/>
                Length: {seg.length.toFixed(2)} km
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
          
          {/* 4. Render each point (Node or JC) on top of the lines */}
          <div className="relative flex justify-between w-full">
              {points.map((point, index) => {
                const leftPercentage = Math.min(100, Math.max(0, (point.position / totalDistance) * 100));
                return (
                  <div
                    key={`${point.type}-${point.id}-${index}`}
                    className="relative flex flex-col items-center group z-10" // <-- Add z-10
                    style={{ position: 'absolute', left: `${leftPercentage}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-4
                        ${point.type === 'node'
                          ? 'bg-blue-600 border-white dark:border-gray-800'
                          : 'bg-green-500 border-white dark:border-gray-800 cursor-pointer hover:scale-110 transition-transform'
                        }`}
                      onClick={() => point.type === 'jc' && onJcClick(point as JunctionClosure)}
                    >
                      <span className="text-white font-bold text-sm">{point.type === 'node' ? 'N' : 'JC'}</span>
                    </div>
                    <div className="absolute top-12 text-center w-28">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={point.name}>{point.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{point.position} km</p>
                    </div>
                    {point.type === 'jc' && (
                      <div className="absolute -top-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button size="xs" variant="outline" onClick={() => onEditJc(point as JunctionClosure)} title="Edit JC">
                              <FiEdit className="h-3 w-3" />
                          </Button>
                          <Button size="xs" variant="danger" onClick={() => onDeleteJc(point as JunctionClosure)} title="Delete JC">
                              <FiTrash2 className="h-3 w-3" />
                          </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };
  
// =================================================================
// Main Page Component
// =================================================================
export default function RouteManagerPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JunctionClosure | null>(null);
  const [editingJc, setEditingJc] = useState<JunctionClosure | null>(null); // <--- For the JC form
  const [isSpliceModalOpen, setIsSpliceModalOpen] = useState(false);
  const [isJcFormModalOpen, setIsJcFormModalOpen] = useState(false); // <--- State for JC form modal

  // Data fetching and mutation hooks
  const { data: routesForSelection, isLoading: isLoadingRoutes } = useOfcRoutesForSelection();
  const { data: routeDetails, isLoading: isLoadingDetails, isError, error, refetch: refetchRouteDetails } = useRouteDetails(selectedRouteId);
  const deleteJcMutation = useDeleteJc();

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

  const handleDeleteJc = (jc: JunctionClosure) => {
      if (window.confirm(`Are you sure you want to delete the junction closure "${jc.name}"? This action cannot be undone.`)) {
          deleteJcMutation.mutate(jc.id);
      }
  };

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

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          Error loading route details: {error.message}
        </div>
      )}

      {routeDetails && (
        <RouteVisualizer
          routeDetails={routeDetails}
          onJcClick={handleJcClick}
          onEditJc={handleOpenEditJcModal}
          onDeleteJc={handleDeleteJc}
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
      />
    </div>
  );
}
