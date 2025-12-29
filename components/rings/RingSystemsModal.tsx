// path: components/rings/RingSystemsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Modal, Button, PageSpinner, ErrorDisplay } from '@/components/common/ui';
import { V_ringsRowSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { syncEntity } from '@/hooks/data/useDataSync';
import { localDb } from '@/hooks/data/localDb';
// import { buildRpcFilters } from '@/hooks/database'; // Added import

interface SystemOption {
  id: string;
  name: string | null;
}

interface RingSystemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ring: V_ringsRowSchema | null;
}

const useRingSystemsData = (ring: V_ringsRowSchema | null) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['ring-systems-data', ring?.id],
    queryFn: async () => {
      if (!ring?.id || !ring.maintenance_terminal_id) {
        return { associated: [], available: [] };
      }

      // CHANGED: Use RPC get_paged_data for associated systems
      const { data: associatedRpc, error: assocError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_systems_complete',
        p_limit: 1000,
        p_offset: 0,
        p_filters: { ring_id: ring.id },
      });
      if (assocError) throw new Error(`Failed to fetch associated systems: ${assocError.message}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const associated = ((associatedRpc as any)?.data as V_systems_completeRowSchema[]) || [];

      // CHANGED: Use RPC for available systems
      // Filter: IN ('CPAN', 'MAAN', 'SDH'), ring_id is NULL, maintenance area matches
      // const availableFilters = buildRpcFilters({
      //   system_type_code: ['CPAN', 'MAAN', 'SDH'], // Array will be handled as IN
      //   ring_id: { operator: 'is', value: 'null' }, // Explicit null check syntax from buildRpcFilters logic
      //   maintenance_terminal_id: ring.maintenance_terminal_id,
      // });

      // Since buildRpcFilters might not support complex OR/IN logic perfectly for multi-field custom logic like "is null",
      // we might need a custom query or handle filtering client side if the dataset is small.
      // However, get_paged_data is generic.
      // Let's use a simpler approach: Fetch all systems in the maintenance area and filter in JS for "Available"

      const { data: areaSystemsRpc, error: availError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_systems_complete',
        p_limit: 2000,
        p_offset: 0,
        p_filters: { maintenance_terminal_id: ring.maintenance_terminal_id },
      });

      if (availError) throw new Error(`Failed to fetch available systems: ${availError.message}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allAreaSystems = ((areaSystemsRpc as any)?.data as V_systems_completeRowSchema[]) || [];

      const available = allAreaSystems.filter(
        (s) =>
          !s.ring_id && // Must not be in a ring
          ['CPAN', 'MAAN', 'SDH'].includes(s.system_type_code || '') // Must be correct type
      );

      return { associated, available };
    },
    enabled: !!ring?.id && !!ring.maintenance_terminal_id,
  });
};

export function RingSystemsModal({ isOpen, onClose, ring }: RingSystemsModalProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data, isLoading, isError, error } = useRingSystemsData(ring);

  const [associated, setAssociated] = useState<SystemOption[]>([]);
  const [available, setAvailable] = useState<SystemOption[]>([]);
  const [selectedAssociated, setSelectedAssociated] = useState<Set<string>>(new Set());
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data) {
      setAssociated(data.associated.map((item) => ({ id: item.id!, name: item.system_name })));
      setAvailable(data.available.map((item) => ({ id: item.id!, name: item.system_name })));
    }
  }, [data]);

  // ... (Rest of the component logic remains identical) ...
  const updateMutation = useMutation({
    mutationFn: async (systemIds: string[]) => {
      if (!ring?.id) throw new Error('Ring ID is missing.');
      const { error } = await supabase.rpc('update_ring_system_associations', {
        p_ring_id: ring.id,
        p_system_ids: systemIds,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(`Systems for ring "${ring?.name}" have been updated.`);

      await syncEntity(supabase, localDb, 'v_rings');
      await queryClient.invalidateQueries({ queryKey: ['rings-manager-data'] });

      onClose();
    },
    onError: (err) => toast.error(`Failed to update systems: ${err.message}`),
  });

  const handleToggleSelection = (list: 'associated' | 'available', id: string) => {
    const [selected, setSelected] =
      list === 'associated'
        ? [selectedAssociated, setSelectedAssociated]
        : [selectedAvailable, setSelectedAvailable];
    const newSelection = new Set(selected);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelected(newSelection);
  };

  const moveItems = (from: 'available' | 'associated') => {
    if (from === 'available') {
      const itemsToMove = available.filter((item) => selectedAvailable.has(item.id));
      setAssociated((prev) =>
        [...prev, ...itemsToMove].sort((a, b) => a.name!.localeCompare(b.name!))
      );
      setAvailable((prev) => prev.filter((item) => !selectedAvailable.has(item.id)));
      setSelectedAvailable(new Set());
    } else {
      const itemsToMove = associated.filter((item) => selectedAssociated.has(item.id));
      setAvailable((prev) =>
        [...prev, ...itemsToMove].sort((a, b) => a.name!.localeCompare(b.name!))
      );
      setAssociated((prev) => prev.filter((item) => !selectedAssociated.has(item.id)));
      setSelectedAssociated(new Set());
    }
  };

  const handleSave = () => {
    const finalSystemIds = associated.map((item) => item.id);
    updateMutation.mutate(finalSystemIds);
  };

  const ListBox: React.FC<{
    title: string;
    items: SystemOption[];
    selected: Set<string>;
    onSelect: (id: string) => void;
  }> = ({ title, items, selected, onSelect }) => (
    <div className="flex flex-col w-full border border-gray-300 dark:border-gray-600 rounded-lg">
      <h4 className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-800 dark:text-gray-200">
        {title} ({items.length})
      </h4>
      <div className="flex-1 overflow-y-auto p-2 min-h-[250px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
            No systems
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`p-2 rounded cursor-pointer text-sm ${
                selected.has(item.id)
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {item.name}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Systems in Ring: ${ring?.name}`}
      size="full"
    >
      {isLoading ? (
        <PageSpinner text="Loading systems..." />
      ) : isError ? (
        <ErrorDisplay error={error.message} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <ListBox
              title="Available Systems"
              items={available}
              selected={selectedAvailable}
              onSelect={(id) => handleToggleSelection('available', id)}
            />

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => moveItems('available')}
                disabled={selectedAvailable.size === 0}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => moveItems('associated')}
                disabled={selectedAssociated.size === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            <ListBox
              title="Associated Systems"
              items={associated}
              selected={selectedAssociated}
              onSelect={(id) => handleToggleSelection('associated', id)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
