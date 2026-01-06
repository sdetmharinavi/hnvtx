// path: components/rings/RingPathManagerModal.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/common/ui';
import { createClient } from '@/utils/supabase/client';
import { useTableQuery } from '@/hooks/database';
import { useUpdateLogicalPathDetails } from '@/hooks/database/ring-provisioning-hooks';
import { Logical_pathsRowSchema } from '@/schemas/zod-schemas';
import { ArrowRight, Server, Cable } from 'lucide-react';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

type ExtendedLogicalPath = Logical_pathsRowSchema & {
  start_node?: { name: string } | null;
  end_node?: { name: string } | null;
  source_system_id?: string | null;
  source_port?: string | null;
  destination_system_id?: string | null;
  destination_port?: string | null;
};

interface RingPathManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  path: ExtendedLogicalPath | null;
}

export const RingPathManagerModal: React.FC<RingPathManagerModalProps> = ({
  isOpen,
  onClose,
  path,
}) => {
  const supabase = createClient();
  const updatePathMutation = useUpdateLogicalPathDetails();

  const [sourceSystemId, setSourceSystemId] = useState<string | null>(null);
  const [sourcePort, setSourcePort] = useState<string | null>(null);
  const [destSystemId, setDestSystemId] = useState<string | null>(null);
  const [destPort, setDestPort] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && path) {
      setSourceSystemId(path.source_system_id || null);
      setSourcePort(path.source_port || null);
      setDestSystemId(path.destination_system_id || null);
      setDestPort(path.destination_port || null);
    } else if (!isOpen) {
      setSourceSystemId(null);
      setSourcePort(null);
      setDestSystemId(null);
      setDestPort(null);
    }
  }, [isOpen, path]);

  // --- Fetch Systems & Ports (Same as before) ---
  const { data: sourceSystemsData, isLoading: loadingSrcSys } = useTableQuery(supabase, 'systems', {
    columns: 'id, system_name, ip_address',
    filters: { node_id: path?.start_node_id || '' },
    enabled: !!path?.start_node_id,
  });

  const { data: sourcePortsData, isLoading: loadingSrcPort } = useTableQuery(
    supabase,
    'ports_management',
    {
      columns: 'port, port_type_id',
      filters: { system_id: sourceSystemId || '' },
      enabled: !!sourceSystemId,
    }
  );

  const { data: destSystemsData, isLoading: loadingDstSys } = useTableQuery(supabase, 'systems', {
    columns: 'id, system_name, ip_address',
    filters: { node_id: path?.end_node_id || '' },
    enabled: !!path?.end_node_id,
  });

  const { data: destPortsData, isLoading: loadingDstPort } = useTableQuery(
    supabase,
    'ports_management',
    {
      columns: 'port, port_type_id',
      filters: { system_id: destSystemId || '' },
      enabled: !!destSystemId,
    }
  );

  const mapSystemsToOptions = (data: typeof sourceSystemsData) => {
    return (data?.data || []).map((s) => {
      const labels: string[] = [];
      if (s.system_name) labels.push(s.system_name);
      if (s.ip_address) labels.push(`(${String(s.ip_address).split('/')[0]})`);
      return { value: s.id, label: labels.join(' ') || 'Unnamed System' };
    });
  };

  const sourceSystemOptions = useMemo(
    () => mapSystemsToOptions(sourceSystemsData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceSystemsData]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const destSystemOptions = useMemo(() => mapSystemsToOptions(destSystemsData), [destSystemsData]);
  const sourcePortOptions = useMemo(
    () => (sourcePortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [sourcePortsData]
  );
  const destPortOptions = useMemo(
    () => (destPortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [destPortsData]
  );

  const handleSave = () => {
    if (!path?.id || !sourceSystemId || !sourcePort) return;

    updatePathMutation.mutate(
      {
        pathId: path.id,
        sourceSystemId,
        sourcePort,
        destinationSystemId: destSystemId,
        destinationPort: destPort,
      },
      { onSuccess: () => onClose() }
    );
  };

  // Mock form object to satisfy BaseFormModal interface since we aren't using react-hook-form here fully
  // In a stricter refactor, we would migrate this local state to react-hook-form.
  const mockForm = {
    handleSubmit: (fn: () => void) => (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      fn();
      return Promise.resolve();
    },
    formState: { isDirty: true }, // Always treat as potentially dirty or handle logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const isLoading =
    loadingSrcSys ||
    loadingSrcPort ||
    loadingDstSys ||
    loadingDstPort ||
    updatePathMutation.isPending;

  if (!path) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Path Endpoints"
      isEditMode={true}
      isLoading={isLoading}
      form={mockForm} // Passing mock
      onSubmit={handleSave}
      size="lg"
    >
      <div className="space-y-6">
        {/* Visual Header */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mb-2">
              <Server size={16} />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold">Start Node</p>
            <p className="font-semibold text-gray-900 dark:text-white">{path.start_node?.name}</p>
          </div>
          <div className="flex flex-col items-center px-4 text-gray-400">
            <span className="text-xs font-mono mb-1">Linked via</span>
            <Cable size={24} className="text-blue-500" />
            <ArrowRight size={16} className="mt-1" />
          </div>
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 mb-2">
              <Server size={16} />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold">End Node</p>
            <p className="font-semibold text-gray-900 dark:text-white">{path.end_node?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Source Configuration <span className="text-red-500">*</span>
              </h4>
            </div>
            <SearchableSelect
              label="System"
              options={sourceSystemOptions}
              value={sourceSystemId}
              onChange={setSourceSystemId}
              placeholder="Select System..."
            />
            <SearchableSelect
              label="Interface / Port"
              options={sourcePortOptions}
              value={sourcePort}
              onChange={setSourcePort}
              placeholder="Select Port..."
              disabled={!sourceSystemId}
            />
          </div>

          {/* Destination Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Destination Configuration
              </h4>
            </div>
            <SearchableSelect
              label="System"
              options={destSystemOptions}
              value={destSystemId}
              onChange={setDestSystemId}
              placeholder="Select System..."
            />
            <SearchableSelect
              label="Interface / Port"
              options={destPortOptions}
              value={destPort}
              onChange={setDestPort}
              placeholder="Select Port..."
              disabled={!destSystemId}
            />
          </div>
        </div>
      </div>
    </BaseFormModal>
  );
};
