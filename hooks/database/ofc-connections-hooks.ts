// hooks/database/ofc-connections-hooks.ts
"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Ofc_cablesRowSchema, Ofc_connectionsInsertSchema } from '@/schemas/zod-schemas';
import { toast } from 'sonner';

const supabase = createClient();

/**
 * A self-contained mutation hook to ensure all fiber connections for a given OFC Cable exist.
 * It fetches existing connections, calculates which are missing based on cable capacity,
 * and inserts only the missing ones in a single batch.
 */
export const useCreateOfcConnection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ cable }: { cable: Ofc_cablesRowSchema }) => {
            if (!cable || !cable.id || !cable.capacity || cable.capacity <= 0) {
                // This isn't an error, just a condition to not proceed.
                console.log("Skipping connection creation: Invalid cable data provided.");
                return { count: 0, cableId: cable.id };
            }

            // 1. Fetch existing fiber numbers for this cable to determine what's missing.
            const { data: existingConnections, error: fetchError } = await supabase
                .from('ofc_connections')
                .select('fiber_no_sn')
                .eq('ofc_id', cable.id);

            if (fetchError) throw fetchError;

            const existingFiberNumbers = new Set(existingConnections.map(c => c.fiber_no_sn));
            
            // 2. Calculate which fibers are missing.
            const missingFibers: number[] = [];
            for (let i = 1; i <= cable.capacity; i++) {
                if (!existingFiberNumbers.has(i)) {
                    missingFibers.push(i);
                }
            }

            if (missingFibers.length === 0) {
                console.log('No missing connections to create.');
                return { count: 0, cableId: cable.id }; // No-op if everything is correct.
            }

            toast.info(`Found ${missingFibers.length} missing fiber connections. Creating them now...`);

            // 3. Prepare records for the missing fibers.
            const newConnections: Ofc_connectionsInsertSchema[] = missingFibers.map(fiberNo => ({
                ofc_id: cable.id,
                fiber_no_sn: fiberNo,
                fiber_no_en: fiberNo,
                updated_fiber_no_sn: fiberNo, // Logical path defaults to physical
                updated_fiber_no_en: fiberNo,
                updated_sn_id: cable.sn_id,
                updated_en_id: cable.en_id,
                connection_category: 'SPLICE_TYPES', // Default value
                connection_type: 'straight',         // Default value
                status: true,
            }));

            // 4. Insert new records in a single batch.
            const { error: insertError } = await supabase.from('ofc_connections').insert(newConnections);

            if (insertError) throw insertError;
            
            return { count: newConnections.length, cableId: cable.id };
        },
        onSuccess: (result) => {
            if (result.count > 0) {
                toast.success(`Successfully created ${result.count} missing fiber connections.`);
                // Invalidate queries to refetch the connections list and utilization stats.
                queryClient.invalidateQueries({ queryKey: ['ofc_connections-data', result.cableId] });
                queryClient.invalidateQueries({ queryKey: ['table', 'v_cable_utilization', { filters: { cable_id: result.cableId } }] });
            }
        },
        onError: (error: Error) => {
            toast.error(`Failed to create connections: ${error.message}`);
        }
    });
};