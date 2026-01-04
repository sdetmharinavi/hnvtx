// path: app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap, FiGrid, FiSettings } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { localDb } from '@/hooks/data/localDb';
import { PageSpinner, Modal, Button } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { RingMapNode } from '@/components/map/types/node';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { createClient } from '@/utils/supabase/client';
import { V_ring_nodesRowSchema, V_ringsRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters, useRpcRecord, useTableUpdate } from '@/hooks/database';
import MeshDiagram from '@/components/map/MeshDiagram';
import { toast } from 'sonner';
import { Json } from '@/types/supabase-types';
import { useQuery } from '@tanstack/react-query';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Map..." />,
});

type ExtendedRingDetails = V_ringsRowSchema & {
  topology_config?: {
    disabled_segments?: string[];
  } | null;
};

interface PathConfigForMap {
  source?: string;
  sourcePort?: string;
  dest?: string;
  destPort?: string;
  fiberInfo?: string;
  cableName?: string;
}

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

  // 1. Fetch Ring Details
  const {
    data: ringDetailsData,
    isLoading: isLoadingRingDetails,
    refetch: refetchRing,
  } = useRpcRecord(supabase, 'v_rings', ringId);
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
    staleTime: 5 * 60 * 1000,
    localQueryDeps: [ringId],
  });

  const mappedNodes = useMemo((): RingMapNode[] => {
    if (!rawNodes) return [];
    return rawNodes.map(mapNodeData).filter((n): n is RingMapNode => n !== null);
  }, [rawNodes]);

  // --- NEW LOGIC: Fetch Physical Cables & Connections ---
  const ringNodeIds = useMemo(() => {
    if (!rawNodes) return [];
    return rawNodes.map((n) => n.node_id).filter(Boolean) as string[];
  }, [rawNodes]);

  // 4. Fetch Cables
  // FIX: Use direct Supabase query instead of RPC to handle UUID array filtering correctly
  const { data: ringCables } = useQuery({
    queryKey: ['ring-cables-physical', ringId, ringNodeIds],
    queryFn: async () => {
      if (ringNodeIds.length < 2) return [];

      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, sn_id, en_id, capacity')
        .in('sn_id', ringNodeIds)
        .in('en_id', ringNodeIds);

      if (error) {
        console.error('Error fetching ring cables:', error);
        return [];
      }
      return data;
    },
    enabled: ringNodeIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const ringCableIds = useMemo(() => ringCables?.map((c) => c.id) || [], [ringCables]);

  // 5. Fetch ACTIVE Connections
  // FIX: Use direct Supabase query instead of RPC to handle UUID array filtering correctly
  const { data: allCableConnections } = useQuery({
    queryKey: ['ring-connections-all', ringId, ringCableIds],
    queryFn: async () => {
      if (ringCableIds.length === 0) return [];

      const { data, error } = await supabase
        .from('v_ofc_connections_complete')
        .select(
          'ofc_id, system_name, source_port, fiber_no_sn, fiber_no_en, sn_id, en_id, status, fiber_role, path_direction, system_id, ofc_route_name'
        )
        .in('ofc_id', ringCableIds);

      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }
      return data;
    },
    enabled: ringCableIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 4a. Fetch Logical Path configurations
  const { data: pathConfigs } = useQuery({
    queryKey: ['ring-path-config', ringId],
    queryFn: async () => {
      // Use standard select here as well for consistency
      const { data, error } = await supabase
        .from('logical_paths')
        .select(
          `
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
  });

  // 5. Calculate Segments
  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    const spokes = mappedNodes.filter((node) => !node.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];

    if (hubs.length > 1) {
      hubs.forEach((hub, index) => {
        const nextIndex = (index + 1) % hubs.length;
        segments.push([hub, hubs[nextIndex]]);
      });
    } else {
      const allNodes = [...mappedNodes].sort(
        (a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0)
      );
      if (allNodes.length > 1) {
        allNodes.forEach((node, index) => {
          if (index < allNodes.length - 1) {
            segments.push([node, allNodes[index + 1]]);
          } else if (ringDetails?.is_closed_loop) {
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

  const activeSegments = useMemo(() => {
    const disabledKeys = new Set(ringDetails?.topology_config?.disabled_segments || []);
    return potentialSegments.filter(([start, end]) => {
      const key1 = `${start.id}-${end.id}`;
      const key2 = `${end.id}-${start.id}`;
      return !disabledKeys.has(key1) && !disabledKeys.has(key2);
    });
  }, [potentialSegments, ringDetails]);

  const allConnections = useMemo(
    () => [...activeSegments, ...spurConnections],
    [activeSegments, spurConnections]
  );

  // 7. BUILD SEGMENT CONFIG MAP
  const segmentConfigMap = useMemo(() => {
    const map: Record<string, PathConfigForMap> = {};

    const findCable = (n1: string, n2: string) => {
      return ringCables?.find(
        (c) => (c.sn_id === n1 && c.en_id === n2) || (c.sn_id === n2 && c.en_id === n1)
      );
    };

    const nodeIdToSystemId = new Map<string, string>();
    mappedNodes.forEach((node) => {
      if (node.node_id && node.id) {
        nodeIdToSystemId.set(node.node_id, node.id);
      }
    });

    // C. Apply Logical Configurations
    pathConfigs?.forEach((p) => {
      const sysIdA = nodeIdToSystemId.get(p.start_node_id || '');
      const sysIdB = nodeIdToSystemId.get(p.end_node_id || '');

      if (sysIdA && sysIdB) {
        const key1 = `${sysIdA}-${sysIdB}`;
        const key2 = `${sysIdB}-${sysIdA}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const srcSys = p.source_system as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dstSys = p.destination_system as any;

        const config: PathConfigForMap = {
          source: srcSys?.system_name,
          sourcePort: p.source_port,
          dest: dstSys?.system_name,
          destPort: p.destination_port,
          fiberInfo: undefined,
          cableName: undefined,
        };

        map[key1] = config;
        map[key2] = config;
      }
    });

    // D. Apply Physical Info (Fibers)
    allConnections.forEach(([nodeA, nodeB]) => {
      const key1 = `${nodeA.id}-${nodeB.id}`;
      const key2 = `${nodeB.id}-${nodeA.id}`;

      const physNodeA = nodeA.node_id;
      const physNodeB = nodeB.node_id;

      if (!physNodeA || !physNodeB) return;

      const matchingCables =
        ringCables?.filter(
          (c) =>
            (c.sn_id === physNodeA && c.en_id === physNodeB) ||
            (c.sn_id === physNodeB && c.en_id === physNodeA)
        ) || [];

      if (matchingCables.length === 0) return;

      // Find best cable
      let bestCable = matchingCables[0];
      let bestFiberInfo = '';
      let hasActiveFibers = false;
      const sourceSystemId = nodeA.id;

      for (const cable of matchingCables) {
        const systemFibers =
          allCableConnections?.filter(
            (c) => c.ofc_id === cable.id && c.system_id === sourceSystemId && c.status === true
          ) || [];

        if (systemFibers.length > 0) {
          bestCable = cable;
          hasActiveFibers = true;

          const txFiber = systemFibers.find(
            (f) => f.path_direction === 'tx' || f.fiber_role === 'working'
          );
          const rxFiber = systemFibers.find(
            (f) =>
              f.path_direction === 'rx' ||
              (f.fiber_role === 'working' && f.fiber_no_sn !== txFiber?.fiber_no_sn)
          );

          const f1 = txFiber || systemFibers[0];
          const f2 = rxFiber || (systemFibers.length > 1 ? systemFibers[1] : null);

          if (f1 && f2) {
            bestFiberInfo = `Tx: F${f1.fiber_no_sn}, Rx: F${f2.fiber_no_sn}`;
          } else if (f1) {
            bestFiberInfo = `Working: F${f1.fiber_no_sn}`;
          } else {
            bestFiberInfo = systemFibers.map((f) => `F${f.fiber_no_sn}`).join(', ');
          }
          break;
        }
      }

      const existing = map[key1] || {};

      const mergedConfig = {
        ...existing,
        fiberInfo: hasActiveFibers ? bestFiberInfo : 'No Active Fibers',
        // FIX: Handle potential null route_name
        cableName: bestCable.route_name || undefined,
      };

      map[key1] = mergedConfig;
      map[key2] = mergedConfig;
    });

    return map;
  }, [allConnections, ringCables, allCableConnections, pathConfigs, mappedNodes]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateRing({ id: ringId, data: { topology_config: newConfig as Json } as any });
  };

  const ringName = ringDetails?.name || `Ring ${ringId?.slice(0, 8)}...`;
  const handleBack = useCallback(() => router.back(), [router]);

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
          connections={allConnections}
          ringName={ringName}
          onBack={handleBack}
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
        solidLines={activeSegments}
        dashedLines={spurConnections}
        onBack={handleBack}
        showControls={true}
        segmentConfigs={segmentConfigMap}
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
              label: 'Configure Topology',
              onClick: () => setIsConfigModalOpen(true),
              variant: 'primary',
              leftIcon: <FiSettings />,
              disabled: isLoadingRingDetails || isUpdating,
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
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"
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
