// path: components/rings/RingPathManagerModal.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Button, SearchableSelect } from '@/components/common/ui';
import { createClient } from '@/utils/supabase/client';
import { useTableQuery } from '@/hooks/database';
import { useUpdateLogicalPathDetails } from '@/hooks/database/ring-provisioning-hooks';
import { Logical_pathsRowSchema } from '@/schemas/zod-schemas';
import { ArrowRight, Server, Cable } from 'lucide-react';

// Extended type to include joined data
type ExtendedLogicalPath = Logical_pathsRowSchema & {
  start_node?: { name: string } | null;
  end_node?: { name: string } | null;
  // New columns from migration
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

  // --- FIX: Pre-fill data when modal opens ---
  useEffect(() => {
    if (isOpen && path) {
      setSourceSystemId(path.source_system_id || null);
      setSourcePort(path.source_port || null);
      setDestSystemId(path.destination_system_id || null);
      setDestPort(path.destination_port || null);
    } else if (!isOpen) {
      // Reset on close
      setSourceSystemId(null);
      setSourcePort(null);
      setDestSystemId(null);
      setDestPort(null);
    }
  }, [isOpen, path]);

  // --- Fetch Systems for Start Node ---
  const { data: sourceSystemsData } = useTableQuery(supabase, 'systems', {
    columns: 'id, system_name, ip_address',
    filters: { node_id: path?.start_node_id || '' },
    enabled: !!path?.start_node_id,
  });

  // --- Fetch Ports for Selected Source System ---
  const { data: sourcePortsData } = useTableQuery(supabase, 'ports_management', {
    columns: 'port, port_type_id',
    filters: { system_id: sourceSystemId || '' },
    enabled: !!sourceSystemId,
  });

  // --- Fetch Systems for End Node ---
  const { data: destSystemsData } = useTableQuery(supabase, 'systems', {
    columns: 'id, system_name, ip_address',
    filters: { node_id: path?.end_node_id || '' },
    enabled: !!path?.end_node_id,
  });

  // --- Fetch Ports for Selected Dest System ---
  const { data: destPortsData } = useTableQuery(supabase, 'ports_management', {
    columns: 'port, port_type_id',
    filters: { system_id: destSystemId || '' },
    enabled: !!destSystemId,
  });

  const sourceSystemOptions = useMemo(
    () =>
      (sourceSystemsData?.data || []).map((s) => ({
        value: s.id,
        label: s.system_name || 'Unnamed System',
      })),
    [sourceSystemsData]
  );

  const sourcePortOptions = useMemo(
    () => (sourcePortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [sourcePortsData]
  );

  const destSystemOptions = useMemo(
    () =>
      (destSystemsData?.data || []).map((s) => ({
        value: s.id,
        label: s.system_name || 'Unnamed System',
      })),
    [destSystemsData]
  );

  const destPortOptions = useMemo(
    () => (destPortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [destPortsData]
  );

  const handleSave = () => {
    if (!path?.id || !sourceSystemId || !sourcePort || !destSystemId || !destPort) return;

    updatePathMutation.mutate(
      {
        pathId: path.id,
        sourceSystemId,
        sourcePort,
        destinationSystemId: destSystemId,
        destinationPort: destPort,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  if (!isOpen || !path) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Path Endpoints" size="lg">
      <div className="space-y-6 p-4">
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
                Source Configuration
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

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !sourceSystemId ||
              !sourcePort ||
              !destSystemId ||
              !destPort ||
              updatePathMutation.isPending
            }
            variant="primary"
          >
            {updatePathMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
