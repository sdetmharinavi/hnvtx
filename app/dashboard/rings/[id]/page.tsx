// app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap, FiGrid, FiSettings } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { localDb } from '@/hooks/data/localDb';
import { PageSpinner, Modal, Button } from '@/components/common/ui'; // Added Modal, Button
import { PageHeader } from '@/components/common/page-header';
import { RingMapNode } from '@/components/map/types/node';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { createClient } from '@/utils/supabase/client';
import { V_ring_nodesRowSchema, V_ringsRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters, useTableRecord, useTableUpdate } from '@/hooks/database';
import MeshDiagram from '@/components/map/MeshDiagram';
import { toast } from 'sonner';
import { Json } from '@/types/supabase-types';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Map..." />,
});

// Extended type for the new column
type ExtendedRingDetails = V_ringsRowSchema & {
  topology_config?: {
    disabled_segments?: string[]; // Array of "idA-idB" strings
  } | null;
};

const mapNodeData = (node: V_ring_nodesRowSchema): RingMapNode | null => {
  if (node.id == null || node.name == null) return null;
  return {
    id: node.id,
    ring_id: node.ring_id,
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
  const { data: ringDetailsData, isLoading: isLoadingRingDetails, refetch: refetchRing } = useTableRecord(
    supabase,
    'v_rings',
    ringId
  );
  const ringDetails = ringDetailsData as ExtendedRingDetails | null;

  // 2. Mutation
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, 'rings', {
    onSuccess: () => {
      toast.success("Topology configuration saved");
      refetchRing();
      setIsConfigModalOpen(false);
    },
    onError: (err) => toast.error(`Failed to save: ${err.message}`)
  });

  // 3. Fetch Nodes
  const { data: rawNodes, isLoading: isLoadingNodes } = useOfflineQuery(
    ['ring-nodes-detail', ringId],
    async () => {
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
    async () => {
      if (!ringId) return [];
      return await localDb.v_ring_nodes.where('ring_id').equals(ringId).toArray();
    },
    { enabled: !!ringId, staleTime: 5 * 60 * 1000 }
  );
  
  const mappedNodes = useMemo((): RingMapNode[] => {
    if (!rawNodes) return [];
    return rawNodes.map(mapNodeData).filter((n): n is RingMapNode => n !== null);
  }, [rawNodes]);

  // 4. Calculate Potential Segments
  // We generate ALL possible sequential connections (including closing the loop).
  // The visibility will be controlled by the `topology_config`.
  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    
    const spokes = mappedNodes.filter((node) => !node.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];
    
    if (hubs.length > 1) {
      hubs.forEach((hub, index) => {
        // Connect to next, wrapping around to 0 for the last one
        const nextIndex = (index + 1) % hubs.length;
        segments.push([hub, hubs[nextIndex]]);
      });
    } else {
       // Fallback logic for non-hubs
       const allNodes = [...mappedNodes].sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
       if (allNodes.length > 1) {
         allNodes.forEach((node, index) => {
            const nextIndex = (index + 1) % allNodes.length;
            segments.push([node, allNodes[nextIndex]]);
         });
       }
    }

    // Spurs logic (unchanged)
    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    const hubMapByOrder = new Map<number, RingMapNode>();
    hubs.forEach(h => { if (h.order_in_ring !== null) hubMapByOrder.set(Math.floor(h.order_in_ring), h); });

    spokes.forEach((spoke) => {
      const parentOrder = Math.floor(spoke.order_in_ring || 0);
      const parentHub = hubMapByOrder.get(parentOrder);
      if (parentHub) spurs.push([parentHub, spoke]);
    });

    return { potentialSegments: segments, spurConnections: spurs };
  }, [mappedNodes]);

  // 5. Filter Segments based on DB Config
  const activeSegments = useMemo(() => {
    const disabledKeys = new Set(ringDetails?.topology_config?.disabled_segments || []);
    
    return potentialSegments.filter(([start, end]) => {
      // Check both A-B and B-A keys to be safe
      const key1 = `${start.id}-${end.id}`;
      const key2 = `${end.id}-${start.id}`;
      return !disabledKeys.has(key1) && !disabledKeys.has(key2);
    });
  }, [potentialSegments, ringDetails]);

  const allConnections = useMemo(() => [...activeSegments, ...spurConnections], [activeSegments, spurConnections]);

  // 6. Configuration Handlers
  const handleToggleSegment = (startId: string, endId: string) => {
    const key = `${startId}-${endId}`;
    const currentDisabled = ringDetails?.topology_config?.disabled_segments || [];
    const isCurrentlyDisabled = currentDisabled.includes(key) || currentDisabled.includes(`${endId}-${startId}`);

    let newDisabled = [...currentDisabled];
    if (isCurrentlyDisabled) {
      // Re-enable: Remove both permutations
      newDisabled = newDisabled.filter(k => k !== `${startId}-${endId}` && k !== `${endId}-${startId}`);
    } else {
      // Disable: Add key
      newDisabled.push(key);
    }

    const newConfig = { 
      ...(ringDetails?.topology_config && typeof ringDetails.topology_config === 'object' ? ringDetails.topology_config : {}), 
      disabled_segments: newDisabled 
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateRing({ id: ringId, data: { topology_config: newConfig as Json } as any });
  };

  const ringName = ringDetails?.name || `Ring ${ringId.slice(0, 8)}...`;
  const handleBack = useCallback(() => router.back(), [router]);

  const renderContent = () => {
    const isLoading = isLoadingNodes || isLoadingRingDetails;
    if (isLoading) return <PageSpinner text="Loading Ring Data..." />;
    
    if (mappedNodes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No nodes found.</p>
        </div>
      );
    }
    
    if (viewMode === 'schematic') {
      return <MeshDiagram nodes={mappedNodes} connections={allConnections} ringName={ringName} onBack={handleBack} />;
    }

    const mapNodes = mappedNodes.filter(n => n.lat != null && n.long != null);
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
      />
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-shrink-0">
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
              disabled: isLoadingRingDetails || isUpdating
            },
            {
              label: viewMode === 'map' ? 'Schematic View' : 'Map View',
              onClick: () => setViewMode(prev => prev === 'map' ? 'schematic' : 'map'),
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
      
      <div className="flex-grow min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Topology Configuration Modal */}
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Configure Ring Connections">
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
                 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
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