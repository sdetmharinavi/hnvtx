// app/dashboard/rings/[id]/page.tsx
"use client";

import { useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMap } from "react-icons/fi";
import dynamic from "next/dynamic";
import { localDb } from "@/data/localDb";
import { PageSpinner } from "@/components/common/ui";
import { PageHeader } from "@/components/common/page-header";
import { RingMapNode } from "@/components/map/types/node";
import useORSRouteDistances from "@/hooks/useORSRouteDistances";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { createClient } from "@/utils/supabase/client";
import { V_ring_nodesRowSchema } from "@/schemas/zod-schemas";
import { buildRpcFilters } from "@/hooks/database";

const ClientRingMap = dynamic(() => import("@/components/map/ClientRingMap"), {
  ssr: false,
  loading: () => <PageSpinner text="Loading Ring Map..." />,
});

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;

  const { data: nodes, isLoading } = useOfflineQuery(
    ['ring-nodes-detail', ringId],
    async () => {
      if (!ringId) return [];
      const rpcFilters = buildRpcFilters({ ring_id: ringId });
      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ring_nodes',
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
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
      .filter(node => node.lat != null && node.long != null)
      .map(node => ({
        id: node.id!,
        ring_id: node.ring_id,
        name: node.name!,
        lat: node.lat!,
        long: node.long!,
        order_in_ring: node.order_in_ring,
        type: node.system_type, // intentionally done
        system_type: node.system_type,
        ring_status: node.ring_status,
        system_status: node.system_status,
        ring_name: node.ring_name,
        ip: node.ip,
        remark: node.remark,
      }));
  }, [nodes]);

  // THE FIX: Re-implement the sophisticated logic from your old component.
  const { mainSegments, spurConnections, allPairs } = useMemo(() => {
    if (mappedNodes.length === 0) {
      return { mainSegments: [], spurConnections: [], allPairs: [] };
    }

    const ringStatusNodes = mappedNodes.filter((node) => node.system_status);  // intentionally done
    const hasRingStatus = ringStatusNodes.length > 0;

    const mainNodes = hasRingStatus
      ? ringStatusNodes.sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0))
      : mappedNodes.filter(node => node.type === 'Metro Access Aggregation Node' || node.type === 'Compact Passive Access Node'); // Fallback to MAAN, CPAN nodes

    if (mainNodes.length === 0) {
        // Ultimate fallback if no ring status or MAAN nodes are found
        return { mainSegments: [], spurConnections: [], allPairs: [] };
    }
    
    const mainSegments: Array<[RingMapNode, RingMapNode]> = [];
    const spurConnections: Array<[RingMapNode, RingMapNode]> = [];

    if (hasRingStatus) {
      // Normal Ring Logic
      mainNodes.forEach((node, index) => {
        const nextNode = mainNodes[(index + 1) % mainNodes.length];
        mainSegments.push([node, nextNode]);
      });

      mappedNodes.filter(node => !node.system_status).forEach(spurNode => {
        const parentNode = mainNodes.find(m => m.order_in_ring === spurNode.order_in_ring);
        if (parentNode) spurConnections.push([parentNode, spurNode]);
      });
    } else {
      // Hub-and-Spoke Fallback Logic
      const centralHub = mainNodes[0];
      mappedNodes.forEach(node => {
        if (node.id !== centralHub.id) {
          spurConnections.push([centralHub, node]);
        }
      });
    }

    return { mainSegments, spurConnections, allPairs: [...mainSegments, ...spurConnections] };
  }, [mappedNodes]);


  const { data: distances = {} } = useORSRouteDistances(allPairs);
  
  const ringName = nodes?.[0]?.ring_name || `Ring ${ringId.slice(0, 8)}...`;
  
  const handleBack = useCallback(() => {
    router.push('/dashboard/rings');
  }, [router]);

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Loading Ring Map Data..." />;
    if (mappedNodes.length === 0) return <div className="text-center py-12"><FiMap className="mx-auto h-12 w-12 text-gray-400" /> <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Nodes Found</h3></div>;

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
        description="Visualizing the ring topology and connected nodes."
        icon={<FiMap />}
        actions={[{ label: "Back to Rings List", onClick: handleBack, variant: "outline", leftIcon: <FiArrowLeft /> }]}
      />
      <div className="h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4">
        {renderContent()}
      </div>
    </div>
  );
}