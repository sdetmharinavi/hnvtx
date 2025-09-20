// components/route-manager/RouteManager.tsx
'use client';

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
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';

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

  // Local UI state for JCs the user is planning to add
  const [plannedJCs, setPlannedJCs] = useState<Equipment[]>([]);
  const [branchConfig, setBranchConfig] = useState<BranchConfigMap>({});

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.routeDetails(selectedRouteId),
      });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <SearchableSelect
              options={initialRoutes.map((r) => ({
                value: r.id,
                label: r.route_name,
              }))}
              onChange={(val) => {
                setSelectedRouteId(val);

                const found = initialRoutes.find((r) => r.id === val);
                setSelectedRoute(found ? found.route_name : null);
              }}
              placeholder="Select a route..."
            />
          </div>

          {selectedRouteId && (
            <div
            onClick={() => console.log("placeholder for fetching route connection")}
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
                                    (routeDetails.route.distance_km *
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
                                      routeDetails.route.end_site.id
                                    }
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id: e.target.value,
                                        target_type:
                                          e.target.value ===
                                            routeDetails.route.start_site.id ||
                                          e.target.value ===
                                            routeDetails.route.end_site.id
                                            ? 'site'
                                            : prev?.target_type ?? 'site',
                                        distance_km:
                                          prev?.distance_km ??
                                          Math.min(
                                            2,
                                            Math.max(
                                              0.2,
                                              routeDetails.route.distance_km *
                                                0.1
                                            )
                                          ),
                                        tap_fibers: prev?.tap_fibers ?? 2,
                                      }))
                                    }
                                  >
                                    <option
                                      value={routeDetails.route.start_site.id}
                                    >
                                      Start site:{' '}
                                      {routeDetails.route.start_site.name}
                                    </option>
                                    <option
                                      value={routeDetails.route.end_site.id}
                                    >
                                      End site:{' '}
                                      {routeDetails.route.end_site.name}
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
                                          routeDetails.route.distance_km * 0.1
                                        )
                                      )
                                    }
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id:
                                          prev?.target_id ??
                                          routeDetails.route.end_site.id,
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
                                    max={routeDetails.route.capacity}
                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900"
                                    value={cfg?.tap_fibers ?? 2}
                                    onChange={(e) =>
                                      setBranchForJc(jc.id, (prev) => ({
                                        target_id:
                                          prev?.target_id ??
                                          routeDetails.route.end_site.id,
                                        target_type:
                                          prev?.target_type ?? 'site',
                                        distance_km:
                                          prev?.distance_km ??
                                          Math.min(
                                            2,
                                            Math.max(
                                              0.2,
                                              routeDetails.route.distance_km *
                                                0.1
                                            )
                                          ),
                                        tap_fibers: Math.min(
                                          routeDetails.route.capacity,
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
                <RouteVisualization
                  route={routeDetails.route}
                  equipment={allEquipmentOnRoute}
                  onRemoveJc={handleRemoveJc}
                />

                {evolutionMode === 'commit' && (
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
    </>
  );
}
