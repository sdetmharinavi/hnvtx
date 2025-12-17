// app/dashboard/network-topology/page.tsx
"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageSpinner, ErrorDisplay, SearchableSelect } from "@/components/common/ui";
import { NetworkTopologyDiagram } from "@/components/topology/NetworkTopologyDiagram";
import { FiShare2 } from "react-icons/fi";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { useNetworkTopologyData } from "@/hooks/data/useNetworkTopologyData";

export default function NetworkTopologyPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Fetch all maintenance areas for the filter dropdown
  const { data: areasResult, isLoading: isLoadingAreas } = useTableQuery(
    createClient(),
    'maintenance_areas',
    { columns: 'id, name, code', filters: { status: true } }
  );

  const areaOptions = useMemo(() => 
    areasResult?.data?.map(area => ({
      value: area.id,
      label: `${area.name} ${area.code ? `(${area.code})` : ''}`
    })) || [],
    [areasResult]
  );
  
  // Fetch topology data based on the selected area
  const { nodes, cables, isLoading, isError, error, refetch } = useNetworkTopologyData(selectedAreaId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Network Topology Explorer"
        description="Visualize the physical connections and relationships between all network nodes and systems."
        icon={<FiShare2 />}
        actions={[{ label: "Refresh Data", onClick: () => refetch(), variant: "outline" }]}
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Maintenance Area
        </label>
        <SearchableSelect
          options={areaOptions}
          value={selectedAreaId}
          onChange={setSelectedAreaId}
          placeholder={isLoadingAreas ? "Loading areas..." : "Select an area to view topology"}
          clearable
        />
      </div>

      <div className="h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4">
        {isLoading && <PageSpinner text="Loading network data..." />}
        {isError && <ErrorDisplay error={error.message} />}
        {!isLoading && !isError && (
          <NetworkTopologyDiagram nodes={nodes} connections={cables} />
        )}
      </div>
    </div>
  );
}