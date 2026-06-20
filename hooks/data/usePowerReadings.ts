// hooks/data/usePowerReadings.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';
import { V_port_power_readingsRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters } from '@/hooks/database/utility-functions';

const supabase = createClient();

export function useLogPowerReadings() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (variables: { ringId: string; readings: any[] }) => {
      // Clean up values: convert empty strings to null or valid numbers
      const sanitizedReadings = variables.readings.map(r => ({
        system_id: r.system_id,
        port: r.port,
        tx_power: r.tx_power !== '' && r.tx_power !== null && !isNaN(Number(r.tx_power)) ? Number(r.tx_power) : null,
        rx_power: r.rx_power !== '' && r.rx_power !== null && !isNaN(Number(r.rx_power)) ? Number(r.rx_power) : null,
        remark: r.remark || null,
      })).filter(r => r.tx_power !== null || r.rx_power !== null); // Only log actual readings

      if (sanitizedReadings.length === 0) {
        throw new Error('Please enter at least one valid numeric power reading.');
      }

      const { error } = await supabase.rpc('log_multiple_port_power_readings', {
        p_ring_id: variables.ringId,
        p_readings: sanitizedReadings,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Power Readings logged successfully!');
      invalidateRelatedCaches(queryClient, 'port_power_readings');
      queryClient.invalidateQueries({ queryKey: ['latest-power-readings'] });
      queryClient.invalidateQueries({ queryKey: ['systems-power-readings'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to log power Readings: ${err.message}`);
    },
  });
}

export function useLatestConnectionPower(connectionId: string | null) {
  return useQuery({
    queryKey: ['latest-power-readings', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      const { data, error } = await supabase.rpc('get_latest_connection_power_readings', {
        p_system_connection_id: connectionId,
      });
      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any;
    },
    enabled: !!connectionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLatestSystemsPowerReadings(systemIds: string[]) {
  return useQuery({
    queryKey: ['systems-power-readings', systemIds],
    queryFn: async () => {
      if (!systemIds || systemIds.length === 0) return {};

      // Chunk requests to avoid URL length limits in Postgres/Supabase for huge rings
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < systemIds.length; i += chunkSize) {
        chunks.push(systemIds.slice(i, i + chunkSize));
      }

      const allData: V_port_power_readingsRowSchema[] = [];
      
      for (const chunk of chunks) {
        // THE FIX: Use the secure, RLS-bypassing 'get_paged_data' RPC instead of direct select
        const { data, error } = await supabase.rpc('get_paged_data', {
          p_view_name: 'v_port_power_readings',
          p_limit: 1000,
          p_offset: 0,
          p_filters: buildRpcFilters({ system_id: chunk }),
          p_order_by: 'reading_date',
          p_order_dir: 'desc',
        });

        if (error) {
          console.error('Error fetching power readings via RPC:', error);
          throw error;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data as any)?.data as V_port_power_readingsRowSchema[];
        if (rows) {
          allData.push(...rows);
        }
      }

      // Sort chronologically (newest first)
      allData.sort((a, b) => {
        const dateA = a.reading_date ? new Date(a.reading_date).getTime() : 0;
        const dateB = b.reading_date ? new Date(b.reading_date).getTime() : 0;
        return dateB - dateA;
      });

      const latestReadings: Record<string, V_port_power_readingsRowSchema> = {};
      
      allData.forEach((reading) => {
        if (reading.system_id && reading.port) {
          // Force absolute lowercase and trim to guarantee bulletproof matching
          const safeSysId = String(reading.system_id).toLowerCase().trim();
          const safePort = String(reading.port).toLowerCase().trim();
          const key = `${safeSysId}_${safePort}`;
          
          if (!latestReadings[key]) {
            latestReadings[key] = reading;
          }
        }
      });

      return latestReadings;
    },
    enabled: systemIds.length > 0,
    staleTime: 10 * 1000, // Short cache to reflect newly logged readings quickly
  });
}