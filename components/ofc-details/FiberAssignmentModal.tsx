// path: components/ofc-details/FiberAssignmentModal.tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/ui/Modal';
import { FormCard, FormSearchableSelect } from '@/components/common/form';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { useAssignFiberToConnection } from '@/hooks/database/fiber-assignment-hooks';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, GitMerge, Radio, Filter, X } from 'lucide-react';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useRpcRecord } from '@/hooks/database';
import { buildRpcFilters } from '@/hooks/database/utility-functions';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions'; // IMPORTED

interface FiberAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiber: V_ofc_connections_completeRowSchema | null;
}

const formSchema = z.object({
  connection_id: z.string().min(1, 'Service selection is required'),
  role: z.enum(['working', 'protection']),
  direction: z.enum(['tx', 'rx']),
});

type FormValues = z.infer<typeof formSchema>;

// Define a lightweight type specifically for the dropdown
type ConnectionOptionData = {
  id: string | null;
  service_name: string | null;
  system_name: string | null;
  connected_system_name: string | null;
  status: boolean | null;
  connected_link_type_name: string | null;
  connected_link_type_id: string | null; // Needed for filtering
  media_type_id: string | null; // Needed for filtering
  bandwidth_allocated: string | null;
  vlan: string | null;
  sn_name: string | null;
  sn_interface: string | null;
};

export const FiberAssignmentModal: React.FC<FiberAssignmentModalProps> = ({
  isOpen,
  onClose,
  fiber,
}) => {
  const supabase = createClient();
  const { mutate: assignFiber, isPending } = useAssignFiberToConnection();

  // Local Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterLinkType, setFilterLinkType] = useState<string>('');
  const [filterMediaType, setFilterMediaType] = useState<string>('');

  const { options: linkTypeOptions } = useLookupTypeOptions('LINK_TYPES');
  const { options: mediaTypeOptions } = useLookupTypeOptions('MEDIA_TYPES');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'working',
      direction: 'tx',
      connection_id: '',
    },
  });

  // 1. If editing an existing link, fetch the parent Connection ID via the Logical Path
  const { data: logicalPathData } = useRpcRecord(
    supabase,
    'logical_fiber_paths',
    fiber?.logical_path_id || null,
    {
      enabled: isOpen && !!fiber?.logical_path_id,
    }
  );

  // 2. Pre-fill form when data is available
  useEffect(() => {
    if (isOpen && fiber) {
      const currentRole = (fiber.fiber_role as 'working' | 'protection') || 'working';
      const currentDirection = (fiber.path_direction as 'tx' | 'rx') || 'tx';

      // Use the connection ID from the fetched logical path if available
      const currentConnectionId = logicalPathData?.system_connection_id || '';

      reset({
        role: currentRole,
        direction: currentDirection,
        connection_id: currentConnectionId,
      });
    }
  }, [isOpen, fiber, logicalPathData, reset]);

  // 3. Fetch Options using offline-first strategy
  const { data: connectionsData, isLoading: isLoadingConnections } = useOfflineQuery<
    ConnectionOptionData[]
  >(
    ['active-system-connections-list'],
    // Online Fetcher: Use RPC for security and robustness
    async () => {
      // Build filters using the helper (ensure only active connections)
      const rpcFilters = buildRpcFilters({ status: true });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_system_connections_complete',
        p_limit: 3000,
        p_offset: 0,
        p_order_by: 'service_name',
        p_order_dir: 'asc',
        p_filters: rpcFilters,
      });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    },
    // Offline Fetcher: Maps full local objects to the lighter interface
    async () => {
      const all = await localDb.v_system_connections_complete
        .filter((c) => c.status === true)
        .toArray();

      return all as unknown as ConnectionOptionData[];
    }
  );

  const connectionOptions = useMemo(() => {
    let filtered = connectionsData || [];

    // Filter by Link Type if selected
    if (filterLinkType) {
      filtered = filtered.filter((c) => c.connected_link_type_id === filterLinkType);
    }

    // Filter by Media Type if selected
    if (filterMediaType) {
      filtered = filtered.filter((c) => c.media_type_id === filterMediaType);
    }

    return (
      filtered
        // Relax filter to allow connections without a service_name (pure infrastructure links)
        .filter((conn) => conn.service_name || conn.system_name || conn.connected_system_name)
        .map((conn) => {
          // Construct a descriptive label
          const name =
            conn.service_name ||
            conn.connected_system_name ||
            conn.system_name ||
            'Unknown Connection';
          const details = [
            conn.connected_link_type_name,
            conn.sn_name ? `Start: ${conn.sn_name}` : null,
            conn.sn_interface ? `Port: ${conn.sn_interface}` : null,
            conn.bandwidth_allocated,
            conn.vlan ? `VLAN: ${conn.vlan}` : null,
          ]
            .filter(Boolean)
            .join(' | ');

          return {
            value: conn.id!,
            label: `${name} ${details ? `(${details})` : ''}`,
          };
        })
    );
  }, [connectionsData, filterLinkType, filterMediaType]);

  const onSubmit = (data: FormValues) => {
    if (!fiber?.id) return;

    assignFiber(
      {
        fiber_id: fiber.id,
        connection_id: data.connection_id,
        role: data.role,
        direction: data.direction,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const clearFilters = () => {
    setFilterLinkType('');
    setFilterMediaType('');
  };

  if (!fiber) return null;
  const isEditMode = !!fiber.logical_path_id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Fiber #${fiber.fiber_no_sn}`}
      size="full"
    >
      <FormCard
        title={isEditMode ? 'Edit Link' : 'Link to Service'}
        subtitle={
          isEditMode
            ? 'Update existing assignment'
            : `Assign Fiber ${fiber.fiber_no_sn} to a System Connection`
        }
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending}
        submitText={isEditMode ? 'Update Link' : 'Link Fiber'}
        standalone={false} // Embedded in Modal
      >
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Filter Services'}
                {(filterLinkType || filterMediaType) && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">
                    Active
                  </span>
                )}
              </button>

              {(filterLinkType || filterMediaType) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500"
                >
                  <X className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link Type</label>
                  <select
                    value={filterLinkType}
                    onChange={(e) => setFilterLinkType(e.target.value)}
                    className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {linkTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Media Type</label>
                  <select
                    value={filterMediaType}
                    onChange={(e) => setFilterMediaType(e.target.value)}
                    className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Media</option>
                    {mediaTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Connection Selection */}
          <FormSearchableSelect
            name="connection_id"
            label="Select Service / Circuit"
            control={control}
            options={connectionOptions}
            placeholder={
              isLoadingConnections ? 'Loading services...' : 'Search by Service Name or System...'
            }
            error={errors.connection_id}
            isLoading={isLoadingConnections}
            className="z-50"
            clearable
          />

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                Path Role
              </label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('working')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-all ${
                        field.value === 'working'
                          ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <GitMerge className="w-4 h-4" /> Working
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('protection')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-all ${
                        field.value === 'protection'
                          ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Radio className="w-4 h-4" /> Protection
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Direction Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                Direction
              </label>
              <Controller
                name="direction"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('tx')}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                        field.value === 'tx'
                          ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>Tx (Transmit)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('rx')}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                        field.value === 'rx'
                          ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>Rx (Receive)</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};
