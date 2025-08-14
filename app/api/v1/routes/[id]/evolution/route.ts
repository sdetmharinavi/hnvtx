// app/api/v1/routes/[id]/evolution/route.ts
import { NextResponse } from 'next/server';
import { RouteDetailsPayload } from '@/components/ofcadv/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const routeId = params.id;
  console.log(`== API[v1] [GET]: Evolution details for route: ${routeId} ==`);

  // Reuse the same mock as the non-versioned endpoint
  const mockDetails: RouteDetailsPayload = {
    route: {
      id: routeId,
      name: `Route ${routeId.split('-')[1]}`,
      start_site: { id: 'site-a', name: 'NodeA' },
      end_site: { id: 'site-b', name: 'NodeB' },
      capacity: 48,
      distance_km: 25.5,
      evolution_status: routeId === 'route-1' ? 'simple' : 'with_jcs',
    },
    equipment: routeId === 'route-2' ? [
      {
        id: 'jc-existing-1',
        name: 'JC-Mid-01',
        equipment_type: 'junction_closure',
        latitude: 23.5254, longitude: 87.2926,
        status: 'existing',
        attributes: { jc_type: 'inline', capacity: 48, position_on_route: 40 }
      }
    ] : [],
  };

  return NextResponse.json(mockDetails);
}
