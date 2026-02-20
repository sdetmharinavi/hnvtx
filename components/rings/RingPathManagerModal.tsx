// components/rings/RingPathManagerModal.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePagedData } from '@/hooks/database'; // CHANGED: Use RPC hook
import { useUpdateLogicalPathDetails } from '@/hooks/database/ring-provisioning-hooks';
import { 
  Logical_pathsRowSchema, 
  V_systems_completeRowSchema, 
  V_ports_management_completeRowSchema 
} from '@/schemas/zod-schemas';
import { ArrowRight, Server, Cable, RotateCw } from 'lucide-react';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { Input, Label, Button } from '@/components/common/ui';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { formatIP } from '@/utils/formatters';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';

type ExtendedLogicalPath = Logical_pathsRowSchema & {
  start_node?: { name: string } | null;
  end_node?: { name: string } | null;
  source_system_id?: string | null;
  source_port?: string | null;
  destination_system_id?: string | null;
  destination_port?: string | null;
  source_system?: { system_name: string } | null;
  destination_system?: { system_name: string } | null;
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

  // --- Form State ---
  const [pathName, setPathName] = useState<string>('');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [ringNamePrefix, setRingNamePrefix] = useState<string>('');

  const [linkTypeId, setLinkTypeId] = useState<string | null>(null);
  const [bandwidth, setBandwidth] = useState<string>('');
  
  const [sourceSystemId, setSourceSystemId] = useState<string | null>(null);
  const [sourcePort, setSourcePort] = useState<string | null>(null);
  const [destSystemId, setDestSystemId] = useState<string | null>(null);
  const [destPort, setDestPort] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isServiceDataLoaded, setIsServiceDataLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingService, setIsLoadingService] = useState(false);

  // Fetch Link Types
  const { options: linkTypeOptions, isLoading: loadingLinkTypes } =
    useLookupTypeOptions('LINK_TYPES');

  // --- Initialization Effect ---
  useEffect(() => {
    if (isOpen && path) {
      // 1. Set Basic Path Info from Props
      setSourceSystemId(path.source_system_id || null);
      setSourcePort(path.source_port || null);
      setDestSystemId(path.destination_system_id || null);
      setDestPort(path.destination_port || null);
      setPathName(path.name || '');

      setIsNameManuallyEdited(false); // Reset manual edit flag on open

      // Extract Ring Name Prefix (Everything before the first colon)
      if (path.name) {
        const ringName = path.name.split(':')[0].trim();
        setRingNamePrefix(ringName);
      }

      // 2. Reset Service Fields
      setLinkTypeId(null);
      setBandwidth('');
      setIsServiceDataLoaded(false);

      // 3. Fetch Associated Service Data to Pre-fill
      if (path.name) {
        const fetchServiceData = async () => {
            setIsLoadingService(true);
            try {
                const { data } = await supabase
                  .from('services')
                  .select('link_type_id, bandwidth_allocated')
                  .eq('name', path.name)
                  .maybeSingle();

                 if (data) {
                     if (data.link_type_id) setLinkTypeId(data.link_type_id);
                     if (data.bandwidth_allocated) setBandwidth(data.bandwidth_allocated);
                 }
                 setIsServiceDataLoaded(true);
            } catch (err) {
                console.error("Failed to fetch service data", err);
            } finally {
                setIsLoadingService(false);
            }
        };
        fetchServiceData();
      } else {
        setIsServiceDataLoaded(true); 
      }

    } else if (!isOpen) {
      // Reset everything on close
      setPathName('');
      setLinkTypeId(null);
      setBandwidth('');
      setSourceSystemId(null);
      setSourcePort(null);
      setDestSystemId(null);
      setDestPort(null);
      setIsServiceDataLoaded(false);
      setIsNameManuallyEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, path]); 

  // --- Fetch Systems & Ports using RPC (usePagedData) ---

  // Memoize filters to prevent query thrashing
  const srcFilters = useMemo(() => ({ node_id: path?.start_node_id || undefined }), [path?.start_node_id]);
  const dstFilters = useMemo(() => ({ node_id: path?.end_node_id || undefined }), [path?.end_node_id]);
  const srcPortFilters = useMemo(() => ({ system_id: sourceSystemId || undefined }), [sourceSystemId]);
  const dstPortFilters = useMemo(() => ({ system_id: destSystemId || undefined }), [destSystemId]);

  // CHANGED: Use usePagedData (RPC) instead of useTableQuery
  const { data: sourceSystemsResult, isLoading: loadingSrcSys } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    {
      filters: srcFilters,
      limit: 1000 // Ensure we get all systems for the node
    },
    { enabled: !!path?.start_node_id && isOpen }
  );

  const { data: destSystemsResult, isLoading: loadingDstSys } = usePagedData<V_systems_completeRowSchema>(
    supabase, 
    'v_systems_complete',
    {
      filters: dstFilters,
      limit: 1000
    },
    { enabled: !!path?.end_node_id && isOpen }
  );

  const { data: sourcePortsResult, isLoading: loadingSrcPort } = usePagedData<V_ports_management_completeRowSchema>(
    supabase,
    'v_ports_management_complete',
    {
      filters: srcPortFilters,
      limit: 1000,
      orderBy: 'port'
    },
    { enabled: !!sourceSystemId && isOpen }
  );

  const { data: destPortsResult, isLoading: loadingDstPort } = usePagedData<V_ports_management_completeRowSchema>(
    supabase,
    'v_ports_management_complete',
    {
      filters: dstPortFilters,
      limit: 1000,
      orderBy: 'port'
    },
    { enabled: !!destSystemId && isOpen }
  );

  // Helper to map systems to dropdown options
  const mapSystemsToOptions = (data: V_systems_completeRowSchema[] | undefined, currentId: string | null | undefined, currentNameObj: { system_name: string } | null | undefined) => {
    const rows = data || [];
    
    const options = rows.map((s) => {
      const labels: string[] = [];
      if (s.system_name) labels.push(s.system_name);
      if (s.ip_address) labels.push(`(${formatIP(s.ip_address)})`);
      return { value: s.id!, label: labels.join(' ') || 'Unnamed System' };
    });

    // INJECT CURRENT IF MISSING (Fixes "No options found" if system isn't in filtered list for some reason)
    if (currentId && !options.find((o) => o.value === currentId)) {
        options.push({
            value: currentId,
            label: currentNameObj?.system_name || "Unknown System (Selected)"
        });
    }

    return options;
  };

  const sourceSystemOptions = useMemo(
    () => mapSystemsToOptions(sourceSystemsResult?.data, path?.source_system_id, path?.source_system),
    [sourceSystemsResult?.data, path?.source_system_id, path?.source_system],
  );
  
  const destSystemOptions = useMemo(
    () => mapSystemsToOptions(destSystemsResult?.data, path?.destination_system_id, path?.destination_system), 
    [destSystemsResult?.data, path?.destination_system_id, path?.destination_system]
  );
  
  // Helper for ports
  const mapPortsToOptions = (data: V_ports_management_completeRowSchema[] | undefined, currentPort: string | null | undefined) => {
     const rows = data || [];
     const options = rows.map((p) => ({ value: p.port!, label: p.port! }));
     
     // Inject current if missing
     if (currentPort && !options.find(o => o.value === currentPort)) {
         options.push({ value: currentPort, label: currentPort });
     }
     return options;
  }

  const sourcePortOptions = useMemo(
    () => mapPortsToOptions(sourcePortsResult?.data, path?.source_port),
    [sourcePortsResult?.data, path?.source_port],
  );
  
  const destPortOptions = useMemo(
    () => mapPortsToOptions(destPortsResult?.data, path?.destination_port),
    [destPortsResult?.data, path?.destination_port],
  );

  // -- Get Selected Objects for Naming (Client-side) --
  const selectedSourceSystem = useMemo(() => {
    const option = sourceSystemOptions.find(o => o.value === sourceSystemId);
    if (!option) return null;
    
    // Try to find raw object from API data first
    const raw = sourceSystemsResult?.data.find(s => s.id === sourceSystemId);
    if (raw) return raw;

    // Fallback if injected
    return { system_name: option.label, ip_address: null };

  }, [sourceSystemId, sourceSystemOptions, sourceSystemsResult?.data]);

  const selectedDestSystem = useMemo(() => {
    const option = destSystemOptions.find(o => o.value === destSystemId);
    if (!option) return null;
    
    const raw = destSystemsResult?.data.find(s => s.id === destSystemId);
    if (raw) return raw;

    return { system_name: option.label, ip_address: null };
  }, [destSystemId, destSystemOptions, destSystemsResult?.data]);

  const selectedLinkType = useMemo(() => {
    if (!linkTypeId) return null;
    return linkTypeOptions.find((opt) => opt.value === linkTypeId);
  }, [linkTypeId, linkTypeOptions]);


  // --- Auto-Generate Name Effect ---
  useEffect(() => {
    if (!isOpen) return;
    if (isNameManuallyEdited) return; 

    const parts: string[] = [];

    // 1. Ring Prefix
    if (ringNamePrefix) {
      parts.push(ringNamePrefix);
    }

    // 2. Link Type
    const linkTypePart = selectedLinkType ? selectedLinkType.label : null;
    
    // 3. System Parts
    const systemParts: string[] = [];

    if (selectedSourceSystem && sourcePort) {
      const ip = selectedSourceSystem.ip_address ? formatIP(selectedSourceSystem.ip_address) : '';
      const ipStr = ip ? `:${ip}` : '';
      // Cleanup: remove existing IP from name if label already has it
      const name = selectedSourceSystem.system_name ? selectedSourceSystem.system_name.split('(')[0].trim() : 'System'; 
      systemParts.push(`${name}${ipStr}:${sourcePort}`);
    }

    if (selectedDestSystem && destPort) {
      const ip = selectedDestSystem.ip_address ? formatIP(selectedDestSystem.ip_address) : '';
      const ipStr = ip ? `:${ip}` : '';
      const name = selectedDestSystem.system_name ? selectedDestSystem.system_name.split('(')[0].trim() : 'System';
      systemParts.push(`${name}${ipStr}:${destPort}`);
    }

    // Construct final name
    let finalName = '';

    if (parts.length > 0) {
      finalName = parts[0];
      if (linkTypePart) finalName += `:${linkTypePart}`;
      if (systemParts.length > 0) finalName += `: ${systemParts.join(' → ')}`;
    } else if (systemParts.length > 0) {
      finalName = systemParts.join(' → ');
    }

    // Update if valid and not just the prefix
    if (finalName && finalName !== ringNamePrefix) {
      setPathName(finalName);
    }
  }, [
    isOpen,
    isNameManuallyEdited,
    ringNamePrefix,
    selectedLinkType,
    selectedSourceSystem,
    sourcePort,
    selectedDestSystem,
    destPort,
  ]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPathName(e.target.value);
    setIsNameManuallyEdited(true);
  };

  const handleResetName = () => {
    setIsNameManuallyEdited(false);
  };

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
    isLoadingService ||
    updatePathMutation.isPending;

  if (!path) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Configure Path Endpoints'
      isEditMode={true}
      isLoading={isLoading}
      form={mockForm}
      onSubmit={handleSave}
      size='lg'>
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
            <div className="flex justify-between items-center mb-1">
                <Label htmlFor='path_name' required>
                Path / Service Name
                </Label>
                {/* Auto-Generate Button */}
                <Button 
                    size="xs" 
                    variant="ghost" 
                    onClick={handleResetName}
                    title="Re-generate name from selections"
                    className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                    <RotateCw size={12} className="mr-1" /> Auto-Name
                </Button>
            </div>
            <Input
              id='path_name'
              value={pathName}
              onChange={handleNameChange}
              placeholder='e.g. RingName:LinkType: System A → System B'
              className='mt-1 bg-white dark:bg-gray-800'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Format: Ring:LinkType: System:IP:Port → System:IP:Port
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
              isLoading={loadingSrcSys}
            />
            <SearchableSelect
              label='Interface / Port'
              options={sourcePortOptions}
              value={sourcePort}
              onChange={setSourcePort}
              placeholder='Select Port...'
              disabled={!sourceSystemId}
              isLoading={loadingSrcPort}
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
              isLoading={loadingDstSys}
            />
            <SearchableSelect
              label='Interface / Port'
              options={destPortOptions}
              value={destPort}
              onChange={setDestPort}
              placeholder='Select Port...'
              disabled={!destSystemId}
              isLoading={loadingDstPort}
            />
          </div>
        </div>
      </div>
    </BaseFormModal>
  );
};
