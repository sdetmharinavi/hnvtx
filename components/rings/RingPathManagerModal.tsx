// path: components/rings/RingPathManagerModal.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Input, Label, SearchableSelect } from '@/components/common/ui';
import { createClient } from '@/utils/supabase/client';
import { useTableQuery } from '@/hooks/database';
import { useUpdateLogicalPathDetails } from '@/hooks/database/ring-provisioning-hooks';
import { Logical_pathsRowSchema } from '@/schemas/zod-schemas';
import { ArrowRight, Server, Cable } from 'lucide-react';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';

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
  const [pathName, setPathName] = useState<string>('');
  const [ringNamePrefix, setRingNamePrefix] = useState<string>('');
  const [linkTypeId, setLinkTypeId] = useState<string | null>(null);
  const [bandwidth, setBandwidth] = useState<string>('');

  const [sourceSystemId, setSourceSystemId] = useState<string | null>(null);
  const [sourcePort, setSourcePort] = useState<string | null>(null);
  const [destSystemId, setDestSystemId] = useState<string | null>(null);
  const [destPort, setDestPort] = useState<string | null>(null);

  // Fetch Link Types
  const { options: linkTypeOptions, isLoading: loadingLinkTypes } =
    useLookupTypeOptions('LINK_TYPES');

  useEffect(() => {
    if (isOpen && path) {
      setSourceSystemId(path.source_system_id || null);
      setSourcePort(path.source_port || null);
      setDestSystemId(path.destination_system_id || null);
      setDestPort(path.destination_port || null);
      setPathName(path.name || '');
      // Extract ring name: everything before the first ':'
      if (path.name) {
        const ringName = path.name.split(':')[0].trim();
        setRingNamePrefix(ringName);
      }
      setLinkTypeId(null);
      setBandwidth('');
    } else if (!isOpen) {
      setPathName('');
      setRingNamePrefix('');
      setLinkTypeId(null);
      setBandwidth('');
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
    },
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
    },
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
    [sourceSystemsData],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const destSystemOptions = useMemo(() => mapSystemsToOptions(destSystemsData), [destSystemsData]);
  const sourcePortOptions = useMemo(
    () => (sourcePortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [sourcePortsData],
  );
  const destPortOptions = useMemo(
    () => (destPortsData?.data || []).map((p) => ({ value: p.port!, label: p.port! })),
    [destPortsData],
  );

  // Get selected system names
  const selectedSourceSystem = useMemo(() => {
    if (!sourceSystemId || !sourceSystemsData?.data) return null;
    return sourceSystemsData.data.find((s) => s.id === sourceSystemId);
  }, [sourceSystemId, sourceSystemsData]);

  const selectedDestSystem = useMemo(() => {
    if (!destSystemId || !destSystemsData?.data) return null;
    return destSystemsData.data.find((s) => s.id === destSystemId);
  }, [destSystemId, destSystemsData]);

  // Get selected link type label
  const selectedLinkType = useMemo(() => {
    if (!linkTypeId) return null;
    return linkTypeOptions.find((opt) => opt.value === linkTypeId);
  }, [linkTypeId, linkTypeOptions]);

  // Auto-generate path name: Ring:LinkType: System:Port → System:Port
  useEffect(() => {
    const parts: string[] = [];

    // Start with ring name if it exists
    if (ringNamePrefix) {
      parts.push(ringNamePrefix);
    }

    // Add link type if selected (will be joined with : later)
    const linkTypePart = selectedLinkType ? selectedLinkType.label : null;

    // Build system:port parts
    const systemParts: string[] = [];

    if (selectedSourceSystem && sourcePort) {
      systemParts.push(`${selectedSourceSystem.system_name}:${sourcePort}`);
    }

    if (selectedDestSystem && destPort) {
      systemParts.push(`${selectedDestSystem.system_name}:${destPort}`);
    }

    // Construct final name based on what we have
    let finalName = '';

    if (parts.length > 0) {
      // Start with ring name
      finalName = parts[0];

      // Add link type if present
      if (linkTypePart) {
        finalName += `:${linkTypePart}`;
      }

      // Add system parts if present
      if (systemParts.length > 0) {
        finalName += `: ${systemParts.join(' → ')}`;
      }
    } else if (systemParts.length > 0) {
      // No ring name, just system parts
      finalName = systemParts.join(' → ');
    }

    if (finalName) {
      setPathName(finalName);
    }
  }, [
    ringNamePrefix,
    selectedLinkType,
    selectedSourceSystem,
    sourcePort,
    selectedDestSystem,
    destPort,
  ]);

  const handleSave = () => {
    if (!path?.id || !sourceSystemId || !sourcePort) return;

    updatePathMutation.mutate(
      {
        pathId: path.id,
        name: pathName,
        sourceSystemId,
        sourcePort,
        destinationSystemId: destSystemId,
        destinationPort: destPort,
        linkTypeId,
        bandwidth,
        startNodeId: path.start_node_id || undefined,
        endNodeId: path.end_node_id || undefined,
      },
      { onSuccess: () => onClose() },
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
    register: (name: string) => ({ name, onChange: () => {}, onBlur: () => {}, ref: () => {} }),
    formState: { isDirty: true, errors: {} },
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
      title='Configure Path Endpoints'
      isEditMode={true}
      isLoading={isLoading}
      form={mockForm} // Passing mock
      onSubmit={handleSave}
      size='lg'
    >
      <div className='space-y-6'>
        {/* Visual Header */}
        <div className='flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700'>
          <div className='text-center flex-1'>
            <div className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mb-2'>
              <Server size={16} />
            </div>
            <p className='text-xs text-gray-500 uppercase font-bold'>Start Node</p>
            <p className='font-semibold text-gray-900 dark:text-white'>{path.start_node?.name}</p>
          </div>
          <div className='flex flex-col items-center px-4 text-gray-400'>
            <span className='text-xs font-mono mb-1'>Linked via</span>
            <Cable size={24} className='text-blue-500' />
            <ArrowRight size={16} className='mt-1' />
          </div>
          <div className='text-center flex-1'>
            <div className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 mb-2'>
              <Server size={16} />
            </div>
            <p className='text-xs text-gray-500 uppercase font-bold'>End Node</p>
            <p className='font-semibold text-gray-900 dark:text-white'>{path.end_node?.name}</p>
          </div>
        </div>

        {/* Service Configuration Section */}
        <div className='bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-4'>
          <h3 className='text-sm font-bold text-blue-800 dark:text-blue-200 border-b border-blue-200 dark:border-blue-800 pb-2'>
            Service Definition
          </h3>

          <div>
            <Label htmlFor='path_name' required>
              Path / Service Name
            </Label>
            <Input
              id='path_name'
              value={pathName}
              onChange={(e) => {
                setPathName(e.target.value);
                // Update ring name prefix when manually edited (extract before first :)
                const newRingName = e.target.value.split(':')[0].trim();
                if (newRingName) {
                  setRingNamePrefix(newRingName);
                }
              }}
              placeholder='e.g. HNV-03:Link Type: System:Port → System:Port'
              className='mt-1 bg-white dark:bg-gray-800'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Format: Ring:LinkType: System:Port → System:Port
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <SearchableSelect
              label='Link Type'
              options={linkTypeOptions}
              value={linkTypeId}
              onChange={setLinkTypeId}
              placeholder='Select Type...'
              isLoading={loadingLinkTypes}
            />
            <div>
              <Label htmlFor='bandwidth'>Bandwidth</Label>
              <Input
                id='bandwidth'
                value={bandwidth}
                onChange={(e) => setBandwidth(e.target.value)}
                placeholder='e.g. 10 Gbps'
                className='mt-1 bg-white dark:bg-gray-800'
              />
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Source Configuration */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700'>
              <span className='w-2 h-2 rounded-full bg-blue-500'></span>
              <h4 className='font-semibold text-sm text-gray-700 dark:text-gray-300'>
                Source Configuration <span className='text-red-500'>*</span>
              </h4>
            </div>
            <SearchableSelect
              label='System'
              options={sourceSystemOptions}
              value={sourceSystemId}
              onChange={setSourceSystemId}
              placeholder='Select System...'
            />
            <SearchableSelect
              label='Interface / Port'
              options={sourcePortOptions}
              value={sourcePort}
              onChange={setSourcePort}
              placeholder='Select Port...'
              disabled={!sourceSystemId}
            />
          </div>

          {/* Destination Configuration */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700'>
              <span className='w-2 h-2 rounded-full bg-purple-500'></span>
              <h4 className='font-semibold text-sm text-gray-700 dark:text-gray-300'>
                Destination Configuration
              </h4>
            </div>
            <SearchableSelect
              label='System'
              options={destSystemOptions}
              value={destSystemId}
              onChange={setDestSystemId}
              placeholder='Select System...'
            />
            <SearchableSelect
              label='Interface / Port'
              options={destPortOptions}
              value={destPort}
              onChange={setDestPort}
              placeholder='Select Port...'
              disabled={!destSystemId}
            />
          </div>
        </div>
      </div>
    </BaseFormModal>
  );
};
