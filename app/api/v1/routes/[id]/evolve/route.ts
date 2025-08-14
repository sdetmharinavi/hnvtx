// app/api/v1/routes/[id]/evolve/route.ts
import { NextResponse } from 'next/server';
import { isEvolutionCommitPayload } from '@/components/ofcadv/schemas';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const routeId = params.id;
  const payload: unknown = await request.json();

  if (!isEvolutionCommitPayload(payload)) {
    return NextResponse.json(
      { message: 'Invalid payload for route evolution commit' },
      { status: 400 }
    );
  }

  console.log(`== API[v1] [POST]: Evolve route: ${routeId} ==`);
  console.log('Payload Received:', JSON.stringify(payload, null, 2));

  // Simulate success
  return NextResponse.json({
    message: `Successfully evolved route ${routeId} with ${payload.plannedEquipment.length} new closures.`,
  });
}
