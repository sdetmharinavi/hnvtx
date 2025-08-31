"use client";

import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTableRecord } from "@/hooks/database";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ui/error/ErrorDisplay";
import { SystemRingPath } from "@/components/systems/SystemRingPath";

import { Row } from "@/hooks/database";

type SystemWithNode = Row<'systems'> & {
  ring_no: string | null;
  node: {
    id: string;
    name: string;
  } | null;
};

export default function SystemDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const { data: system, isLoading, isError, error, refetch } = useTableRecord<'systems', SystemWithNode>(
    supabase,
    "systems",
    id,
    { columns: "*, node:node_id(id, name)" }
  );

  if (isLoading) return <PageSpinner />;
  if (isError) return <ErrorDisplay error={error?.message} actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]} />;
  if (!system) return <div className="p-6">System not found.</div>;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{system.system_name}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Ring: {system.ring_no || "Not Assigned"} | Home Node: {system.node?.name}
        </p>
      </header>

      <main>
        {/* You can add other system detail cards here in the future */}
        
        {/* The new Ring Path Management Component */}
        <SystemRingPath system={system as Row<'systems'> & { node: Row<'nodes'> | null }} />
      </main>
    </div>
  );
}