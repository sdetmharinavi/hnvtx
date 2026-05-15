// hooks/database/ofc-linking-hooks.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { invalidateRelatedCaches } from './cache-performance';

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

      // THE FIX: Safe query utilizing the .in() syntax instead of nested .or()
      const { data: existing, error: checkError } = await supabase
        .from('ofc_cable_links')
        .select('id, cable_id_1, cable_id_2')
        .in('cable_id_1', [cableId1, cableId2])
        .in('cable_id_2', [cableId1, cableId2]);

      if (checkError) throw checkError;

      const duplicate = existing?.find(
        (link) =>
          (link.cable_id_1 === cableId1 && link.cable_id_2 === cableId2) ||
          (link.cable_id_1 === cableId2 && link.cable_id_2 === cableId1),
      );

      if (duplicate) throw new Error('These cables are already linked.');

      const { error } = await supabase
        .from('ofc_cable_links')
        .insert({ cable_id_1: cableId1, cable_id_2: cableId2, description });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cables linked successfully.');
      invalidateRelatedCaches(queryClient, 'ofc_cables');
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
    onSuccess: () => {
      toast.success('Link removed.');
      invalidateRelatedCaches(queryClient, 'ofc_cables');
    },
    onError: (err) => toast.error(err.message),
  });
}
