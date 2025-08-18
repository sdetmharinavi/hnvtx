import { useState, useEffect } from 'react';

interface ExistingRoute {
  id: string;
  route_name: string;
  capacity: number;
  start_node: string;
  end_node: string;
  current_rkm: number;
  status: boolean;
  // New fields for evolution tracking
  evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
  has_active_segments: boolean;
}

interface JunctionClosure {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  jc_type: 'inline' | 'branching' | 'terminal';
  capacity: number;
  parent_route_id: string;
  position_on_route: number; // 0-100%
  status: boolean;
}

interface CableSegment {
  id: string;
  original_route_id: string;
  segment_order: number;
  start_point_id: string;
  end_point_id: string;
  start_point_type: 'node' | 'jc';
  end_point_type: 'node' | 'jc';
  fiber_count: number;
  distance_km: number;
  is_active: boolean;
}

interface FiberSplice {
  id: string;
  jc_id: string;
  incoming_segment_id: string;
  incoming_fiber_number: number;
  outgoing_segment_id: string;
  outgoing_fiber_number: number;
  splice_type: 'through' | 'tap' | 'split';
  splice_date: string;
  loss_db: number;
  status: 'active' | 'spare' | 'faulty';
}

const RouteEvolutionManager = () => {
  const [selectedRoute, setSelectedRoute] = useState<ExistingRoute | null>(null);
  const [evolutionMode, setEvolutionMode] = useState<'view' | 'add_jc' | 'configure_splices' | 'commit'>('view');
  const [jcsOnRoute, setJcsOnRoute] = useState<JunctionClosure[]>([]);
  const [projectedSegments, setProjectedSegments] = useState<CableSegment[]>([]);
  const [projectedSplices, setProjectedSplices] = useState<FiberSplice[]>([]);
  
  // Mock existing routes with evolution status
  const [existingRoutes] = useState<ExistingRoute[]>([
    {
      id: 'route-1',
      route_name: 'NodeA ⇔ NodeB _ 1',
      capacity: 24,
      start_node: 'NodeA',
      end_node: 'NodeB',
      current_rkm: 15.5,
      status: true,
      evolution_status: 'simple',
      has_active_segments: false
    },
    {
      id: 'route-2', 
      route_name: 'NodeC ⇔ NodeD _ 1',
      capacity: 48,
      start_node: 'NodeC',
      end_node: 'NodeD', 
      current_rkm: 22.3,
      status: true,
      evolution_status: 'with_jcs',
      has_active_segments: false
    },
    {
      id: 'route-3',
      route_name: 'NodeE ⇔ NodeF _ 1',
      capacity: 96,
      start_node: 'NodeE',
      end_node: 'NodeF',
      current_rkm: 8.7,
      status: true,
      evolution_status: 'fully_segmented',
      has_active_segments: true
    }
  ]);

  const [newJC, setNewJC] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    jc_type: 'inline' as const,
    capacity: 24,
    position_on_route: 50
  });

  // Load existing JCs for selected route
  useEffect(() => {
    if (!selectedRoute) {
      setJcsOnRoute([]);
      return;
    }

    // Mock loading existing JCs for the route
    if (selectedRoute.evolution_status === 'with_jcs' || selectedRoute.evolution_status === 'fully_segmented') {
      // This would be a real API call: loadJCsForRoute(selectedRoute.id)
      const mockExistingJCs: JunctionClosure[] = [
        {
          id: 'jc-existing-1',
          name: 'JC-001',
          latitude: 23.5254,
          longitude: 87.2926,
          jc_type: 'inline',
          capacity: 24,
          parent_route_id: selectedRoute.id,
          position_on_route: 33,
          status: true
        }
      ];
      setJcsOnRoute(selectedRoute.id === 'route-2' ? mockExistingJCs : []);
    } else {
      setJcsOnRoute([]);
    }
  }, [selectedRoute]);

  // Generate projected segments when JCs change
  useEffect(() => {
    if (!selectedRoute) {
      setProjectedSegments([]);
      return;
    }

    // Sort JCs by position on route
    const sortedJCs = [...jcsOnRoute]
      .filter(jc => jc.status)
      .sort((a, b) => a.position_on_route - b.position_on_route);
    
    const segments: CableSegment[] = [];
    let segmentOrder = 1;

    // Create all route points (start node → JCs → end node)
    const allPoints = [
      { 
        id: selectedRoute.start_node, 
        type: 'node' as const, 
        name: selectedRoute.start_node,
        position: 0 
      },
      ...sortedJCs.map(jc => ({ 
        id: jc.id, 
        type: 'jc' as const, 
        name: jc.name,
        position: jc.position_on_route 
      })),
      { 
        id: selectedRoute.end_node, 
        type: 'node' as const, 
        name: selectedRoute.end_node,
        position: 100 
      }
    ];

    // Generate segments between consecutive points
    for (let i = 0; i < allPoints.length - 1; i++) {
      const startPoint = allPoints[i];
      const endPoint = allPoints[i + 1];
      const segmentDistance = selectedRoute.current_rkm * (endPoint.position - startPoint.position) / 100;

      segments.push({
        id: `segment-${selectedRoute.id}-${segmentOrder}`,
        original_route_id: selectedRoute.id,
        segment_order: segmentOrder,
        start_point_id: startPoint.id,
        end_point_id: endPoint.id,
        start_point_type: startPoint.type,
        end_point_type: endPoint.type,
        fiber_count: selectedRoute.capacity,
        distance_km: Math.round(segmentDistance * 100) / 100,
        is_active: true
      });
      segmentOrder++;
    }

    setProjectedSegments(segments);
  }, [selectedRoute, jcsOnRoute]);

  const addJCToRoute = () => {
    if (!newJC.name || !selectedRoute) return;

    const jc: JunctionClosure = {
      id: `jc-${Date.now()}`,
      name: newJC.name,
      latitude: newJC.latitude,
      longitude: newJC.longitude,
      jc_type: newJC.jc_type,
      capacity: newJC.capacity,
      parent_route_id: selectedRoute.id,
      position_on_route: newJC.position_on_route,
      status: true
    };

    setJcsOnRoute([...jcsOnRoute, jc]);
    
    // Reset form
    setNewJC({
      name: '',
      latitude: 0,
      longitude: 0,
      jc_type: 'inline',
      capacity: 24,
      position_on_route: 50
    });
  };

  const removeJC = (jcId: string) => {
    setJcsOnRoute(jcsOnRoute.filter(jc => jc.id !== jcId));
  };

  const generateDefaultSplices = () => {
    const splices: FiberSplice[] = [];
    
    projectedSegments.forEach((segment, segIndex) => {
      if (segment.end_point_type === 'jc') {
        const nextSegment = projectedSegments[segIndex + 1];
        if (nextSegment) {
          // Create through splices for all fibers by default
          for (let fiberNum = 1; fiberNum <= segment.fiber_count; fiberNum++) {
            splices.push({
              id: `splice-${segment.id}-${nextSegment.id}-${fiberNum}`,
              jc_id: segment.end_point_id,
              incoming_segment_id: segment.id,
              incoming_fiber_number: fiberNum,
              outgoing_segment_id: nextSegment.id,
              outgoing_fiber_number: fiberNum,
              splice_type: 'through',
              splice_date: new Date().toISOString().split('T')[0],
              loss_db: 0.1,
              status: 'active'
            });
          }
        }
      }
    });

    setProjectedSplices(splices);
  };

  const commitEvolution = async () => {
    if (!selectedRoute || jcsOnRoute.length === 0) return;

    const evolutionData = {
      originalRoute: selectedRoute,
      junctionClosures: jcsOnRoute,
      cableSegments: projectedSegments,
      fiberSplices: projectedSplices,
      evolutionType: 'add_jc_and_segment',
      notes: `Added ${jcsOnRoute.length} JCs and split into ${projectedSegments.length} segments`
    };

    // This would be your actual API calls:
    // await createJunctionClosures(jcsOnRoute);
    // await createCableSegments(projectedSegments);
    // await createFiberSplices(projectedSplices);
    // await logRouteEvolution(evolutionData);
    // await updateRouteStatus(selectedRoute.id, { evolution_status: 'fully_segmented' });
    
    console.log('Evolution data to commit:', evolutionData);
    alert('Route evolution committed! Check console for details.');
    
    // Reset form
    setSelectedRoute(null);
    setJcsOnRoute([]);
    setEvolutionMode('view');
  };

  const getEvolutionStatusColor = (status: string) => {
    switch (status) {
      case 'simple': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'with_jcs': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'fully_segmented': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Route Evolution Manager v2
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Evolve simple routes by adding Junction Closures and creating cable segments
        </p>
      </div>

      {/* Route Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Route to Evolve
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingRoutes.map(route => (
            <div
              key={route.id}
              onClick={() => {
                setSelectedRoute(route);
                setEvolutionMode('view');
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRoute?.id === route.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                {route.route_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>{route.capacity} fibers • {route.current_rkm} km</div>
                <div className="flex justify-between items-center">
                  <span>{route.start_node} → {route.end_node}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getEvolutionStatusColor(route.evolution_status)}`}>
                    {route.evolution_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRoute && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Route Info & Actions */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Route Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{selectedRoute.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-gray-900 dark:text-white font-mono">{selectedRoute.route_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                  <span className="text-gray-900 dark:text-white">{selectedRoute.capacity} fibers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                  <span className="text-gray-900 dark:text-white">{selectedRoute.current_rkm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getEvolutionStatusColor(selectedRoute.evolution_status)}`}>
                    {selectedRoute.evolution_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Evolution Actions */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Evolution Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setEvolutionMode('add_jc')}
                  disabled={selectedRoute.evolution_status === 'fully_segmented'}
                  className={`w-full p-2 rounded-md text-left text-sm ${
                    evolutionMode === 'add_jc' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  📍 Add Junction Closure
                </button>
                <button
                  onClick={() => {
                    generateDefaultSplices();
                    setEvolutionMode('configure_splices');
                  }}
                  disabled={jcsOnRoute.length === 0}
                  className={`w-full p-2 rounded-md text-left text-sm ${
                    evolutionMode === 'configure_splices' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  🔌 Configure Splices
                </button>
                <button
                  onClick={() => setEvolutionMode('commit')}
                  disabled={jcsOnRoute.length === 0 || projectedSegments.length === 0}
                  className={`w-full p-2 rounded-md text-left text-sm ${
                    evolutionMode === 'commit' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  ✅ Review & Commit
                </button>
              </div>
            </div>

            {/* Add JC Form */}
            {evolutionMode === 'add_jc' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Junction Closure</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      JC Name *
                    </label>
                    <input
                      type="text"
                      value={newJC.name}
                      onChange={(e) => setNewJC({...newJC, name: e.target.value})}
                      placeholder="JC-ABC-001"
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newJC.latitude || ''}
                        onChange={(e) => setNewJC({...newJC, latitude: Number(e.target.value)})}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newJC.longitude || ''}
                        onChange={(e) => setNewJC({...newJC, longitude: Number(e.target.value)})}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position on Route: {newJC.position_on_route}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={newJC.position_on_route}
                      onChange={(e) => setNewJC({...newJC, position_on_route: Number(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      ~{(selectedRoute.current_rkm * newJC.position_on_route / 100).toFixed(1)} km from {selectedRoute.start_node}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        JC Type
                      </label>
                      <select
                        value={newJC.jc_type}
                        onChange={(e) => setNewJC({...newJC, jc_type: e.target.value as any})}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="inline">Inline</option>
                        <option value="branching">Branching</option>
                        <option value="terminal">Terminal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Splice Capacity
                      </label>
                      <select
                        value={newJC.capacity}
                        onChange={(e) => setNewJC({...newJC, capacity: Number(e.target.value)})}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={24}>24 splice</option>
                        <option value={48}>48 splice</option>
                        <option value={96}>96 splice</option>
                        <option value={144}>144 splice</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addJCToRoute}
                    disabled={!newJC.name || newJC.latitude === 0 || newJC.longitude === 0}
                    className="w-full p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    Add JC to Route
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Middle Panel - Route Visualization */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Route Visualization
            </h3>
            
            {selectedRoute && (
              <div className="space-y-4">
                {/* Route Path Diagram */}
                <div className="relative">
                  <div className="flex items-center space-x-2 overflow-x-auto pb-4">
                    {/* Start Node */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        N
                      </div>
                      <div className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate">
                        {selectedRoute.start_node}
                      </div>
                      <div className="text-xs text-gray-500">0%</div>
                    </div>

                    {/* JCs along the route */}
                    {jcsOnRoute
                      .filter(jc => jc.status)
                      .sort((a, b) => a.position_on_route - b.position_on_route)
                      .map((jc) => (
                        <div key={jc.id} className="flex items-center">
                          <div className="w-16 h-0.5 bg-gray-400"></div>
                          <div className="flex-shrink-0 text-center relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              jc.jc_type === 'branching' ? 'bg-orange-500' : 
                              jc.jc_type === 'terminal' ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              JC
                            </div>
                            <div className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate">
                              {jc.name}
                            </div>
                            <div className="text-xs text-gray-500">{jc.position_on_route}%</div>
                            {evolutionMode === 'add_jc' && (
                              <button
                                onClick={() => removeJC(jc.id)}
                                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* End Node */}
                    <div className="flex items-center">
                      <div className="w-16 h-0.5 bg-gray-400"></div>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          N
                        </div>
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate">
                          {selectedRoute.end_node}
                        </div>
                        <div className="text-xs text-gray-500">100%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JCs Summary */}
                {jcsOnRoute.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Junction Closures on Route:
                    </div>
                    {jcsOnRoute.map((jc) => (
                      <div key={jc.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-gray-700 rounded">
                        <span className="font-medium">{jc.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded ${
                            jc.jc_type === 'branching' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                            jc.jc_type === 'terminal' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {jc.jc_type}
                          </span>
                          <span className="text-gray-500">{jc.capacity}f</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Projected Segments */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {evolutionMode === 'configure_splices' ? 'Splice Configuration' : 'Projected Cable Segments'}
              </h3>
              {evolutionMode === 'commit' && (
                <button
                  onClick={commitEvolution}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  Commit Evolution
                </button>
              )}
            </div>

            {evolutionMode === 'configure_splices' && projectedSplices.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure fiber splicing at each Junction Closure. Default: all fibers pass through.
                </div>
                {/* Splice Configuration Table */}
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">JC</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incoming Segment</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outgoing Segment</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fiber</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Splice Type</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {projectedSplices.map((splice) => {
        const jc = jcsOnRoute.find(j => j.id === splice.jc_id);
        const incomingSegment = projectedSegments.find(s => s.id === splice.incoming_segment_id);
        const outgoingSegment = projectedSegments.find(s => s.id === splice.outgoing_segment_id);
        
        return (
          <tr key={splice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {jc?.name || 'Unknown JC'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {incomingSegment?.start_point_id} → {incomingSegment?.end_point_id}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {outgoingSegment?.start_point_id} → {outgoingSegment?.end_point_id}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              #{splice.incoming_fiber_number} → #{splice.outgoing_fiber_number}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <select
                value={splice.splice_type}
                onChange={(e) => {
                  const updatedSplices = projectedSplices.map(s => 
                    s.id === splice.id ? {...s, splice_type: e.target.value as any} : s
                  );
                  setProjectedSplices(updatedSplices);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1 text-xs"
              >
                <option value="through">Through</option>
                <option value="tap">Tap</option>
                <option value="split">Split</option>
              </select>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <select
                value={splice.status}
                onChange={(e) => {
                  const updatedSplices = projectedSplices.map(s => 
                    s.id === splice.id ? {...s, status: e.target.value as any} : s
                  );
                  setProjectedSplices(updatedSplices);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1 text-xs"
              >
                <option value="active">Active</option>
                <option value="spare">Spare</option>
                <option value="faulty">Faulty</option>
              </select>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

<div className="flex justify-end space-x-3 mt-4">
  <button
    onClick={() => setEvolutionMode('add_jc')}
    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
  >
    Back to JCs
  </button>
  <button
    onClick={() => setEvolutionMode('commit')}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  >
    Review & Continue
  </button>
</div>
</div>
) : evolutionMode === 'commit' ? (
<div className="space-y-4">
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Ready to Commit</h4>
    <p className="text-sm text-blue-700 dark:text-blue-300">
      This will permanently update the route structure with {jcsOnRoute.length} new junction closures and {projectedSegments.length} cable segments.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Junction Closures</h4>
      <ul className="space-y-2">
        {jcsOnRoute.map(jc => (
          <li key={jc.id} className="flex justify-between text-sm">
            <span className="font-medium">{jc.name}</span>
            <span className="text-gray-600 dark:text-gray-400">{jc.position_on_route}% position</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Cable Segments</h4>
      <ul className="space-y-2">
        {projectedSegments.map(segment => (
          <li key={segment.id} className="flex justify-between text-sm">
            <span>
              {segment.start_point_type === 'node' ? 'N' : 'JC'}-{segment.start_point_id} → 
              {segment.end_point_type === 'node' ? 'N' : 'JC'}-{segment.end_point_id}
            </span>
            <span className="text-gray-600 dark:text-gray-400">{segment.distance_km} km</span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  {projectedSplices.length > 0 && (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Splice Summary</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {projectedSplices.filter(s => s.status === 'active').length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {projectedSplices.filter(s => s.status === 'spare').length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Spare</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {projectedSplices.filter(s => s.status === 'faulty').length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Faulty</div>
        </div>
      </div>
    </div>
  )}
</div>
) : projectedSegments.length > 0 ? (
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segment</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distance</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fibers</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {projectedSegments.map((segment) => (
        <tr key={segment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
            #{segment.segment_order}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {segment.start_point_type === 'node' ? 'N' : 'JC'}-{segment.start_point_id} → 
            {segment.end_point_type === 'node' ? 'N' : 'JC'}-{segment.end_point_id}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {segment.distance_km} km
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {segment.fiber_count}f
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            <span className={`px-2 py-1 rounded text-xs ${
              segment.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {segment.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
) : (
<div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
  <div className="text-gray-500 dark:text-gray-400 mb-4">
    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
    No Segments Projected
  </h4>
  <p className="text-sm text-gray-500 dark:text-gray-400">
    Add junction closures to the route to generate cable segments.
  </p>
</div>
)}
</div>
</div>
)}
</div>
);
};

export default RouteEvolutionManager;