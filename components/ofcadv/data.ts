// lib/data.ts
import 'server-only';
import { RouteForSelection } from './types';

// In a real app, this would connect to your database (e.g., using Prisma)
export const getRoutesForSelection = async (): Promise<RouteForSelection[]> => {
  console.log("== EXECUTING ON SERVER: getRoutesForSelection ==");
  
  // Mocking a database call
  const mockRoutes: RouteForSelection[] = [
    { id: 'route-1', route_name: 'NodeA ⇔ NodeB _ 1', evolution_status: 'simple' },
    { id: 'route-2', route_name: 'NodeC ⇔ NodeD _ 1', evolution_status: 'with_jcs' },
    { id: 'route-3', route_name: 'NodeE ⇔ NodeF _ 1', evolution_status: 'fully_segmented' },
  ];
  return mockRoutes;
};