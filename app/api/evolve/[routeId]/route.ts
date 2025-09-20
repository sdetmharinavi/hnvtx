// app/api/evolve/[routeId]/route.ts
import { NextResponse } from 'next/server';
import { RouteDetailsPayload, EvolutionCommitPayload } from '@/components/route-manager/types';
import { isEvolutionCommitPayload } from '@/components/route-manager/schemas';

// GET handler for fetching detailed data for a selected route
export async function GET(
  request: Request,
  { params }: { params: { routeId: string } }
) {
  const routeId = params.routeId;
  console.log(`== API [GET]: Fetching details for route: ${routeId} ==`);

  // Mocking a DB call to get full details
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


// POST handler for committing the evolution
export async function POST(
  request: Request,
  { params }: { params: { routeId: string } }
) {
  const routeId = params.routeId;
  const payload: unknown = await request.json();

  if (!isEvolutionCommitPayload(payload)) {
    return NextResponse.json(
      { message: 'Invalid payload for route evolution commit' },
      { status: 400 }
    );
  }

  console.log(`== API [POST]: Committing evolution for route: ${routeId} ==`);
  console.log("Payload Received:", JSON.stringify(payload, null, 2));

  // --- In a real application, you would: ---
  // 1. Validate the incoming payload against a schema.
  // 2. Start a database transaction.
  // 3. await db.equipment.createMany({ data: payload.plannedEquipment });
  // 4. await db.cableSegments.createMany({ data: payload.plannedSegments });
  // 5. await db.fiberSplices.createMany({ data: payload.plannedSplices });
  // 6. await db.ofc_routes.update({ where: { id: routeId }, data: { evolution_status: 'fully_segmented' } });
  // 7. Log the event.
  // 8. If all successful, commit the transaction. If any step fails, rollback.

  // Simulating a successful commit
  return NextResponse.json({
    message: `Successfully evolved route ${routeId} with ${payload.plannedEquipment.length} new closures.`,
  });
}