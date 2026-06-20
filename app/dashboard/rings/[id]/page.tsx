// app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap, FiGrid, FiSettings, FiRefreshCw, FiEdit, FiTrash2, FiArrowRightCircle, FiGitMerge } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { PageSpinner, Modal, Button } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { createClient } from '@/utils/supabase/client';
import {
  V_ring_nodesRowSchema,
  V_ringsRowSchema,
  V_ofc_cables_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { buildRpcFilters, useRpcRecord, useTableUpdate, useTableQuery, usePagedData } from '@/hooks/database';
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
import { getConnectionColor, parseBandwidthGbps } from '@/utils/mapUtils';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAllRingLogicalPaths } from '@/hooks/database/ring-provisioning-hooks';
import { Zap } from 'lucide-react';
import { LogPowerReadingsModal } from '@/components/rings/LogPowerReadingsModal';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { useLatestSystemsPowerReadings } from '@/hooks/data/usePowerReadings';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Map..." />,
});

// ... (Keep existing types and helper components like RingAssociatedSystemsView the same) ...
type ExtendedRingDetails = V_ringsRowSchema & {
  topology_config?: {
    disabled_segments?: string[];
  } | null;
};

const COLOR_PALETTE = [
  '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', 
  '#0891b2', '#db2777', '#4f46e5', '#ca8a04', '#059669',
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

const useRingSystems = (ringId: string | null) => {
  const supabase = createClient();

  const { data: associations, isLoading: isLoadingAssoc } = useTableQuery(
    supabase,
    'ring_based_systems',
    {
      filters: { ring_id: ringId || '' },
      columns: 'system_id, order_in_ring',
      limit: 1000,
      enabled: !!ringId,
    }
  );

  const systemIds = useMemo(() => {
    return associations?.data?.map((a) => a.system_id).filter(Boolean) || [];
  }, [associations]);

  const { data: systems, isLoading: isLoadingSystems, error } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    {
      filters: { id: systemIds.length > 0 ? systemIds : ['00000000-0000-0000-0000-000000000000'] },
      limit: 1000,
      orderBy: 'system_name',
      orderDir: 'asc',
    },
    { enabled: !!ringId && !isLoadingAssoc && systemIds.length > 0 }
  );

  const orderedSystems = useMemo(() => {
    if (!associations?.data || associations.data.length === 0) return [];
    if (!systems?.data) return [];
    
    const assocMap = new Map(associations.data.map((a) => [a.system_id, a.order_in_ring]));

    const mapped = systems.data.map((sys) => ({
      ...sys,
      ring_id: ringId,
      order_in_ring: assocMap.get(sys.id!) ?? sys.order_in_ring,
    }));

    return mapped.sort((a, b) => (a.order_in_ring ?? 0) - (b.order_in_ring ?? 0));
  }, [systems, associations, ringId]);

  return {
    data: {
      data: orderedSystems,
      count: orderedSystems.length,
    },
    isLoading: isLoadingAssoc || isLoadingSystems,
    error,
  };
};

const RingAssociatedSystemsView = ({
  ringId,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  ringId: string;
  onEdit: (sys: V_systems_completeRowSchema) => void;
  onDelete: (sys: V_systems_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}) => {
  const { data: systemsData, isLoading } = useRingSystems(ringId);
  const { options: systemTypes, isLoading: isLoadingTypes } = useLookupTypeOptions(
    'SYSTEM_TYPES',
    'asc',
    '',
    'code',
  );

  const systems = systemsData?.data || [];

  const hubMap = useMemo(() => {
    const map = new Map<number, string>();
    systems.forEach((s) => {
      if (s.is_hub && s.order_in_ring !== null) {
        map.set(Math.floor(s.order_in_ring), s.system_name || 'Unknown Hub');
      }
    });
    return map;
  }, [systems]);

  if (isLoading || isLoadingTypes)
    return (
      <div className='py-4 text-center text-sm text-gray-500'>Loading associated systems...</div>
    );

  if (systems.length === 0) {
    return (
      <div className='text-sm text-gray-500 italic py-2 border-t border-gray-100 dark:border-gray-700'>
        No systems associated with this ring yet.
      </div>
    );
  }

  return (
    <div className='space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2'>
      {systems.map((system) => {
        const isSpur = !system.is_hub && system.order_in_ring !== null;
        const parentOrder = isSpur ? Math.floor(system.order_in_ring!) : null;
        const parentName = parentOrder !== null ? hubMap.get(parentOrder) : null;
        const system_ip = system.ip_address;

        const typeName =
          systemTypes.find((t) => t.value === system.system_type_id)?.label || 'Unknown Type';

        return (
          <div
            key={system.id}
            className='flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-colors'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                  {system.system_name}
                </span>
                {system_ip && (
                  <span className='font-mono text-xs text-gray-500 dark:text-gray-400'>
                    / {String(system_ip).split('/')[0]}
                  </span>
                )}
                <span className='text-[10px] text-gray-500 border border-gray-200 dark:border-gray-600 px-1.5 rounded-full bg-white dark:bg-gray-800'>
                  {typeName}
                </span>
              </div>

              <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1.5'>
                <span className='font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold'>
                  #{system.order_in_ring ?? '?'}
                </span>
                {system.is_hub ? (
                  <span className='text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide'>
                    <FiArrowRightCircle className='w-3 h-3' /> Hub
                  </span>
                ) : (
                  <span className='text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide'>
                    <FiGitMerge className='w-3 h-3' /> Spur
                    {parentName && (
                      <span className='text-gray-500 dark:text-gray-400 ml-1 lowercase tracking-normal'>
                        via {parentName}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<'map' | 'schematic'>('map');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLogPowerOpen, setIsLogPowerOpen] = useState(false);
  const [showPowerLevels, setShowPowerLevels] = useState(false); // LIFTED STATE

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
  const { data: rawNodes, isLoading: isLoadingNodes } = useQuery({
    queryKey: ['ring-nodes-detail', ringId],
    queryFn: async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as V_ring_nodesRowSchema[];
    },
    enabled: !!ringId,
    staleTime: 1000 * 60 * 5, 
  });

  const mappedNodes = useMemo((): RingMapNode[] => {
    if (!rawNodes) return [];
    return rawNodes.map(mapNodeData).filter((n): n is RingMapNode => n !== null);
  }, [rawNodes]);

  const ringNodeIds = useMemo(() => {
    if (!rawNodes) return [];
    return rawNodes.map((n) => n.node_id).filter((id): id is string => !!id);
  }, [rawNodes]);

  // THE FIX: Fetch Power Data Globally
  const systemIdsForPower = useMemo(() => {
    return mappedNodes.map(n => n.id).filter(Boolean) as string[];
  }, [mappedNodes]);

  const { data: powerData = {} } = useLatestSystemsPowerReadings(systemIdsForPower);

  // 4. Fetch Cables
  const { data: ringCables } = useQuery({
    queryKey: ['ring-cables-physical', ringId, ringNodeIds],
    queryFn: async () => {
      if (ringNodeIds.length < 2) return [];
      const idList = ringNodeIds.map((id) => `'${id}'`).join(',');
      const sqlCondition = `sn_id IN (${idList}) OR en_id IN (${idList})`;
      const rpcFilters = { or: sqlCondition };

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ofc_cables_complete',
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
      });

      if (error) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allCables = (data as any)?.data as V_ofc_cables_completeRowSchema[];
      const ringNodeSet = new Set(ringNodeIds);
      return allCables.filter((c) => ringNodeSet.has(c.sn_id!) && ringNodeSet.has(c.en_id!));
    },
    enabled: ringNodeIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // 5. Fetch ACTIVE Bandwidth Data 
  const { data: allLogicalPaths } = useAllRingLogicalPaths(ringId);

  // 6. Fetch Ring Logical Path configurations
  const { data: pathConfigs } = useQuery({
    queryKey: ['ring-path-config', ringId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logical_paths')
        .select(`
           id, name, start_node_id, end_node_id,
           source_system:source_system_id(system_name), source_system_id, source_port,
           destination_system:destination_system_id(system_name), destination_system_id, destination_port
        `)
        .eq('ring_id', ringId);
      if (error) return [];
      return data;
    },
    enabled: !!ringId,
  });

  // 6b. Fetch Services
  const { data: servicesData } = useQuery({
    queryKey: ['ring-services', ringId, pathConfigs],
    queryFn: async () => {
       if (!pathConfigs || pathConfigs.length === 0) return [];
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const names = pathConfigs.map((p: any) => p.name).filter(Boolean);
       if (names.length === 0) return [];
       
       const { data, error } = await supabase
          .from('services')
          .select('name, bandwidth_allocated')
          .in('name', names);

       if (error) throw error;
       return data || [];
    },
    enabled: !!pathConfigs && pathConfigs.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // 7. Calculate Topology Segments
  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };

    const hubs = mappedNodes.filter((node) => node.is_hub).sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    const spokes = mappedNodes.filter((node) => !node.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];

    if (hubs.length > 1) {
      for (let i = 0; i < hubs.length - 1; i++) segments.push([hubs[i], hubs[i + 1]]);
      if (ringDetails?.is_closed_loop === true) segments.push([hubs[hubs.length - 1], hubs[0]]);
    } else {
      const allNodes = [...mappedNodes].sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
      if (allNodes.length > 1) {
        allNodes.forEach((node, index) => {
          if (index < allNodes.length - 1) segments.push([node, allNodes[index + 1]]);
          else if (ringDetails?.is_closed_loop === true) segments.push([node, allNodes[0]]);
        });
      }
    }

    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    const hubMapByOrder = new Map<number, RingMapNode>();
    hubs.forEach((h) => { if (h.order_in_ring !== null) hubMapByOrder.set(Math.floor(h.order_in_ring), h); });

    spokes.forEach((spoke) => {
      const parentOrder = Math.floor(spoke.order_in_ring || 0);
      const parentHub = hubMapByOrder.get(parentOrder);
      if (parentHub) spurs.push([parentHub, spoke]);
    });

    return { potentialSegments: segments, spurConnections: spurs };
  }, [mappedNodes, ringDetails]);

  const connectionColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    const uniqueIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathConfigs?.forEach((p: any) => uniqueIds.add(p.id));
    Array.from(uniqueIds).forEach((id, index) => {
      colorMap.set(id, COLOR_PALETTE[index % COLOR_PALETTE.length]);
    });
    return colorMap;
  }, [pathConfigs]);

  const { allSolidLines, configMap } = useMemo(() => {
    const disabledKeys = new Set(ringDetails?.topology_config?.disabled_segments || []);
    const activeTopology = potentialSegments.filter(([start, end]) => {
      return !disabledKeys.has(`${start.id}-${end.id}`) && !disabledKeys.has(`${end.id}-${start.id}`);
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

    if (pathConfigs && pathConfigs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pathConfigs.forEach((pc: any) => {
        const start = nodeMap.get(pc.source_system_id);
        const end = nodeMap.get(pc.destination_system_id);

        if (start && end) {
          lines.push([start, end]);
          const sortedKey = [start.id, end.id].sort().join('-');

          let bw: number | undefined = undefined;
          
          if (allLogicalPaths) {
             const match = allLogicalPaths.find(f => 
                 (f.source_system_id === start.id && f.destination_system_id === end.id) ||
                 (f.source_system_id === end.id && f.destination_system_id === start.id)
             );
             if (match) {
                 const sysConn = Array.isArray(match.system_connections) ? match.system_connections[0] : match.system_connections;
                 bw = parseBandwidthGbps(sysConn?.bandwidth, match.bandwidth_gbps);
             }
          }

          if (bw === undefined && servicesData) {
              const svc = servicesData.find(s => s.name === pc.name);
              if (svc && svc.bandwidth_allocated) {
                  bw = parseBandwidthGbps(svc.bandwidth_allocated);
              }
          }

          const config: PathConfig = {
            source: getSystemName(pc.source_system),
            dest: getSystemName(pc.destination_system),
            sourcePort: pc.source_port,
            destPort: pc.destination_port,
            connectionId: pc.id,
            cableName: pc.name,
            color: connectionColorMap.get(pc.id),
            bandwidthGbps: bw,
          };

          if (!map[sortedKey]) map[sortedKey] = [];
          map[sortedKey].push(config);
        }
      });
    }

    activeTopology.forEach(([start, end]) => {
      const sortedKey = [start.id, end.id].sort().join('-');
      if (!map[sortedKey] || map[sortedKey].length === 0) {
        lines.push([start, end]);

        const physNodeA = start.node_id;
        const physNodeB = end.node_id;
        let bestCableName: string | undefined;

        if (ringCables && physNodeA && physNodeB) {
          const matchingCables = ringCables.filter(
            (c) => (c.sn_id === physNodeA && c.en_id === physNodeB) || (c.sn_id === physNodeB && c.en_id === physNodeA)
          );
          if (matchingCables.length > 0) bestCableName = matchingCables[0]?.route_name ?? undefined;
        }

        const config: PathConfig = { cableName: bestCableName || 'Physical Link' };
        if (!map[sortedKey]) map[sortedKey] = [];
        map[sortedKey].push(config);
      }
    });

    return { allSolidLines: lines, configMap: map };
  }, [ringDetails, potentialSegments, pathConfigs, mappedNodes, ringCables, connectionColorMap, allLogicalPaths, servicesData]);

  const nodePortMap = useMemo(() => {
    const map = new Map<string, PortDisplayInfo[]>();
    if (!rawNodes) return new Map<string, PortDisplayInfo[]>();

    const systemToNodeInfo = new Map<string, { nodeId: string; nodeName: string }>();
    rawNodes.forEach((node) => {
      if (node.id && node.node_id) {
        systemToNodeInfo.set(node.id, { nodeId: node.node_id, nodeName: node.system_node_name || node.name || 'Unknown' });
      }
    });

    const addPort = (systemId: string | null, port: string | null, connectionId: string, targetSystemId?: string | null) => {
      if (!systemId || !port) return;
      if (!map.has(systemId)) map.set(systemId, []);
      const list = map.get(systemId)!;

      if (!list.some((p) => p.port === port)) {
        const color = connectionColorMap.get(connectionId) || getConnectionColor(connectionId);
        let targetName = 'Unknown';
        if (targetSystemId) {
          const targetInfo = systemToNodeInfo.get(targetSystemId);
          targetName = targetInfo ? targetInfo.nodeName : 'External';
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

    map.forEach((ports) => {
      ports.sort((a, b) => a.port.localeCompare(b.port, undefined, { numeric: true, sensitivity: 'base' }));
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
          showPowerLevels={showPowerLevels} // PASS LIFTED STATE
          setShowPowerLevels={setShowPowerLevels} // PASS LIFTED STATE
          powerData={powerData} // PASS DATA
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
                    'ofc_connections',
                    'v_ofc_connections_complete',
                    'v_system_connections_complete',
                    'logical_paths',
                    'logical_fiber_paths',
                    'logical_path_segments',
                    'services' 
                  ]);
                } else {
                  refetchRing();
                }
                toast.success('Ring topology refreshed.');
              },
              variant: 'outline',
              leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
              disabled: isBusy,
            },
            {
              label: 'Log Power Readings',
              onClick: () => setIsLogPowerOpen(true),
              variant: 'outline',
              leftIcon: <Zap size={16} />,
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

      {isLogPowerOpen && (
        <LogPowerReadingsModal
          isOpen={isLogPowerOpen}
          onClose={() => setIsLogPowerOpen(false)}
          ringId={ringId}
        />
      )}
    </div>
  );
}