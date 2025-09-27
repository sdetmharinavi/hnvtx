// path: app/dashboard/systems/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTableRecord } from "@/hooks/database";
import { PageSpinner, ErrorDisplay } from "@/components/common/ui";
import { SystemRingPath } from "@/components/systems/SystemRingPath";
import { NodesRowSchema, SystemsRowSchema } from "@/schemas/zod-schemas";

// Define the expected shape of our data, including the nested 'node' object
type SystemWithNode = SystemsRowSchema & {
  node: NodesRowSchema | null;
};

export default function SystemDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const { data: system, isLoading, isError, error, refetch } = useTableRecord<'systems', SystemWithNode>(
    supabase,
    "systems",
    id,
    // This is Supabase's syntax for fetching a related record in the same query
    { columns: "*, node:node_id(*)" }
  );

  if (isLoading) return <PageSpinner text="Loading system details..." />;
  if (isError) return <ErrorDisplay error={error?.message} actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]} />;
  if (!system) return <div className="p-6">System not found. It may have been deleted.</div>;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{system.system_name || "Unnamed System"}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Location: {system.node?.name || "N/A"}
        </p>
      </header>

      <main>
        {/* The main component for building the ring path */}
        <SystemRingPath system={system} />
      </main>
    </div>
  );
}