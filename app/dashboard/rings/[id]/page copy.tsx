// path: app/dashboard/rings/[id]/page.tsx
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMap } from "react-icons/fi";
import { useRingNodes } from "@/hooks/database/ring-map-queries";
import ClientRingMap from "@/components/map/ClientRingMap";
import { PageSpinner, ErrorDisplay, Button } from "@/components/common/ui";
import { PageHeader } from "@/components/common/page-header";
import { MaanNode, NodeType } from "@/components/map/node";
import useORSRouteDistances from "@/hooks/useORSRouteDistances";

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;

  const { data: nodes, isLoading, isError, error, refetch } = useRingNodes(ringId);

  // Map the fetched data to the MaanNode type
  const mappedNodes = useMemo((): MaanNode[] => {
    if (!nodes) return [];
    return nodes.map(node => ({
      id: node.id!,
      ring_id: node.ring_id,
      name: node.name!,
      lat: node.lat!,
      long: node.long!,
      order_in_ring: node.order_in_ring,
      type: node.type as NodeType | string | null,
      ring_status: node.ring_status,
      ip: node.ip,
      remark: node.remark,
    }));
  }, [nodes]);

  // Perform the business logic to determine main nodes and connection types
  const { mainNodes, mainSegments, spurConnections, allPairs } = useMemo(() => {
    const ringStatusNodes = mappedNodes.filter(node => node.ring_status);
    
    const main = (ringStatusNodes.length > 0 ? ringStatusNodes : mappedNodes.filter(n => n.type === NodeType.MAAN))
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    if (main.length === 0) {
      return { mainNodes: [], mainSegments: [], spurConnections: [], allPairs: [] };
    }

    const segments: Array<[MaanNode, MaanNode]> = [];
    if (main.length > 1) {
      main.forEach((node, index) => {
        const nextNode = main[(index + 1) % main.length];
        segments.push([node, nextNode]);
      });
    }

    const spurs: Array<[MaanNode, MaanNode]> = [];
    mappedNodes.filter(node => !node.ring_status).forEach(spurNode => {
      const parentNode = main.find(m => m.order_in_ring === spurNode.order_in_ring);
      if (parentNode) {
        spurs.push([parentNode, spurNode]);
      }
    });

    return { mainNodes: main, mainSegments: segments, spurConnections: spurs, allPairs: [...segments, ...spurs] };
  }, [mappedNodes]);

  const { data: distances = {} } = useORSRouteDistances(allPairs);

  const ringName = nodes?.[0]?.ring_name || `Ring ${ringId.slice(0, 8)}...`;

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Loading Ring Map Data..." />;
    if (isError) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]} />;
    if (mappedNodes.length === 0) return <div className="text-center py-12"><FiMap className="mx-auto h-12 w-12 text-gray-400" /> <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Nodes Found</h3></div>;

    return (
      <ClientRingMap
        nodes={mappedNodes}
        mainSegments={mainSegments}
        spurConnections={spurConnections}
        distances={distances}
        onBack={() => router.push('/dashboard/rings')}
      />
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={ringName}
        description="Visualizing the ring topology and connected nodes."
        icon={<FiMap />}
        actions={[{ label: "Back to Rings List", onClick: () => router.push('/dashboard/rings'), variant: "outline", leftIcon: <FiArrowLeft /> }]}
      />
      <div className="h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4">
        {renderContent()}
      </div>
    </div>
  );
}