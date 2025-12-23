// path: app/api/route/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import z from 'zod';

// It is NOT a database model, but an API contract.
const evolutionCommitPayloadSchema = z.object({
    plannedJointBoxes: z.array(z.object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      attributes: z.object({
        position_on_route: z.number().min(0).max(100),
      }),
    })),
    plannedSegments: z.array(z.object({
      segment_order: z.number(),
      start_node_id: z.string(),
      end_node_id: z.string(),
      fiber_count: z.number(),
      distance_km: z.number(),
    })),
    plannedSplices: z.array(z.object({
      fiber_count: z.number(),
      distance_km: z.number(),
    })),
  });
  
  // Infer the TypeScript type from the schema.
  export type EvolutionCommitPayload = z.infer<typeof evolutionCommitPayloadSchema>;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const routeId = (await context.params).id;
  if (!routeId) {
    return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    // 1. Fetch main route info from the complete view
    const { data: routeData, error: routeError } = await supabase
      .from('v_ofc_cables_complete')
      .select('*')
      .eq('id', routeId)
      .maybeSingle(); 

    if (routeError) throw new Error(`Route fetch error: ${routeError.message}`);
    if (!routeData) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    
    // 2. Fetch all existing JCs on this cable
    // THE FIX: Changed 'node:node_id(name)' to 'node:nodes(name)'
    // PostgREST uses the table name 'nodes' to resolve the relationship.
    const { data: jcData, error: jcError } = await supabase
      .from('junction_closures')
      .select('*, node:nodes(name)') 
      .eq('ofc_cable_id', routeId);

    if (jcError) throw new Error(`JC fetch error: ${jcError.message}`);

    const jointBoxes = (jcData || []).map(jc => ({
      ...jc,
      status: 'existing' as const,
      attributes: {
        position_on_route: (jc.position_km / (routeData.current_rkm || 1)) * 100,
        // The name is now correctly available under the 'node' relation alias
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (jc as any).node?.name 
      }
    }));

    // 3. Fetch all current segments for this cable
    const { data: segmentData, error: segmentError } = await supabase
      .from('cable_segments')
      .select('*')
      .eq('original_cable_id', routeId)
      .order('segment_order');
      
    if (segmentError) throw new Error(`Segment fetch error: ${segmentError.message}`);

    // Construct the final payload correctly
    const payload = {
      route: {
        ...routeData,
        // Add the nested objects the client side logic expects for start/end sites
        start_site: { id: routeData.sn_id, name: routeData.sn_name },
        end_site: { id: routeData.en_id, name: routeData.en_name },
        evolution_status: segmentData && segmentData.length > 1 ? 'fully_segmented' : (jointBoxes.length > 0 ? 'with_jcs' : 'simple')
      },
      jointBoxes,
      segments: segmentData || [],
      splices: [] // Placeholder for splices
    };

    return NextResponse.json(payload);

  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Error fetching route details for ID ${routeId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const routeId = (await context.params).id;
    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }
  
    try {
      const payload = await request.json();
  
      // Validate the incoming payload against our strict Zod schema
      const validationResult = evolutionCommitPayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        return NextResponse.json({ error: 'Invalid payload structure.', details: z.treeifyError(validationResult.error) }, { status: 400 });
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