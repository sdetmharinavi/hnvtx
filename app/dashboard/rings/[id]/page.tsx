// app/dashboard/rings/[id]/page.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMap } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { localDb } from '@/data/localDb';
import { PageSpinner } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { RingMapNode } from '@/components/map/types/node';
import useORSRouteDistances from '@/hooks/useORSRouteDistances';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { createClient } from '@/utils/supabase/client';
import { V_ring_nodesRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters, useTableRecord } from '@/hooks/database';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Ring Map..." />,
});

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;

  // Fetch details for the current ring to check its type
  const { data: ringDetails, isLoading: isLoadingRingDetails } = useTableRecord(
    createClient(),
    'v_rings',
    ringId
  );

  const { data: nodes, isLoading: isLoadingNodes } = useOfflineQuery(
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
    if (!nodes) return [];
    return nodes
      .filter((node) => node.lat != null && node.long != null)
      .map((node) => ({
        id: node.id!,
        ring_id: node.ring_id,
        name: node.name!,
        lat: node.lat!,
        long: node.long!,
        order_in_ring: node.order_in_ring,
        type: node.type!,
        system_type: node.system_type,
        ring_status: node.ring_status,
        system_status: node.system_status,
        ring_name: node.ring_name,
        ip: node.ip,
        remark: node.remark,
        is_hub: node.is_hub,
      }));
  }, [nodes]);

  const { mainSegments, spurConnections, allPairs } = useMemo(() => {
    if (mappedNodes.length === 0) {
      return { mainSegments: [], spurConnections: [], allPairs: [] };
    }

    const hubs = mappedNodes
      .filter((node) => node.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    const spokes = mappedNodes.filter((node) => !node.is_hub);

    // If there are no hubs, treat it as a simple ring connecting all nodes.
    if (hubs.length === 0) {
      const allNodesSorted = mappedNodes.sort(
        (a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0)
      );
      const segments: Array<[RingMapNode, RingMapNode]> = [];
      if (allNodesSorted.length > 1) {
        allNodesSorted.forEach((node, index) => {
          const nextNode = allNodesSorted[(index + 1) % allNodesSorted.length];
          segments.push([node, nextNode]);
        });
      }
      return { mainSegments: segments, spurConnections: [], allPairs: segments };
    }

    // Logic for topologies with hubs (Ring, Mesh, etc.)
    const hubConnections: Array<[RingMapNode, RingMapNode]> = [];
    if (hubs.length > 1) {
      hubs.forEach((hub, index) => {
        const nextHub = hubs[(index + 1) % hubs.length];
        hubConnections.push([hub, nextHub]);
      });
    }

    const spokeToHubConnections: Array<[RingMapNode, RingMapNode]> = [];
    // Create a map of hubs using their integer order_in_ring as the key.
    const hubMapByOrder = new Map(hubs.map((h) => [Math.floor(h.order_in_ring || 0), h]));

    spokes.forEach((spoke) => {
      // Find the parent hub by matching the integer part of the spoke's order_in_ring.
      const parentHub = hubMapByOrder.get(Math.floor(spoke.order_in_ring || 0));
      if (parentHub) {
        spokeToHubConnections.push([parentHub, spoke]);
      }
    });

    return {
      mainSegments: hubConnections,
      spurConnections: spokeToHubConnections,
      allPairs: [...hubConnections, ...spokeToHubConnections],
    };
  }, [mappedNodes]);

  const { distances = {}, isLoading: isLoadingDistances } = useORSRouteDistances(allPairs);

  const ringName = ringDetails?.name || `Ring ${ringId.slice(0, 8)}...`;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderContent = () => {
    const isLoading = isLoadingNodes || isLoadingRingDetails || isLoadingDistances;
    if (isLoading) return <PageSpinner text="Loading Ring Data..." />;
    if (mappedNodes.length === 0)
      return (
        <div className="text-center py-12">
          <FiMap className="mx-auto h-12 w-12 text-gray-400" />{' '}
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No Nodes Found For This Ring
          </h3>
        </div>
      );

    // The ClientRingMap component can now handle both topologies based on the lines it receives.
    return (
      <ClientRingMap
        nodes={mappedNodes}
        solidLines={mainSegments}
        dashedLines={spurConnections}
        distances={distances}
        onBack={handleBack}
        showControls={true}
      />
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={ringName}
        description={`Visualizing the ${
          ringDetails?.ring_type_name || 'ring'
        } and connected nodes.`}
        icon={<FiMap />}
        actions={[
          {
            label: 'Back to Rings List',
            onClick: handleBack,
            variant: 'outline',
            leftIcon: <FiArrowLeft />,
          },
        ]}
      />
      <div className="h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4">
        {renderContent()}
      </div>
    </div>
  );
}
