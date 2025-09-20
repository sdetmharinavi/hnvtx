"use client";

// app/evolve/page.tsx
import { getRoutesForSelection } from '@/components/route-manager/data';
import RouteManager from '@/components/route-manager/RouteManager';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';

export default function EvolveRoutePage() {
  // This data fetching runs on the server.
  // const initialRoutes = await getRoutesForSelection();
  const supabase = createClient();

  const {data, isLoading} =  useTableQuery(
      supabase,
      'ofc_cables',
      { orderBy: [{ column: 'route_name' }], columns: 'id,route_name' }
    );

    

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Route Manager
        </h1>
      </div>
      {/* The interactive client component receives server-fetched data as a prop */}
      <RouteManager initialRoutes={data} isRouteLoading={isLoading} />
    </div>
  );
}