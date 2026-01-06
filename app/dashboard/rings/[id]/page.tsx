// path: app/dashboard/rings/[id]/page.tsx
"use client";

import { useMemo, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMap, FiGrid, FiSettings } from "react-icons/fi";
import dynamic from "next/dynamic";
import { localDb } from "@/hooks/data/localDb";
import { PageSpinner, Modal, Button } from "@/components/common/ui";
import { PageHeader } from "@/components/common/page-header";
import { RingMapNode } from "@/components/map/types/node";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { createClient } from "@/utils/supabase/client";
import {
  V_ring_nodesRowSchema,
  V_ringsRowSchema,
  V_ofc_cables_completeRowSchema,
  V_ofc_connections_completeRowSchema,
} from "@/schemas/zod-schemas";
import { buildRpcFilters, useRpcRecord, useTableUpdate } from "@/hooks/database";
import MeshDiagram from "@/components/map/MeshDiagram";
import { toast } from "sonner";
import { Json } from "@/types/supabase-types";
import { useQuery } from "@tanstack/react-query";

// Define the PortDisplayInfo type here to be passed to the map
export interface PortDisplayInfo {
  port: string;
  color: string;
  targetNodeName?: string;
}

const ClientRingMap = dynamic(() => import("@/components/map/ClientRingMap"), {
  ssr: false,
  loading: () => <PageSpinner text='Loading Map...' />,
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
  capacity?: number;
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

// Helper for consistent colors based on string input (connection ID)
const getConnectionColor = (id: string) => {
  // A palette of distinct, readable colors
  const colors = [
    "#dc2626", // Strong Red
    "#ea580c", // Deep Orange
    "#ca8a04", // Golden Amber
    "#65a30d", // Lime Green
    "#059669", // Emerald Green
    "#0f766e", // Teal
    "#0284c7", // Cyan Blue
    "#1d4ed8", // Royal Blue
    "#4f46e5", // Indigo
    "#7c3aed", // Violet
    "#c026d3", // Fuchsia
    "#be123c", // Rose / Magenta Red
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<"map" | "schematic">("map");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // 1. Fetch Ring Details
  const {
    data: ringDetailsData,
    isLoading: isLoadingRingDetails,
    refetch: refetchRing,
  } = useRpcRecord(supabase, "v_rings", ringId, {
    // THE FIX: Ensure we fetch fresh data when entering this page to catch "Closed Loop" updates
    refetchOnMount: true,
  });
  const ringDetails = ringDetailsData as ExtendedRingDetails | null;

  // 2. Mutation
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, "rings", {
    onSuccess: () => {
      toast.success("Topology configuration saved");
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
    staleTime: 0,        // Force fresh fetch on mount
    autoSync: true,      
    refetchOnMount: true, // Force refresh
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

  // 4. Fetch Cables
  const { data: ringCables } = useQuery({
    queryKey: ["ring-cables-physical", ringId, ringNodeIds],
    queryFn: async () => {
      if (ringNodeIds.length < 2) return [];

      const idList = ringNodeIds.map((id) => `'${id}'`).join(",");
      const sqlCondition = `sn_id IN (${idList}) OR en_id IN (${idList})`;

      const rpcFilters = {
        or: sqlCondition,
      };

      const { data, error } = await supabase.rpc("get_paged_data", {
        p_view_name: "v_ofc_cables_complete",
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
      });

      if (error) {
        console.error("Error fetching ring cables:", error);
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
    queryKey: ["ring-connections-all", ringId, ringCableIds],
    queryFn: async () => {
      if (ringCableIds.length === 0) return [];

      const rpcFilters = {
        ofc_id: ringCableIds,
        status: true,
      };

      const { data, error } = await supabase.rpc("get_paged_data", {
        p_view_name: "v_ofc_connections_complete",
        p_limit: 5000,
        p_offset: 0,
        p_filters: buildRpcFilters(rpcFilters),
      });

      if (error) {
        console.error("Error fetching connections:", error);
        return [];
      }
      return (data?.data as V_ofc_connections_completeRowSchema[]) || [];
    },
    enabled: ringCableIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 4a. Fetch Logical Path configurations
  const { data: pathConfigs } = useQuery({
    queryKey: ['ring-path-config', ringId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logical_paths')
        .select(
          `
           id,
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
    refetchOnMount: true, // Force refresh for ports
  });

  // 6. Calculate Segments
  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    const spokes = mappedNodes.filter((node) => !node.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];

    if (hubs.length > 1) {
      // Connect sequential hubs: 0->1, 1->2, 2->3
      for (let i = 0; i < hubs.length - 1; i++) {
        segments.push([hubs[i], hubs[i + 1]]);
      }

      // Conditionally close the loop: 3->0
      // Check for null explicitly because it could be undefined on first render
      if (ringDetails?.is_closed_loop === true) {
        segments.push([hubs[hubs.length - 1], hubs[0]]);
      }
    } else {
      // Fallback for non-hub/flat lists (legacy)
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

  // 7. BUILD SEGMENT CONFIG MAP (Logic to show fibers on lines)
  const segmentConfigMap = useMemo(() => {
    const map: Record<string, PathConfigForMap> = {};

    const nodeIdToSystemId = new Map<string, string>();
    mappedNodes.forEach((node) => {
      if (node.node_id && node.id) {
        nodeIdToSystemId.set(node.node_id, node.id);
      }
    });

    // Helper to safely extract system name regardless of array/object structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSystemName = (val: any) => {
      if (!val) return undefined;
      if (Array.isArray(val) && val.length > 0) return val[0]?.system_name;
      return val?.system_name;
    };

    // Logical Paths Config
    pathConfigs?.forEach((p) => {
      const sysIdA = nodeIdToSystemId.get(p.start_node_id || "");
      const sysIdB = nodeIdToSystemId.get(p.end_node_id || "");

      if (sysIdA && sysIdB) {
        const key1 = `${sysIdA}-${sysIdB}`;
        const key2 = `${sysIdB}-${sysIdA}`;

        const srcName = getSystemName(p.source_system);
        const dstName = getSystemName(p.destination_system);

        const config: PathConfigForMap = {
          source: srcName,
          sourcePort: p.source_port,
          dest: dstName,
          destPort: p.destination_port,
          fiberInfo: undefined,
          cableName: undefined,
        };
        map[key1] = config;
        map[key2] = config;
      }
    });

    // Physical Fiber Info Calculation
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

      let bestCable = matchingCables[0];
      const activeFibersInfo: string[] = [];
      const contributingCableNames = new Set<string>();

      // Collect ALL active fibers for this segment
      for (const cable of matchingCables) {
        const systemFibers =
          allCableConnections?.filter(
            (c) =>
              c.ofc_id === cable.id && c.status === true && (!!c.system_id || !!c.logical_path_id)
          ) || [];

        if (systemFibers.length > 0) {
          bestCable = cable;
          if (cable.route_name) contributingCableNames.add(cable.route_name);

          systemFibers.sort((a, b) => (a.fiber_no_sn || 0) - (b.fiber_no_sn || 0));

          systemFibers.forEach((fib) => {
            if (fib.fiber_role) {
              activeFibersInfo.push(`F${fib.fiber_no_sn} (${fib.fiber_role})`);
            } else {
              activeFibersInfo.push(`F${fib.fiber_no_sn}`);
            }
          });
        }
      }

      const uniqueFiberInfo = Array.from(new Set(activeFibersInfo));
      const existing = map[key1] || {};
      const mergedConfig = {
        ...existing,
        fiberInfo: uniqueFiberInfo.length > 0 ? uniqueFiberInfo.join(", ") : "No Active Fibers",
        cableName:
          contributingCableNames.size > 1
            ? "Multiple Active Routes"
            : bestCable.route_name || undefined,
        capacity: bestCable?.capacity || undefined,
      };

      map[key1] = mergedConfig;
      map[key2] = mergedConfig;
    });

    return map;
  }, [allConnections, ringCables, allCableConnections, pathConfigs, mappedNodes]);

  // 8. NEW: Build Node -> Active Ports Map with Colors
  const nodePortMap = useMemo(() => {
    // Map<SYSTEM_ID, Array<{ port: string, color: string, targetNodeName: string }>>
    // THE FIX: Changed key from NodeId to SystemId
    const map = new Map<string, PortDisplayInfo[]>();

    if (!rawNodes) return new Map<string, PortDisplayInfo[]>();

    // 1. Map System ID -> Node Name (for target resolution)
    const systemToNodeInfo = new Map<string, { nodeId: string; nodeName: string }>();
    rawNodes.forEach((node) => {
      if (node.id && node.node_id) {
        systemToNodeInfo.set(node.id, {
          nodeId: node.node_id,
          nodeName: node.system_node_name || node.name || "Unknown",
        });
      }
    });

    // Helper to add a port to a system
    const addPort = (
      systemId: string | null,
      port: string | null,
      connectionId: string,
      targetSystemId?: string | null
    ) => {
      if (!systemId || !port) return;

      // We now key by systemId directly
      if (!map.has(systemId)) {
        map.set(systemId, []);
      }

      const list = map.get(systemId)!;

      // Avoid duplicates
      if (!list.some((p) => p.port === port)) {
        const color = getConnectionColor(connectionId);

        // Resolve target name (Node name of the target system)
        let targetName = "Unknown";
        if (targetSystemId) {
          const targetInfo = systemToNodeInfo.get(targetSystemId);
          targetName = targetInfo ? targetInfo.nodeName : "External";
        }

        list.push({ port, color, targetNodeName: targetName });
      }
    };

    if (pathConfigs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pathConfigs.forEach((p: any) => {
        const connectionId = p.id;
        addPort(p.source_system_id, p.source_port, connectionId, p.destination_system_id);
        addPort(p.destination_system_id, p.destination_port, connectionId, p.source_system_id);
      });
    }

    // Sort ports naturally
    map.forEach((ports) => {
      ports.sort((a, b) =>
        a.port.localeCompare(b.port, undefined, { numeric: true, sensitivity: "base" })
      );
    });

    return map;
  }, [rawNodes, pathConfigs]);

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
      ...(ringDetails?.topology_config && typeof ringDetails.topology_config === "object"
        ? ringDetails.topology_config
        : {}),
      disabled_segments: newDisabled,
    };
    updateRing({ id: ringId, data: { topology_config: newConfig as Json } });
  };

  const ringName = ringDetails?.name || `Ring ${ringId?.slice(0, 8)}...`;
  const handleBack = useCallback(() => router.back(), [router]);

  const renderContent = () => {
    const isLoading = (isLoadingNodes && !rawNodes) || isLoadingRingDetails;
    if (isLoading) return <PageSpinner text='Loading Ring Data...' />;

    if (mappedNodes.length === 0) {
      return (
        <div className='text-center py-12'>
          <p className='text-gray-500'>No nodes found.</p>
        </div>
      );
    }

    if (viewMode === "schematic") {
      return (
        <MeshDiagram
          nodes={mappedNodes}
          connections={allConnections}
          ringName={ringName}
          onBack={handleBack}
          segmentConfigs={segmentConfigMap}
          nodePorts={nodePortMap}
        />
      );
    }

    const mapNodes = mappedNodes.filter((n) => n.lat != null && n.long != null);
    if (mapNodes.length === 0) {
      return <div className='flex justify-center h-full items-center'>No Geographic Data</div>;
    }

    return (
      <ClientRingMap
        nodes={mapNodes}
        solidLines={activeSegments}
        dashedLines={spurConnections}
        onBack={handleBack}
        showControls={true}
        segmentConfigs={segmentConfigMap}
        nodePorts={nodePortMap}
      />
    );
  };

  return (
    <div className='p-4 md:p-6 space-y-6 h-[calc(100vh-64px)] flex flex-col'>
      <div className='shrink-0'>
        <PageHeader
          title={ringName}
          description='Visualize and configure topology.'
          icon={<FiMap />}
          actions={[
            {
              label: "Configure Topology",
              onClick: () => setIsConfigModalOpen(true),
              variant: "primary",
              leftIcon: <FiSettings />,
              disabled: isLoadingRingDetails || isUpdating,
            },
            {
              label: viewMode === "map" ? "Schematic View" : "Map View",
              onClick: () => setViewMode((prev) => (prev === "map" ? "schematic" : "map")),
              variant: "secondary",
              leftIcon: viewMode === "map" ? <FiGrid /> : <FiMap />,
            },
            {
              label: "Back",
              onClick: handleBack,
              variant: "outline",
              leftIcon: <FiArrowLeft />,
            },
          ]}
        />
      </div>

      <div className='grow min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-1 overflow-hidden'>
        {renderContent()}
      </div>

      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title='Configure Ring Connections'>
        <div className='p-4 space-y-4 z-50'>
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
            Toggle the switches below to enable or disable specific connections between hubs.
          </p>
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {potentialSegments.map(([start, end], idx) => {
              const key = `${start.id}-${end.id}`;
              const reverseKey = `${end.id}-${start.id}`;
              const disabledList = ringDetails?.topology_config?.disabled_segments || [];
              const isActive = !disabledList.includes(key) && !disabledList.includes(reverseKey);

              return (
                <div
                  key={idx}
                  className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600'>
                  <div className='flex flex-col'>
                    <span className='font-medium text-sm text-gray-800 dark:text-gray-200'>
                      {start.name} ↔ {end.name}
                    </span>
                    <span className='text-xs text-gray-500'>
                      Order: {start.order_in_ring} ↔ {end.order_in_ring}
                    </span>
                  </div>
                  <Button
                    size='xs'
                    variant={isActive ? "success" : "secondary"}
                    onClick={() => handleToggleSegment(start.id!, end.id!)}
                    disabled={isUpdating}>
                    {isActive ? "Connected" : "Disconnected"}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className='flex justify-end pt-4'>
            <Button onClick={() => setIsConfigModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}