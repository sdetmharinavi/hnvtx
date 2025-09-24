import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/components/route-manager/queryKeys';
import {
  projectSegments,
  projectDefaultSplices,
} from '@/components/route-manager/logic/project';
import type { BranchConfigMap } from '@/components/route-manager/logic/project';
import { isRouteDetailsPayload } from '@/components/route-manager/schemas';
import {
  RouteForSelection,
  RouteDetailsPayload,
  Equipment,
  CableSegment,
  FiberSplice,
  EvolutionCommitPayload,
} from '@/components/route-manager/types';
import AddJcForm from '@/components/route-manager/ui/AddJcForm';
import RouteVisualization from '@/components/route-manager/ui/RouteVisualization';
import CommitView from '@/components/route-manager/ui/CommitView';
import { FiberSpliceManager } from '@/components/route-manager/FiberSpliceManager';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { JcFormModal } from '@/components/route-manager/JcFormModal';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { OfcConnectionRowsWithCount } from '@/types/view-row-types';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import { usePagedOfcConnectionsComplete } from '@/hooks/database';

// 1. ADAPTER HOOK: Makes `useOfcData` compatible with `useCrudManager`
const useOfcConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<OfcConnectionRowsWithCount> => {
  const { currentPage, pageLimit, searchQuery } = params;
  const supabase = createClient();
  const { id } = useParams();
  const cableId = id as string;

  const { data, isLoading, error, refetch } = usePagedOfcConnectionsComplete(
    supabase,
    {
      filters: { ofc_id: cableId, ...(searchQuery ? { searchQuery } : {}) },
      limit: 300,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  } as unknown as DataQueryHookReturn<OfcConnectionRowsWithCount>;
};

// --- Client-Side API Functions ---
const fetchRouteDetails = async (
  routeId: string
): Promise<RouteDetailsPayload> => {
  const res = await fetch(`/api/route/${routeId}`);
  if (!res.ok) throw new Error('Failed to fetch route details');
  const data = await res.json();
  if (!isRouteDetailsPayload(data)) {
    throw new Error('Invalid route details payload received from server');
  }
  return data;
};

const commitEvolution = async (vars: {
  routeId: string;
  payload: EvolutionCommitPayload;
}) => {
  const res = await fetch(`/api/route/${vars.routeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vars.payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Commit failed');
  }
  return res.json();
};

export default function RouteManager({
  initialRoutes,
  isRouteLoading,
}: {
  initialRoutes: { id: string; route_name: string }[];
  isRouteLoading: boolean;
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [evolutionMode, setEvolutionMode] = useState<
    'view' | 'add_jc' | 'commit'
  >('view');

  console.log(initialRoutes);

  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: cableConnectionsData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading: isRouteDetailsLoading,
    // isMutating,
    // error,
    refetch,
    pagination,
    // search,
    // filters: crudFilters,
    editModal,
    // viewModal,
    // bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_connections', OfcConnectionRowsWithCount>({
    tableName: 'ofc_connections',
    dataQueryHook: useOfcConnectionsData,
  });

  // Local UI state for JCs the user is planning to add
  const [plannedJCs, setPlannedJCs] = useState<Equipment[]>([]);
  const [branchConfig, setBranchConfig] = useState<BranchConfigMap>({});
  const [selectedJcForSplice, setSelectedJcForSplice] = useState<Equipment | null>(null);
  const [showJcModal, setShowJcModal] = useState(false);
  const [editingJc, setEditingJc] = useState<Equipment | null>(null);
  const [activeTab, setActiveTab] = useState<'visualization' | 'fiber-splice' | 'commit'>('visualization');
  console.log('plannedJCs', plannedJCs);
  console.log('branchConfig', branchConfig);
  console.log('selectedRouteId', selectedRouteId);
  console.log('selectedRoute', selectedRoute);
  console.log('evolutionMode', evolutionMode);
  console.log('isRouteDetailsLoading', isRouteDetailsLoading);

  const queryClient = useQueryClient();

  // --- DATA FETCHING with React Query ---
  const {
    data: routeDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.routeDetails(selectedRouteId),
    queryFn: () => fetchRouteDetails(selectedRouteId!),
    enabled: !!selectedRouteId, // Query only runs when a route is selected
  });

  // In v5, query callbacks like onSuccess were removed. Mirror that behavior here.
  useEffect(() => {
    if (selectedRouteId && routeDetails) {
      // Reset local state when a new route is successfully loaded
      setPlannedJCs([]);
      setBranchConfig({});
      setEvolutionMode('view');
    }
  }, [selectedRouteId, routeDetails]);

  // --- DATA MUTATION with React Query ---
  const { mutate: commitMutation, isPending: isCommitting } = useMutation({
    mutationFn: commitEvolution,
    onSuccess: (data) => {
      alert(data.message);
      // Invalidate queries to refetch fresh server state
      if (selectedRouteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.routeDetails(selectedRouteId),
        });
      }
      // You might also want to refetch the initial list if statuses change
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
      setSelectedRouteId(null); // Deselect route
    },
    onError: (err) => alert(`Error: ${err.message}`),
  });

  // --- DERIVED STATE with useMemo ---
  // Combines existing equipment from the DB with locally planned JCs
  const allEquipmentOnRoute = useMemo(
    () => [...(routeDetails?.equipment || []), ...plannedJCs],
    [routeDetails, plannedJCs]
  );

  // Projects segments and splices based on the combined equipment list
  const projectedSegments = useMemo(() => {
    if (!routeDetails) return [] as CableSegment[];
    return projectSegments(
      routeDetails.route,
      allEquipmentOnRoute,
      branchConfig
    );
  }, [routeDetails, allEquipmentOnRoute, branchConfig]);

  const projectedSplices = useMemo(() => {
    if (!routeDetails) return [] as FiberSplice[];
    return projectDefaultSplices(
      routeDetails.route,
      projectedSegments,
      allEquipmentOnRoute,
      branchConfig
    );
  }, [routeDetails, projectedSegments, allEquipmentOnRoute, branchConfig]);

  const handleAddJc = (newJcData: Omit<Equipment, 'id' | 'status'>) => {
    const newJc: Equipment = {
      ...newJcData,
      id: `planned-${Date.now()}`, // Temporary client-side ID
      status: 'planned',
    };
    setPlannedJCs((prev) => [...prev, newJc]);
  };

  const handleRemoveJc = (jcId: string) => {
    setPlannedJCs((prev) => prev.filter((jc) => jc.id !== jcId));
    setBranchConfig((prev) => {
      const { [jcId]: _, ...rest } = prev;
      return rest;
    });
  };

  const setBranchForJc = (
    jcId: string,
    updater: (
      prev: BranchConfigMap[string] | undefined
    ) => BranchConfigMap[string]
  ) => {
    setBranchConfig((prev) => ({
      ...prev,
      [jcId]: updater(prev[jcId]),
    }));
  };

  const handleCommit = () => {
    if (!selectedRouteId || plannedJCs.length === 0) return;

    // Prepare payload for the API
    const payload: EvolutionCommitPayload = {
      plannedEquipment: plannedJCs.map(({ id, status, ...rest }) => rest), // Remove client-only fields
      plannedSegments: projectedSegments.map(({ id, ...rest }) => rest),
      plannedSplices: projectedSplices.map(({ id, ...rest }) => rest),
    };

    commitMutation({ routeId: selectedRouteId, payload });
  };

  const handleJcClick = (jc: Equipment) => {
    setSelectedJcForSplice(jc);
  };

  const handleEditJc = (jc: Equipment) => {
    setEditingJc(jc);
    setShowJcModal(true);
  };

  const handleDeleteJc = (jc: Equipment) => {
    handleRemoveJc(jc.id);
  };

  const handleCloseJcModal = () => {
    setShowJcModal(false);
    setEditingJc(null);
  };

  const handleSpliceComplete = () => {
    // Refresh data after splice configuration
    refetch();
  };

  const getStatusColor = (status: string) => {
    // ... your getEvolutionStatusColor logic
  };

  return (
    <>
      {isRouteLoading ? (
        <p>Loading routes...</p>
      ) : (
        <>
          {/* Route Selection */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <SearchableSelect
              className="w-full"
              clearable={true}
              options={initialRoutes.map((r) => ({
                value: r.id,
                label: r.route_name,
              }))}
              onChange={(val: string | null) => {
                setSelectedRouteId(val);

                const found = initialRoutes.find((r) => r.id === val);
                setSelectedRoute(found ? found.route_name : null);
              }}
              placeholder="Select a route..."
            />
          </div>

          {selectedRouteId && (
            <div
              onClick={() =>
                console.log('placeholder for fetching route connection')
              }
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 dark:border-gray-600 hover:border-blue-300`}
            >
              <div className="font-medium">{selectedRoute}</div>
              {/* <span className={`px-2 py-1 rounded text-xs mt-2 inline-block ${getStatusColor(route.evolution_status)}`}>
              {route.evolution_status.replace('_', ' ')}
            </span> */}
            </div>
          )}

          {isLoading && <p>Loading route details...</p>}
          {isError && <p className="text-red-500">Error: {error?.message}</p>}

          {routeDetails && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Panel: Info and Forms */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Route Details</h3>
                  {/* ... display details from `routeDetails.route` ... */}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Evolution Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEvolutionMode('view')}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        evolutionMode === 'view'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-transparent text-blue-600 border-blue-600'
                      }`}
                      disabled={!selectedRouteId}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEvolutionMode('add_jc')}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        evolutionMode === 'add_jc'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-transparent text-green-600 border-green-600'
                      }`}
                      disabled={!selectedRouteId}
                    >
                      Add Junction Closure
                    </button>
                    <button
                      onClick={() => setEvolutionMode('commit')}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        evolutionMode === 'commit'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-transparent text-purple-600 border-purple-600'
                      }`}
                      disabled={!selectedRouteId || plannedJCs.length === 0}
                      title={
                        plannedJCs.length === 0
                          ? 'Add at least one JC to commit'
                          : ''
                      }
                    >
                      Review & Commit
                    </button>
                  </div>
                </div>

                {evolutionMode === 'add_jc' && (
                  <AddJcForm route={routeDetails.route} onAddJc={handleAddJc} />
                )}

                {/* Branch Configuration for planned branching JCs */}
                {plannedJCs.some(
                  (j) => j.attributes.jc_type === 'branching'
                ) && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Branch Configuration</h3>
                    <div className="space-y-4">
                      {plannedJCs
                        .filter((j) => j.attributes.jc_type === 'branching')
                        .map((jc) => {
                          const cfg = branchConfig[jc.id];
                          return (
                            <div key={jc.id} className="border rounded p-3">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{jc.name}</div>
                                <span className="text-xs text-gray-500">
                                  @{' '}
                                  {(
                                    ((routeDetails.route.current_rkm || 0) *
                                      jc.attributes.position_on_route) /
                                    100
                                  ).toFixed(1)}{' '}
                                  km
                                </span>
                              </div>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="text-sm">
                                  <span className="block mb-1 text-gray-600 dark:text-gray-300">
                                    Branch endpoint
                                  </span>
                                  <select
                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900"
                                    value={
                                      cfg?.target_id ??
                                      (routeDetails.route.en_id || '')
                                    }
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id: e.target.value,
                                        target_type:
                                          e.target.value ===
                                            (routeDetails.route.sn_id || '') ||
                                          e.target.value ===
                                            (routeDetails.route.en_id || '')
                                            ? 'site'
                                            : prev?.target_type ?? 'site',
                                        distance_km:
                                          prev?.distance_km ??
                                          Math.min(
                                            2,
                                            Math.max(
                                              0.2,
                                              (routeDetails.route.current_rkm || 0) *
                                                0.1
                                            )
                                          ),
                                        tap_fibers: prev?.tap_fibers ?? 2,
                                      }))
                                    }
                                  >
                                    <option
                                      value={routeDetails.route.sn_id || ''}
                                    >
                                      Start site:{' '}
                                      {routeDetails.route.sn_name || 'Unknown'}
                                    </option>
                                    <option
                                      value={routeDetails.route.en_id || ''}
                                    >
                                      End site:{' '}
                                      {routeDetails.route.en_name || 'Unknown'}
                                    </option>
                                  </select>
                                </label>
                                <label className="text-sm">
                                  <span className="block mb-1 text-gray-600 dark:text-gray-300">
                                    Branch length (km)
                                  </span>
                                  <input
                                    type="number"
                                    min={0.1}
                                    step={0.1}
                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900"
                                    value={
                                      cfg?.distance_km ??
                                      Math.min(
                                        2,
                                        Math.max(
                                          0.2,
                                          (routeDetails.route.current_rkm || 0) * 0.1
                                        )
                                      )
                                    }
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id:
                                          prev?.target_id ??
                                          (routeDetails.route.en_id || ''),
                                        target_type:
                                          prev?.target_type ?? 'site',
                                        distance_km: Math.max(
                                          0.1,
                                          Number(e.target.value || 0)
                                        ),
                                        tap_fibers: prev?.tap_fibers ?? 2,
                                      }))
                                    }
                                  />
                                </label>
                                <label className="text-sm">
                                  <span className="block mb-1 text-gray-600 dark:text-gray-300">
                                    Tap fibers
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={routeDetails.route.capacity || 100}
                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900"
                                    value={cfg?.tap_fibers ?? 2}
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id:
                                          prev?.target_id ??
                                          (routeDetails.route.en_id || ''),
                                        target_type:
                                          prev?.target_type ?? 'site',
                                        distance_km:
                                          prev?.distance_km ??
                                          Math.min(
                                            2,
                                            Math.max(
                                              0.2,
                                              (routeDetails.route.current_rkm || 0) *
                                                0.1
                                            )
                                          ),
                                        tap_fibers: Math.min(
                                          routeDetails.route.capacity || 100,
                                          Math.max(
                                            1,
                                            Number(e.target.value || 1)
                                          )
                                        ),
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle and Right Panels */}
              <div className="xl:col-span-2 space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('visualization')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'visualization'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Route Visualization
                  </button>
                  <button
                    onClick={() => setActiveTab('fiber-splice')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'fiber-splice'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    disabled={!selectedJcForSplice}
                  >
                    Fiber Splice Manager
                  </button>
                  <button
                    onClick={() => setActiveTab('commit')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'commit'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    disabled={plannedJCs.length === 0}
                  >
                    Review & Commit
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'visualization' && routeDetails && (
                  <RouteVisualization
                    routeDetails={routeDetails}
                    onJcClick={handleJcClick}
                    onEditJc={handleEditJc}
                    onDeleteJc={handleDeleteJc}
                  />
                )}

                {activeTab === 'fiber-splice' && selectedJcForSplice && (
                  <FiberSpliceManager
                    junctionClosureId={selectedJcForSplice.id}
                    junctionClosureName={selectedJcForSplice.name}
                    onSpliceComplete={handleSpliceComplete}
                  />
                )}

                {activeTab === 'commit' && (
                  <CommitView
                    equipment={plannedJCs}
                    segments={projectedSegments}
                    splices={projectedSplices}
                    onCommit={handleCommit}
                    isCommitting={isCommitting}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
      <JcFormModal
        isOpen={showJcModal}
        onClose={handleCloseJcModal}
        onSave={() => refetch()}
        routeId={selectedRouteId}
        editingJc={editingJc}
        rkm={routeDetails?.route.current_rkm ?? null}
      />
    </>
  );
}
