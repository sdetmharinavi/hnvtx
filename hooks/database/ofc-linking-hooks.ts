// hooks/database/ofc-linking-hooks.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { localDb } from '@/hooks/data/localDb';
import { syncEntity } from '@/hooks/data/useDataSync';

const supabase = createClient();

export function useLinkCables() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      cableId1,
      cableId2,
      description,
    }: {
      cableId1: string;
      cableId2: string;
      description?: string;
    }) => {
      if (!isOnline) throw new Error('Linking cables requires an online connection.');

      // Check if link exists (prevent duplicates via application logic for better UX)
      const { data: existing } = await supabase
        .from('ofc_cable_links')
        .select('id')
        .or(
          `and(cable_id_1.eq.${cableId1},cable_id_2.eq.${cableId2}),and(cable_id_1.eq.${cableId2},cable_id_2.eq.${cableId1})`
        );

      if (existing && existing.length > 0) {
        throw new Error('These cables are already linked.');
      }

      const { error } = await supabase.from('ofc_cable_links').insert({
        cable_id_1: cableId1,
        cable_id_2: cableId2,
        description,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Cables linked successfully.');
      // Sync the view to update the `linked_cables` JSON
      await syncEntity(supabase, localDb, 'v_ofc_cables_complete');
      queryClient.invalidateQueries({ queryKey: ['ofc_cables-data'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'v_ofc_cables_complete'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUnlinkCable() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!isOnline) throw new Error('Unlinking cables requires an online connection.');

      const { error } = await supabase.from('ofc_cable_links').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Link removed.');
      await syncEntity(supabase, localDb, 'v_ofc_cables_complete');
      queryClient.invalidateQueries({ queryKey: ['ofc_cables-data'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'v_ofc_cables_complete'] });
    },
    onError: (err) => toast.error(err.message),
  });
}