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

  // THE DEFINITIVE FIX: Use the correct useOfflineQuery hook, mirroring other functional pages.
  const { data: nodes, isLoading } = useOfflineQuery(
    ['ring-nodes-detail', ringId],
    // Online Fetcher: Call the get_paged_data RPC for the v_ring_nodes view.
    async () => {
      if (!ringId) return [];
      const rpcFilters = buildRpcFilters({ ring_id: ringId });
      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ring_nodes',
        p_limit: 1000, // Get all nodes for this ring
        p_offset: 0,
        p_filters: rpcFilters,
      });
      if (error) throw error;
      return (data as { data: V_ring_nodesRowSchema[] })?.data || [];
    },
    // Offline Fetcher: Read directly from the local Dexie table.
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
        type: node.type,
        ring_status: node.ring_status,
        system_status: node.system_status,
        ring_name: node.ring_name,
        ip: node.ip,
        remark: node.remark,
      }));
  }, [nodes]);

  const { mainSegments, spurConnections, allPairs } = useMemo(() => {
    const ringStatusNodes = mappedNodes.filter(node => node.ring_status);
    const main = (ringStatusNodes.length > 0 ? ringStatusNodes : mappedNodes)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    if (main.length === 0) return { mainSegments: [], spurConnections: [], allPairs: [] };
    const segments: Array<[RingMapNode, RingMapNode]> = [];
    if (main.length > 1) {
      main.forEach((node, index) => {
        const nextNode = main[(index + 1) % main.length];
        segments.push([node, nextNode]);
      });
    }
    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    mappedNodes.filter(node => !node.ring_status).forEach(spurNode => {
      const parentNode = main.find(m => m.order_in_ring === spurNode.order_in_ring);
      if (parentNode) spurs.push([parentNode, spurNode]);
    });
    return { mainSegments: segments, spurConnections: spurs, allPairs: [...segments, ...spurs] };
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