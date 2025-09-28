// path: app/dashboard/rings/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMap } from "react-icons/fi";
import { useRingNodes } from "@/hooks/database/ring-map-queries";
import ClientRingMap from "@/components/map/ClientRingMap";
import { PageSpinner, ErrorDisplay, Button } from "@/components/common/ui";
import { PageHeader } from "@/components/common/page-header";

export default function RingMapPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.id as string;

  const { data: nodes, isLoading, isError, error, refetch } = useRingNodes(ringId);

  const ringName = nodes?.[0]?.ring_name || `Ring ${ringId.slice(0, 8)}...`;

  const renderContent = () => {
    if (isLoading) {
      return <PageSpinner text="Loading Ring Map Data..." />;
    }

    if (isError) {
      return (
        <ErrorDisplay
          error={error.message}
          actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]}
        />
      );
    }
    
    if (!nodes || nodes.length === 0) {
        return (
            <div className="text-center py-12">
                <FiMap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Nodes Found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No nodes are associated with this ring in the database.</p>
                <Button onClick={() => router.back()} className="mt-6">
                    <FiArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }

    return <ClientRingMap nodes={nodes} ringName={ringName} />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={ringName}
        description="Visualizing the ring topology and connected nodes."
        icon={<FiMap />}
        actions={[
          {
            label: "Back to Rings List",
            onClick: () => router.push('/dashboard/rings'),
            variant: "outline",
            leftIcon: <FiArrowLeft />,
          },
        ]}
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4">
        {renderContent()}
      </div>
    </div>
  );
}