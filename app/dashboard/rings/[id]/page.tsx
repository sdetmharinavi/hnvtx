// app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap, FiGrid, FiSettings, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { localDb } from '@/hooks/data/localDb';
import { PageSpinner, Modal, Button } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { createClient } from '@/utils/supabase/client';
import {
  V_ring_nodesRowSchema,
  V_ringsRowSchema,
  V_ofc_cables_completeRowSchema,
  V_ofc_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { buildRpcFilters, useRpcRecord, useTableUpdate } from '@/hooks/database';
import MeshDiagram from '@/components/map/MeshDiagram/MeshDiagram';
import { toast } from 'sonner';
import { Json } from '@/types/supabase-types';
import { useQuery } from '@tanstack/react-query';
import {
  PathConfig,
  PortDisplayInfo,
  RingMapNode,
  SegmentConfigMap,
} from '@/components/map/ClientRingMap/types';
import { getConnectionColor } from '@/utils/mapUtils';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Map..." />,
});

type ExtendedRingDetails = V_ringsRowSchema & {
  topology_config?: {
    disabled_segments?: string[];
  } | null;
};

// Distinct color palette for parallel connections
const COLOR_PALETTE = [
  '#dc2626', // Red
  '#2563eb', // Blue
  '#16a34a', // Green
  '#d97706', // Amber
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#ca8a04', // Yellow
  '#059669', // Emerald
];

const mapNodeData = (node: V_ring_nodesRowSchema): RingMapNode | null => {
  if (node.id == null || node.name == null) return null;
  return {
    id: node.id,
    ring_id: node.ring_id,
    node_id: node.node_id,
    name: node.name,
    lat: node.lat,
    long: node.long,
    order_in_ring: node.order_in_ring,
    type: node.type!,
    system_type: node.system_type,
    ring_status: node.ring_status,
    system_status: node.system_status,
    ring_name: node.ring_name,
    ip: node.ip,
    remark: node.remark,
    is_hub: node.is_hub,
    system_type_code: node.system_type_code,
    system_node_name: node.system_node_name,
  };
};

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<'map' | 'schematic'>('map');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  // 1. Fetch Ring Details
  const {
    data: ringDetailsData,
    isLoading: isLoadingRingDetails,
    refetch: refetchRing,
    isFetching: isFetchingRing,
  } = useRpcRecord(supabase, 'v_rings', ringId, {
    refetchOnMount: true,
  });
  const ringDetails = ringDetailsData as ExtendedRingDetails | null;

  // 2. Mutation
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, 'rings', {
    onSuccess: () => {
      toast.success('Topology configuration saved');
      refetchRing();
      setIsConfigModalOpen(false);
    },
    onError: (err) => toast.error(`Failed to save: ${err.message}`),
  });

  // 3. Fetch Nodes
  const { data: rawNodes, isLoading: isLoadingNodes } = useLocalFirstQuery<'v_ring_nodes'>({
    queryKey: ['ring-nodes-detail', ringId],
    onlineQueryFn: async () => {
      if (!ringId) return [];
      const rpcFilters = buildRpcFilters({ ring_id: ringId });
      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ring_nodes',
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'order_in_ring',
        p_order_dir: 'asc',
      });
      if (error) throw error;
      return (data as { data: V_ring_nodesRowSchema[] })?.data || [];
    },
    localQueryFn: () => {
      if (!ringId) return Promise.resolve([]);
      return localDb.v_ring_nodes.where('ring_id').equals(ringId).toArray();
    },
    dexieTable: localDb.v_ring_nodes,
    enabled: !!ringId,
    staleTime: 0,
    autoSync: true,
    refetchOnMount: true,
    localQueryDeps: [ringId],
  });

  const mappedNodes = useMemo((): RingMapNode[] => {
    if (!rawNodes) return [];
    return rawNodes.map(mapNodeData).filter((n): n is RingMapNode => n !== null);
  }, [rawNodes]);

  // --- Fetch Physical Cables & Connections ---
  const ringNodeIds = useMemo(() => {
    if (!rawNodes) return [];
    return rawNodes.map((n) => n.node_id).filter((id): id is string => !!id);
  }, [rawNodes]);

  const ringSystemIds = useMemo(() => {
    if (!mappedNodes) return [];
    return mappedNodes.map((n) => n.id).filter((id): id is string => !!id);
  }, [mappedNodes]);

  // 4. Fetch Cables
  const { data: ringCables } = useQuery({
    queryKey: ['ring-cables-physical', ringId, ringNodeIds],
    queryFn: async () => {
      if (ringNodeIds.length < 2) return [];

      const idList = ringNodeIds.map((id) => `'${id}'`).join(',');
      const sqlCondition = `sn_id IN (${idList}) OR en_id IN (${idList})`;

      const rpcFilters = {
        or: sqlCondition,
      };

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ofc_cables_complete',
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
      });

      if (error) {
        console.error('Error fetching ring cables:', error);
        return [];
      }

      const allCables = (data?.data as V_ofc_cables_completeRowSchema[]) || [];
      const ringNodeSet = new Set(ringNodeIds);

      return allCables.filter((c) => ringNodeSet.has(c.sn_id!) && ringNodeSet.has(c.en_id!));
    },
    enabled: ringNodeIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const ringCableIds = useMemo(() => {
    return ringCables?.map((c) => c.id).filter((id): id is string => !!id) || [];
  }, [ringCables]);

  // 5. Fetch ACTIVE Connections
  const { data: allCableConnections } = useQuery({
    queryKey: ['ring-connections-all', ringId, ringCableIds],
    queryFn: async () => {
      if (ringCableIds.length === 0) return [];

      const rpcFilters = {
        ofc_id: ringCableIds,
        status: true,
      };

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ofc_connections_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: buildRpcFilters(rpcFilters),
      });

      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }
      return (data?.data as V_ofc_connections_completeRowSchema[]) || [];
    },
    enabled: ringCableIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 5.5 Fetch Direct Intra-Ring Connections (Service level, without cable)
  const { data: intraRingConnections } = useQuery({
    queryKey: ['intra-ring-connections', ringId, ringSystemIds],
    queryFn: async () => {
      if (ringSystemIds.length < 2) return [];

      // Fetch connections where both ends are in the ring
      const { data, error } = await supabase
        .from('v_system_connections_complete')
        .select('id, system_id, en_id, service_name, system_name, connected_system_name')
        .in('system_id', ringSystemIds)
        .in('en_id', ringSystemIds)
        .eq('status', true);

      if (error) {
        console.error('Error fetching intra-ring connections:', error);
        return [];
      }
      return data;
    },
    enabled: ringSystemIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // 6. Extract unique Logical Path IDs from connections
  const relevantLogicalPathIds = useMemo(() => {
    if (!allCableConnections) return [];
    const ids = new Set<string>();
    allCableConnections.forEach((c) => {
      if (c.logical_path_id) ids.add(c.logical_path_id);
    });
    return Array.from(ids);
  }, [allCableConnections]);

  // 7. Fetch Logical Fiber Path Names AND System Connection IDs
  const { data: logicalFiberPathsMap } = useQuery({
    queryKey: ['logical-fiber-paths-info', relevantLogicalPathIds],
    queryFn: async () => {
      if (relevantLogicalPathIds.length === 0)
        return new Map<string, { name: string; connectionId: string | null }>();

      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, path_name, system_connection_id')
        .in('id', relevantLogicalPathIds);

      if (error) {
        console.error('Error fetching path info:', error);
        return new Map<string, { name: string; connectionId: string | null }>();
      }

      return new Map(
        data.map((p) => {
          return [
            p.id,
            { name: p.path_name || 'Unnamed Path', connectionId: p.system_connection_id },
          ];
        })
      );
    },
    enabled: relevantLogicalPathIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 8. Fetch Ring Logical Path configurations (Hub-to-Hub)
  const { data: pathConfigs } = useQuery({
    queryKey: ['ring-path-config', ringId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logical_paths')
        .select(
          `
           id,
           name,
           start_node_id,
           end_node_id,
           source_system:source_system_id(system_name),
           source_system_id,
           source_port,
           destination_system:destination_system_id(system_name),
           destination_system_id,
           destination_port
        `
        )
        .eq('ring_id', ringId);

      if (error) return [];
      return data;
    },
    enabled: !!ringId,
    refetchOnMount: true,
  });

  // 9. Calculate Topology Segments (Backbone & Spurs)
  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    const spokes = mappedNodes.filter((node) => !node.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];

    if (hubs.length > 1) {
      for (let i = 0; i < hubs.length - 1; i++) {
        segments.push([hubs[i], hubs[i + 1]]);
      }
      if (ringDetails?.is_closed_loop === true) {
        segments.push([hubs[hubs.length - 1], hubs[0]]);
      }
    } else {
      const allNodes = [...mappedNodes].sort(
        (a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0)
      );
      if (allNodes.length > 1) {
        allNodes.forEach((node, index) => {
          if (index < allNodes.length - 1) {
            segments.push([node, allNodes[index + 1]]);
          } else if (ringDetails?.is_closed_loop === true) {
            segments.push([node, allNodes[0]]);
          }
        });
      }
    }

    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    const hubMapByOrder = new Map<number, RingMapNode>();
    hubs.forEach((h) => {
      if (h.order_in_ring !== null) hubMapByOrder.set(Math.floor(h.order_in_ring), h);
    });

    spokes.forEach((spoke) => {
      const parentOrder = Math.floor(spoke.order_in_ring || 0);
      const parentHub = hubMapByOrder.get(parentOrder);
      if (parentHub) spurs.push([parentHub, spoke]);
    });

    return { potentialSegments: segments, spurConnections: spurs };
  }, [mappedNodes, ringDetails]);

  // --- NEW: Generate Unique Colors Map ---
  const connectionColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    const uniqueIds = new Set<string>();

    // 1. Gather Logical Path IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathConfigs?.forEach((p: any) => uniqueIds.add(p.id));

    // 2. Gather Direct Link IDs
    intraRingConnections?.forEach((c) => uniqueIds.add(c.id));

    // 3. Gather Physical/Service IDs from cables
    allCableConnections?.forEach((c) => {
      if (c.logical_path_id) {
        const info = logicalFiberPathsMap?.get(c.logical_path_id);
        if (info?.connectionId) uniqueIds.add(info.connectionId);
      } else if (c.system_id) {
        uniqueIds.add(c.system_id);
      }
    });

    // Assign colors sequentially to prevent hash collision
    Array.from(uniqueIds).forEach((id, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      colorMap.set(id, color);
    });

    return colorMap;
  }, [pathConfigs, intraRingConnections, allCableConnections, logicalFiberPathsMap]);

  // 10. PREPARE MULTI-LINE DATA (Consolidated Logic)
  // This calculates BOTH the line definitions and their configurations.
  const { allSolidLines, configMap } = useMemo(() => {
    const disabledKeys = new Set(ringDetails?.topology_config?.disabled_segments || []);

    // Filter active segments from potential segments
    const activeTopology = potentialSegments.filter(([start, end]) => {
      const key1 = `${start.id}-${end.id}`;
      const key2 = `${end.id}-${start.id}`;
      return !disabledKeys.has(key1) && !disabledKeys.has(key2);
    });

    const lines: Array<[RingMapNode, RingMapNode]> = [];
    const map: SegmentConfigMap = {};

    const nodeMap = new Map(mappedNodes.map((n) => [n.id!, n]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSystemName = (val: any) => {
      if (!val) return undefined;
      if (Array.isArray(val) && val.length > 0) return val[0]?.system_name;
      return val?.system_name;
    };

    // -- A. Explicit Logical Paths --
    // If we have defined logical paths (from pathConfigs), add a line for each one.
    // This solves the parallel connection issue.
    if (pathConfigs && pathConfigs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pathConfigs.forEach((pc: any) => {
        const start = nodeMap.get(pc.source_system_id);
        const end = nodeMap.get(pc.destination_system_id);

        if (start && end) {
          lines.push([start, end]);

          // Use consistent sorting key
          const sortedKey = [start.id, end.id].sort().join('-');

          const config: PathConfig = {
            source: getSystemName(pc.source_system),
            dest: getSystemName(pc.destination_system),
            sourcePort: pc.source_port,
            destPort: pc.destination_port,
            connectionId: pc.id, // Explicit ID for color
            cableName: pc.name,
            // Explicitly inject resolved color
            color: connectionColorMap.get(pc.id),
          };

          // Append to array
          if (!map[sortedKey]) map[sortedKey] = [];
          map[sortedKey].push(config);
        }
      });
    }

    // -- B. Default Topology Fallback --
    // If no logical paths are defined for a segment, ensure at least one line is drawn based on topology.
    activeTopology.forEach(([start, end]) => {
      const sortedKey = [start.id, end.id].sort().join('-');

      // Only add if no logical paths were added for this pair
      if (!map[sortedKey] || map[sortedKey].length === 0) {
        lines.push([start, end]);

        // Try to infer config from physical data
        // (Reuse existing logic for physical fallback)
        const physNodeA = start.node_id;
        const physNodeB = end.node_id;

        let bestCableName: string | undefined;
        let primaryConnectionId: string | null = null;

        // Logic to find ANY valid connection ID on this segment for coloring
        if (ringCables && physNodeA && physNodeB) {
          const matchingCables = ringCables.filter(
            (c) =>
              (c.sn_id === physNodeA && c.en_id === physNodeB) ||
              (c.sn_id === physNodeB && c.en_id === physNodeA)
          );
          if (matchingCables.length > 0) {
            bestCableName = matchingCables[0]?.route_name ?? undefined;
            // Check connections on first cable
            const cableId = matchingCables[0].id;
            const conns = allCableConnections?.filter(
              (c) => c.ofc_id === cableId && (c.system_id || c.logical_path_id)
            );
            if (conns && conns.length > 0) {
              const firstConn = conns[0];
              if (firstConn.logical_path_id && logicalFiberPathsMap) {
                primaryConnectionId =
                  logicalFiberPathsMap.get(firstConn.logical_path_id)?.connectionId || null;
              } else {
                primaryConnectionId = firstConn.system_id;
              }
            }
          }
        }

        const config: PathConfig = {
          cableName: bestCableName || 'Physical Link',
          connectionId: primaryConnectionId || undefined,
          color: primaryConnectionId ? connectionColorMap.get(primaryConnectionId) : undefined,
        };

        if (!map[sortedKey]) map[sortedKey] = [];
        map[sortedKey].push(config);
      }
    });

    return { allSolidLines: lines, configMap: map };
  }, [
    ringDetails,
    potentialSegments,
    pathConfigs,
    mappedNodes,
    ringCables,
    allCableConnections,
    logicalFiberPathsMap,
    connectionColorMap,
  ]);

  // 11. Build Node -> Active Ports Map
  const nodePortMap = useMemo(() => {
    const map = new Map<string, PortDisplayInfo[]>();
    if (!rawNodes) return new Map<string, PortDisplayInfo[]>();

    const systemToNodeInfo = new Map<string, { nodeId: string; nodeName: string }>();
    rawNodes.forEach((node) => {
      if (node.id && node.node_id) {
        systemToNodeInfo.set(node.id, {
          nodeId: node.node_id,
          nodeName: node.system_node_name || node.name || 'Unknown',
        });
      }
    });

    const addPort = (
      systemId: string | null,
      port: string | null,
      connectionId: string,
      targetSystemId?: string | null
    ) => {
      if (!systemId || !port) return;

      if (!map.has(systemId)) {
        map.set(systemId, []);
      }

      const list = map.get(systemId)!;

      if (!list.some((p) => p.port === port)) {
        // Use the consistent color map
        const color = connectionColorMap.get(connectionId) || getConnectionColor(connectionId);

        let targetName = 'Unknown';
        if (targetSystemId) {
          const targetInfo = systemToNodeInfo.get(targetSystemId);
          targetName = targetInfo ? targetInfo.nodeName : 'External';
        }
        list.push({ port, color, targetNodeName: targetName });
      }
    };

    // Add ports from Logical Paths
    if (pathConfigs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pathConfigs.forEach((p: any) => {
        const connectionId = p.id;
        addPort(p.source_system_id, p.source_port, connectionId, p.destination_system_id);
        addPort(p.destination_system_id, p.destination_port, connectionId, p.source_system_id);
      });
    }

    map.forEach((ports) => {
      ports.sort((a, b) =>
        a.port.localeCompare(b.port, undefined, { numeric: true, sensitivity: 'base' })
      );
    });

    return map;
  }, [rawNodes, pathConfigs, connectionColorMap]);

  const handleToggleSegment = (startId: string, endId: string) => {
    const key = `${startId}-${endId}`;
    const currentDisabled = ringDetails?.topology_config?.disabled_segments || [];
    const isCurrentlyDisabled =
      currentDisabled.includes(key) || currentDisabled.includes(`${endId}-${startId}`);

    let newDisabled = [...currentDisabled];
    if (isCurrentlyDisabled) {
      newDisabled = newDisabled.filter(
        (k) => k !== `${startId}-${endId}` && k !== `${endId}-${startId}`
      );
    } else {
      newDisabled.push(key);
    }

    const newConfig = {
      ...(ringDetails?.topology_config && typeof ringDetails.topology_config === 'object'
        ? ringDetails.topology_config
        : {}),
      disabled_segments: newDisabled,
    };
    updateRing({ id: ringId, data: { topology_config: newConfig as Json } });
  };

  const ringName = ringDetails?.name || `Ring ${ringId?.slice(0, 8)}...`;
  const handleBack = useCallback(() => router.back(), [router]);
  const isBusy = isLoadingRingDetails || isUpdating || isSyncingData || isFetchingRing;

  const renderContent = () => {
    const isLoading = (isLoadingNodes && !rawNodes) || isLoadingRingDetails;
    if (isLoading) return <PageSpinner text="Loading Ring Data..." />;

    if (mappedNodes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No nodes found.</p>
        </div>
      );
    }

    if (viewMode === 'schematic') {
      return (
        <MeshDiagram
          nodes={mappedNodes}
          connections={allSolidLines}
          ringName={ringName}
          onBack={handleBack}
          segmentConfigs={configMap}
          nodePorts={nodePortMap}
        />
      );
    }

    const mapNodes = mappedNodes.filter((n) => n.lat != null && n.long != null);
    if (mapNodes.length === 0) {
      return <div className="flex justify-center h-full items-center">No Geographic Data</div>;
    }

    return (
      <ClientRingMap
        nodes={mapNodes}
        solidLines={allSolidLines}
        dashedLines={spurConnections}
        onBack={handleBack}
        showControls={true}
        segmentConfigs={configMap}
        nodePorts={nodePortMap}
      />
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="shrink-0">
        <PageHeader
          title={ringName}
          description="Visualize and configure topology."
          icon={<FiMap />}
          actions={[
            {
              label: 'Refresh',
              onClick: async () => {
                if (isOnline) {
                  await syncData([
                    'rings',
                    'v_rings',
                    'v_ring_nodes',
                    'ring_based_systems',
                    'ofc_cables',
                    'v_ofc_cables_complete',
                    'ofc_connections', // Added
                    'v_ofc_connections_complete', // Added
                    'v_system_connections_complete',
                    'logical_paths',
                    'logical_fiber_paths',
                    'logical_path_segments', // Added
                  ]);
                } else {
                  refetchRing(); // Fallback
                }
                toast.success('Ring topology refreshed.');
              },
              variant: 'outline',
              leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
              disabled: isBusy,
            },
            {
              label: 'Configure Topology',
              onClick: () => setIsConfigModalOpen(true),
              variant: 'primary',
              leftIcon: <FiSettings />,
              disabled: isBusy,
            },
            {
              label: viewMode === 'map' ? 'Schematic View' : 'Map View',
              onClick: () => setViewMode((prev) => (prev === 'map' ? 'schematic' : 'map')),
              variant: 'secondary',
              leftIcon: viewMode === 'map' ? <FiGrid /> : <FiMap />,
            },
            {
              label: 'Back',
              onClick: handleBack,
              variant: 'outline',
              leftIcon: <FiArrowLeft />,
            },
          ]}
        />
      </div>

      <div className="grow min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-1 overflow-hidden">
        {renderContent()}
      </div>

      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Ring Connections"
      >
        <div className="p-4 space-y-4 z-50">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Toggle the switches below to enable or disable specific connections between hubs.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {potentialSegments.map(([start, end], idx) => {
              const key = `${start.id}-${end.id}`;
              const reverseKey = `${end.id}-${start.id}`;
              const disabledList = ringDetails?.topology_config?.disabled_segments || [];
              const isActive = !disabledList.includes(key) && !disabledList.includes(reverseKey);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      {start.name} ↔ {end.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Order: {start.order_in_ring} ↔ {end.order_in_ring}
                    </span>
                  </div>
                  <Button
                    size="xs"
                    variant={isActive ? 'success' : 'secondary'}
                    onClick={() => handleToggleSegment(start.id!, end.id!)}
                    disabled={isUpdating}
                  >
                    {isActive ? 'Connected' : 'Disconnected'}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsConfigModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
