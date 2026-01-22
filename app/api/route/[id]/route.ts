// app/api/route/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import z from 'zod';
import {
  V_ofc_cables_completeRowSchema,
  V_junction_closures_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';

// THE FIX: Opt out of static caching
export const dynamic = 'force-dynamic';

// ... (rest of the schema definitions)
const evolutionCommitPayloadSchema = z.object({
  plannedJointBoxes: z.array(
    z.object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      attributes: z.object({
        position_on_route: z.number().min(0).max(100),
      }),
    })
  ),
  plannedSegments: z.array(
    z.object({
      segment_order: z.number(),
      start_node_id: z.string(),
      end_node_id: z.string(),
      fiber_count: z.number(),
      distance_km: z.number(),
    })
  ),
  plannedSplices: z.array(
    z.object({
      fiber_count: z.number(),
      distance_km: z.number(),
    })
  ),
});

export type EvolutionCommitPayload = z.infer<typeof evolutionCommitPayloadSchema>;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const routeId = (await context.params).id;
  if (!routeId) {
    return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    // 1. Fetch main route info
    const { data: routeRpcData, error: routeError } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_ofc_cables_complete',
      p_limit: 1,
      p_offset: 0,
      p_filters: { id: routeId },
    });

    if (routeError) throw new Error(`Route fetch error: ${routeError.message}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routeDataList = (routeRpcData as any)?.data as V_ofc_cables_completeRowSchema[];
    const routeData = routeDataList?.[0];

    if (!routeData) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    // 2. Fetch JCs
    const { data: jcRpcData, error: jcError } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_junction_closures_complete',
      p_limit: 1000,
      p_offset: 0,
      p_filters: { ofc_cable_id: routeId },
    });

    if (jcError) throw new Error(`JC fetch error: ${jcError.message}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jcDataList = (jcRpcData as any)?.data as V_junction_closures_completeRowSchema[];

    // Transform
    const jointBoxes = (jcDataList || []).map((jc) => ({
      ...jc,
      id: jc.id!, 
      node_id: jc.node_id!,
      ofc_cable_id: jc.ofc_cable_id!,
      created_at: null,
      updated_at: null,
      status: 'existing' as const,
      node: { name: jc.name },
      attributes: {
        position_on_route:
          jc.position_km && routeData.current_rkm
            ? (jc.position_km / routeData.current_rkm) * 100
            : 0,
        name: jc.name || undefined,
      },
    }));

    // 3. Fetch Segments
    const { data: segmentRpcData, error: segmentError } = await supabase.rpc('get_paged_data', {
      p_view_name: 'cable_segments',
      p_limit: 1000,
      p_offset: 0,
      p_filters: { original_cable_id: routeId },
      p_order_by: 'segment_order',
      p_order_dir: 'asc',
    });

    if (segmentError) throw new Error(`Segment fetch error: ${segmentError.message}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmentData = (segmentRpcData as any)?.data as Cable_segmentsRowSchema[];

    const payload = {
      route: {
        ...routeData,
        start_site: { id: routeData.sn_id, name: routeData.sn_name },
        end_site: { id: routeData.en_id, name: routeData.en_name },
        evolution_status:
          segmentData && segmentData.length > 1
            ? 'fully_segmented'
            : jointBoxes.length > 0
            ? 'with_jcs'
            : 'simple',
      },
      jointBoxes,
      segments: segmentData || [],
      splices: [],
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Error fetching route details for ID ${routeId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const routeId = (await context.params).id;
  if (!routeId) {
    return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const validationResult = evolutionCommitPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload structure.', details: z.treeifyError(validationResult.error) },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('upsert_route_topology_from_excel', {
      p_route_id: routeId,
      p_junction_closures: validationResult.data.plannedJointBoxes,
      p_cable_segments: validationResult.data.plannedSegments,
      p_fiber_splices: validationResult.data.plannedSplices,
    });

    if (error) throw error;

    return NextResponse.json({ message: 'Route evolution committed successfully', data });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Error committing evolution for route ${routeId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}