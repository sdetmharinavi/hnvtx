// app/evolve/page.tsx
import { getRoutesForSelection } from '@/components/ofcadv/data';
import RouteManager from '@/components/ofcadv/RouteManager';

export default async function EvolveRoutePage() {
  // This data fetching runs on the server.
  const initialRoutes = await getRoutesForSelection();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Route Manager
        </h1>
      </div>
      {/* The interactive client component receives server-fetched data as a prop */}
      <RouteManager initialRoutes={initialRoutes} />
    </div>
  );
}