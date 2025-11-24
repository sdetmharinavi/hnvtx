// app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap, FiGrid } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { localDb } from '@/hooks/data/localDb';
import { PageSpinner } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { RingMapNode } from '@/components/map/types/node';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { createClient } from '@/utils/supabase/client';
import { V_ring_nodesRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters, useTableRecord } from '@/hooks/database';
import MeshDiagram from '@/components/map/MeshDiagram'; // Import the MeshDiagram

// Dynamic import for Map (Leaflet needs no SSR)
const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Map..." />,
});

const mapNodeData = (node: V_ring_nodesRowSchema): RingMapNode | null => {
  if (node.id == null || node.name == null) {
    return null;
  }
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
  
  // New State for View Mode
  const [viewMode, setViewMode] = useState<'map' | 'schematic'>('schematic');

  const { data: ringDetails, isLoading: isLoadingRingDetails } = useTableRecord(
    createClient(),
    'v_rings',
    ringId
  );

  const { data: rawNodes, isLoading: isLoadingNodes } = useOfflineQuery(
    ['ring-nodes-detail', ringId],
    async () => {
      if (!ringId) return [];
      const rpcFilters = buildRpcFilters({ ring_id: ringId });
      const { data, error } = await createClient().rpc('get_paged_data', {
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
    {
      enabled: !!ringId,
      staleTime: 5 * 60 * 1000,
    }
  );
  
  const mappedNodes = useMemo((): RingMapNode[] => {
    if (!rawNodes) return [];
    return rawNodes.map(mapNodeData).filter((n): n is RingMapNode => n !== null);
  }, [rawNodes]);

  const { mainSegments, spurConnections, allConnections } = useMemo(() => {
    if (mappedNodes.length === 0) {
      return { mainSegments: [], spurConnections: [], allConnections: [] };
    }

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    const spokes = mappedNodes.filter((node) => !node.is_hub);

    const segments: Array<[RingMapNode, RingMapNode]> = [];
    
    // 1. Create Main Ring Loop
    if (hubs.length > 0) {
      // If we have hubs, connect them in a circle
      if (hubs.length > 1) {
        hubs.forEach((hub, index) => {
          const nextHub = hubs[(index + 1) % hubs.length];
          segments.push([hub, nextHub]);
        });
      }
    } else {
      // If no hubs defined, assume linear/ring based on order of all nodes
      const allNodesSorted = [...mappedNodes].sort(
        (a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0)
      );
      if (allNodesSorted.length > 1) {
        allNodesSorted.forEach((node, index) => {
          const nextNode = allNodesSorted[(index + 1) % allNodesSorted.length];
          segments.push([node, nextNode]);
        });
      }
    }

    // 2. Create Spur Connections (Spoke -> Hub)
    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    const hubMapByOrder = new Map(hubs.map((h) => [Math.floor(h.order_in_ring || 0), h]));

    spokes.forEach((spoke) => {
      const parentHub = hubMapByOrder.get(Math.floor(spoke.order_in_ring || 0));
      if (parentHub) {
        spurs.push([parentHub, spoke]);
      }
    });

    return {
      mainSegments: segments,
      spurConnections: spurs,
      allConnections: [...segments, ...spurs]
    };
  }, [mappedNodes]);

  const ringName = ringDetails?.name || `Ring ${ringId.slice(0, 8)}...`;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderContent = () => {
    const isLoading = isLoadingNodes || isLoadingRingDetails;
    if (isLoading) return <PageSpinner text="Loading Ring Data..." />;
    
    if (mappedNodes.length === 0) {
      return (
        <div className="text-center py-12">
          <FiMap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No Nodes Found For This Ring
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            There are no systems associated with this ring yet.
          </p>
        </div>
      );
    }
    
    // Render based on view mode
    if (viewMode === 'schematic') {
      return (
        <MeshDiagram 
          nodes={mappedNodes} 
          connections={allConnections} 
          ringName={ringName}
          onBack={handleBack} // Pass the onBack handler here
        />
      );
    }

    // Default to Map View
    // Filter out nodes without coordinates for the map
    const mapNodes = mappedNodes.filter(n => n.lat != null && n.long != null);
    
    if (mapNodes.length === 0) {
       return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-center">
              <p className="font-semibold">No Geographic Data</p>
              <p className="text-sm">None of the nodes in this ring have latitude/longitude coordinates.</p>
              <button 
                onClick={() => setViewMode('schematic')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Switch to Schematic View
              </button>
           </div>
        </div>
       );
    }

    return (
      <ClientRingMap
        nodes={mapNodes}
        solidLines={mainSegments}
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
          description={`Visualizing the ${
            ringDetails?.ring_type_name || 'ring'
          } network topology.`}
          icon={<FiMap />}
          actions={[
            {
              label: viewMode === 'map' ? 'Schematic View' : 'Map View',
              onClick: () => setViewMode(prev => prev === 'map' ? 'schematic' : 'map'),
              variant: 'primary',
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
    </div>
  );
}