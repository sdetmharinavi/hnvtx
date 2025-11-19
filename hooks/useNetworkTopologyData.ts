// hooks/useNetworkTopologyData.ts
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { v_nodes_completeRowSchema, v_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

const supabase = createClient();

const NodeSchema = v_nodes_completeRowSchema;
const CableSchema = v_ofc_cables_completeRowSchema;

async function fetchTopologyData(maintenanceAreaId: string | null) {
  // Fetch all nodes, optionally filtered by maintenance area
  let nodesQuery = supabase.from('v_nodes_complete').select('*');
  if (maintenanceAreaId) {
    nodesQuery = nodesQuery.eq('maintenance_terminal_id', maintenanceAreaId);
  }
  const { data: nodes, error: nodesError } = await nodesQuery;
  if (nodesError) throw new Error(`Failed to fetch nodes: ${nodesError.message}`);

  // Fetch all cables, optionally filtered by maintenance area
  let cablesQuery = supabase.from('v_ofc_cables_complete').select('*');
  if (maintenanceAreaId) {
    cablesQuery = cablesQuery.eq('maintenance_terminal_id', maintenanceAreaId);
  }
  const { data: cables, error: cablesError } = await cablesQuery;
  if (cablesError) throw new Error(`Failed to fetch cables: ${cablesError.message}`);

  return { nodes: z.array(NodeSchema).parse(nodes || []), cables: z.array(CableSchema).parse(cables || []) };
}

export function useNetworkTopologyData(maintenanceAreaId: string | null) {
  const { data, ...rest } = useQuery({
    queryKey: ['network-topology', maintenanceAreaId],
    queryFn: () => fetchTopologyData(maintenanceAreaId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled, but queryFn handles the null case
  });

  return {
    nodes: data?.nodes ?? [],
    cables: data?.cables ?? [],
    ...rest,
  };
}