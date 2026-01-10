// app/dashboard/ring-manager/page.tsx
'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaRoute } from 'react-icons/fa';
import {
  FiUpload,
  FiEdit,
  FiDownload,
  FiRefreshCw,
  FiTrash2,
  FiArrowRightCircle,
  FiGitMerge,
  FiPlus,
} from 'react-icons/fi';
import { PageHeader, ActionButton } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Button, PageSpinner } from '@/components/common/ui';
import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';

import {
  useTableInsert,
  useTableUpdate,
  RpcFunctionArgs,
  useRpcMutation,
  useTableQuery,
  PagedQueryResult,
  Filters,
} from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  RingsInsertSchema,
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
  V_ringsRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { ringConfig, RingEntity } from '@/config/ring-config';
import { useUser } from '@/providers/UserProvider';
import { UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { EntityConfig } from '@/components/common/entity-management/types';
import { useRingExcelUpload } from '@/hooks/database/excel-queries/useRingExcelUpload';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { useRingManagerData, DynamicStats } from '@/hooks/data/useRingManagerData';
import { UserRole } from '@/types/user-roles';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';

const RingModal = dynamic(
  () => import('@/components/rings/RingModal').then((mod) => mod.RingModal),
  { loading: () => <PageSpinner text="Loading Ring Form..." /> }
);

const SystemRingModal = dynamic(
  () => import('@/components/ring-manager/SystemRingModal').then((mod) => mod.SystemRingModal),
  { loading: () => <PageSpinner text="Loading System-Ring Form..." /> }
);

const EditSystemInRingModal = dynamic(
  () =>
    import('@/components/ring-manager/EditSystemInRingModal').then(
      (mod) => mod.EditSystemInRingModal
    ),
  { loading: () => <PageSpinner text="Loading Edit System Form..." /> }
);

// --- Types ---
interface SystemToDisassociate {
  ringId: string;
  systemId: string;
  systemName: string;
  ringName: string;
}

// --- Helper Hooks ---

const useRingSystems = (ringId: string | null) => {
  const supabase = createClient();
  return useTableQuery(supabase, 'ring_based_systems', {
    // THE FIX: Removed the problematic nested join. We fetch system_type_id and resolve it client-side.
    columns: `
      order_in_ring,
      ring_id,
      system:systems!ring_based_systems_system_id_fkey (
        id,
        system_name,
        system_type_id,
        node_id,
        is_hub,
        status,
        ip_address,
        s_no,
        make,
        maan_node_id,
        maintenance_terminal_id,
        commissioned_on,
        remark,
        system_capacity_id
      )
    `
      .replace(/\s+/g, '')
      .trim(),

    filters: { ring_id: ringId || '' },
    enabled: !!ringId,
    orderBy: [{ column: 'order_in_ring', ascending: true }],

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (result: PagedQueryResult<any>) => {
      const flattened = result.data
        .map((item) => {
          const sys = item.system || item.systems;
          if (!sys) return null;

          const mappedItem = {
            id: sys.id,
            system_name: sys.system_name,
            system_type_id: sys.system_type_id,
            node_id: sys.node_id,
            is_hub: !!sys.is_hub,
            order_in_ring: typeof item.order_in_ring === 'number' ? item.order_in_ring : null,
            ring_id: item.ring_id,
            status: !!sys.status,
            system_type_name: '', // Will be populated in the UI component
            ip_address:
              typeof sys.ip_address === 'string' ? sys.ip_address.split('/')[0] : sys.ip_address,
            s_no: sys.s_no,
            make: sys.make,
            maan_node_id: sys.maan_node_id,
            maintenance_terminal_id: sys.maintenance_terminal_id,
            commissioned_on: sys.commissioned_on,
            remark: sys.remark,
            system_capacity_id: sys.system_capacity_id,
            // Defaults to satisfy strict typing
            created_at: null,
            updated_at: null,
            system_category: null,
            system_type_code: null,
            node_name: null,
            node_type_name: null,
            ring_associations: null,
            ring_logical_area_name: null,
            system_capacity_name: null,
            system_maintenance_terminal_name: null,
            is_ring_based: true,
            latitude: null,
            longitude: null,
          };

          return mappedItem as unknown as V_systems_completeRowSchema;
        })
        .filter((item): item is V_systems_completeRowSchema => item !== null);

      return {
        data: flattened,
        count: result.count,
      };
    },
  });
};

const RingAssociatedSystemsView = ({
  ringId,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  ringId: string;
  onEdit: (sys: V_systems_completeRowSchema) => void;
  onDelete: (sys: V_systems_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}) => {
  const { data: systemsData, isLoading } = useRingSystems(ringId);
  // THE FIX: Fetch System Types client-side to resolve names reliability
  const { options: systemTypes, isLoading: isLoadingTypes } = useLookupTypeOptions(
    'SYSTEM_TYPES',
    'asc',
    '',
    'code'
  );

  const systems = systemsData?.data || [];

  if (isLoading || isLoadingTypes)
    return (
      <div className="py-4 text-center text-sm text-gray-500">Loading associated systems...</div>
    );

  if (systems.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic py-2 border-t border-gray-100 dark:border-gray-700">
        No systems associated with this ring yet.
      </div>
    );
  }

  const hubMap = new Map<number, string>();
  systems.forEach((s) => {
    if (s.is_hub && s.order_in_ring !== null) {
      hubMap.set(Math.floor(s.order_in_ring), s.system_name || 'Unknown Hub');
    }
  });

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
      {systems.map((system) => {
        const isSpur = !system.is_hub && system.order_in_ring !== null;
        const parentOrder = isSpur ? Math.floor(system.order_in_ring!) : null;
        const parentName = parentOrder !== null ? hubMap.get(parentOrder) : null;
        const system_ip = system.ip_address;

        // THE FIX: Resolve name from client-side list
        const typeName =
          systemTypes.find((t) => t.value === system.system_type_id)?.label || 'Unknown Type';

        return (
          <div
            key={system.id}
            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {system.system_name}
                </span>
                {system_ip && (
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    / {system_ip}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 border border-gray-200 dark:border-gray-600 px-1.5 rounded-full bg-white dark:bg-gray-800">
                  {typeName}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  #{system.order_in_ring ?? '?'}
                </span>
                {system.is_hub ? (
                  <span className="text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                    <FiArrowRightCircle className="w-3 h-3" /> Hub
                  </span>
                ) : (
                  <span className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                    <FiGitMerge className="w-3 h-3" /> Spur
                    {parentName && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1 lowercase tracking-normal">
                        via {parentName}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                  onClick={() => onEdit(system)}
                  title="Edit Order / Hub Status"
                >
                  <FiEdit className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                  onClick={() => onDelete(system)}
                  title="Remove System from Ring"
                >
                  <FiTrash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function RingManagerPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { isSuperAdmin, role } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals State
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [isEditSystemModalOpen, setIsEditSystemModalOpen] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState<V_systems_completeRowSchema | null>(null);
  const [systemToDisassociate, setSystemToDisassociate] = useState<SystemToDisassociate | null>(
    null
  );

  // --- PERMISSIONS ---
  const canEdit = !!(isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO);
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const manager = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingManagerData,
    displayNameField: 'name',
    syncTables: ['rings', 'v_rings', 'ring_based_systems', 'systems', 'v_systems_complete'],
  });

  const {
    data: rings,
    isLoading,
    isMutating: isCrudMutating,
    isFetching,
    error,
    refetch,
    queryResult,
    search,
    filters,
    editModal,
    deleteModal,
    viewModal,
    actions: crudActions,
  } = manager;

  const dynamicStats = useMemo<DynamicStats>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (manager as any).stats;
    return (
      s || {
        total: 0,
        totalNodes: 0,
        spec: { issued: 0, pending: 0 },
        ofc: { ready: 0, partial: 0, pending: 0 },
        bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 },
      }
    );
  }, [manager]);

  const { mutate: insertRing, isPending: isInserting } = useTableInsert(supabase, 'rings');
  const { mutate: updateRing, isPending: isUpdating } = useTableUpdate(supabase, 'rings');
  const { mutate: uploadRings, isPending: isUploading } = useRingExcelUpload(supabase);
  const { mutate: exportRings, isPending: isExporting } = useRPCExcelDownload(supabase);

  const isMutating = isCrudMutating || isInserting || isUpdating;

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
      queryClient.invalidateQueries({ queryKey: ['ring-nodes-detail'] });
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ring_nodes'] });
      queryClient.invalidateQueries({ queryKey: ['ring-systems-data'] });
    },
    onError: (err) => toast.error(`Failed to save a system: ${err.message}`),
  });

  const disassociateSystemMutation = useRpcMutation(supabase, 'disassociate_system_from_ring', {
    onSuccess: () => {
      toast.success('System disassociated from ring.');
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
      queryClient.invalidateQueries({ queryKey: ['ring-nodes-detail'] });
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ring_nodes'] });
      queryClient.invalidateQueries({ queryKey: ['ring-systems-data'] });
      setSystemToDisassociate(null);
    },
    onError: (err) => toast.error(`Failed to disassociate system: ${err.message}`),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveSystems = async (systemsData: any[]) => {
    toast.info(`Saving ${systemsData.length} system associations...`);
    const promises = systemsData.map((systemData) => {
      const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
        p_id: systemData.id ?? undefined,
        p_system_name: systemData.system_name!,
        p_system_type_id: systemData.system_type_id!,
        p_node_id: systemData.node_id!,
        p_status: systemData.status ?? true,
        p_is_hub: systemData.is_hub ?? false,
        p_ring_associations: systemData.ring_id
          ? [
              {
                ring_id: systemData.ring_id,
                order_in_ring:
                  systemData.order_in_ring != null ? Number(systemData.order_in_ring) : null,
              },
            ]
          : null,
        p_ip_address: systemData.ip_address ? systemData.ip_address.split('/')[0] : undefined,
        p_s_no: systemData.s_no ?? undefined,
        p_make: systemData.make ?? undefined,
        p_maan_node_id: systemData.maan_node_id ?? undefined,
        p_maintenance_terminal_id: systemData.maintenance_terminal_id ?? undefined,
        p_commissioned_on: systemData.commissioned_on ?? undefined,
        p_remark: systemData.remark ?? undefined,
        p_system_capacity_id: systemData.system_capacity_id ?? undefined,
      };
      return upsertSystemMutation.mutateAsync(payload);
    });
    try {
      await Promise.all(promises);
      toast.success('All system associations saved successfully!');
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['ring-nodes-detail'] });
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ring_nodes'] });
    } catch {
      toast.error('One or more system associations failed to save.');
    }
  };

  const handleUpdateSystemInRing = (formData: {
    order_in_ring: number | null;
    is_hub: boolean | null;
  }) => {
    if (!systemToEdit) return;

    if (!systemToEdit.ring_id) {
      toast.error('Cannot update: System is not correctly associated with a ring context.');
      return;
    }

    const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
      p_id: systemToEdit.id!,
      p_system_name: systemToEdit.system_name!,
      p_system_type_id: systemToEdit.system_type_id!,
      p_node_id: systemToEdit.node_id!,
      p_status: systemToEdit.status!,
      p_is_hub: formData.is_hub ?? systemToEdit.is_hub ?? false,
      p_ring_associations: [
        {
          ring_id: systemToEdit.ring_id,
          order_in_ring:
            formData.order_in_ring != null
              ? Number(formData.order_in_ring)
              : systemToEdit.order_in_ring ?? null,
        },
      ],
      p_ip_address: systemToEdit.ip_address ? systemToEdit.ip_address.split('/')[0] : undefined,
      p_s_no: systemToEdit.s_no ?? undefined,
      p_make: systemToEdit.make ?? undefined,
      p_maan_node_id: systemToEdit.maan_node_id ?? undefined,
      p_maintenance_terminal_id: systemToEdit.maintenance_terminal_id ?? undefined,
      p_commissioned_on: systemToEdit.commissioned_on ?? undefined,
      p_remark: systemToEdit.remark ?? undefined,
      p_system_capacity_id: systemToEdit.system_capacity_id ?? undefined,
    };

    upsertSystemMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Updated "${systemToEdit.system_name}" in ring.`);
        setIsEditSystemModalOpen(false);
        setSystemToEdit(null);
        void refetch();
      },
    });
  };

  const { originalData: ringTypesRaw, isLoading: isLoadingRingTypes } =
    useLookupTypeOptions('RING_TYPES');

  const { originalData: maintenanceAreasRaw, isLoading: isLoadingAreas } =
    useMaintenanceAreaOptions();

  const ringTypesData = useMemo(
    () => (ringTypesRaw || []) as Lookup_typesRowSchema[],
    [ringTypesRaw]
  );
  const maintenanceAreasData = useMemo(
    () => (maintenanceAreasRaw || []) as Maintenance_areasRowSchema[],
    [maintenanceAreasRaw]
  );
  const isLoadingDropdowns = isLoadingRingTypes || isLoadingAreas;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const handleMutationSuccess = (data: any) => {
    toast.success(`Ring ${editModal.record ? 'updated' : 'created'} successfully.`);
    editModal.close();
    refetch();

    if (editModal.record?.id) {
      queryClient.invalidateQueries({ queryKey: ['rpc-record', 'v_rings', editModal.record.id] });
    }
  };

  const handleSave = (data: RingsInsertSchema) => {
    if (editModal.record?.id) {
      updateRing({ id: editModal.record.id, data }, { onSuccess: handleMutationSuccess });
    } else {
      insertRing(data, { onSuccess: handleMutationSuccess });
    }
  };

  const handleViewDetails = useCallback(
    (record: V_ringsRowSchema) => {
      if (record.id) router.push(`/dashboard/rings/${record.id}`);
    },
    [router]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadRings({ file });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportClick = useCallback(() => {
    exportRings({
      fileName: `${formatDate(new Date(), {
        format: 'dd-mm-yyyy',
      })}-rings-export.xlsx`,
      sheetName: 'Rings',
      rpcConfig: {
        functionName: 'get_rings_for_export',
      },
      columns: [
        { key: 'id', title: 'id', dataIndex: 'id' },
        { key: 'name', title: 'name', dataIndex: 'name' },
        { key: 'description', title: 'description', dataIndex: 'description' },
        { key: 'ring_type_name', title: 'ring_type_name', dataIndex: 'ring_type_name' },
        {
          key: 'maintenance_area_name',
          title: 'maintenance_area_name',
          dataIndex: 'maintenance_area_name',
        },
        { key: 'status', title: 'status', dataIndex: 'status' },
        { key: 'ofc_status', title: 'ofc_status', dataIndex: 'ofc_status' },
        { key: 'spec_status', title: 'spec_status', dataIndex: 'spec_status' },
        { key: 'bts_status', title: 'bts_status', dataIndex: 'bts_status' },
        { key: 'total_nodes', title: 'total_nodes', dataIndex: 'total_nodes' },
        {
          key: 'topology_config',
          title: 'topology_config',
          dataIndex: 'topology_config',
          excelFormat: 'json',
        },
        {
          key: 'associated_systems',
          title: 'associated_systems',
          dataIndex: 'associated_systems',
          excelFormat: 'json',
        },
      ],
    });
  }, [exportRings]);

  const headerActions = useMemo(() => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: () => {
          refetch();
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />,
        disabled: isLoading,
      },
      {
        label: isExporting ? 'Exporting...' : 'Export Rings',
        onClick: handleExportClick,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || isLoading,
        hideTextOnMobile: true,
      },
    ];

    if (canEdit) {
      actions.splice(1, 0, {
        label: isUploading ? 'Uploading...' : 'Upload Rings',
        onClick: handleUploadClick,
        variant: 'outline',
        leftIcon: <FiUpload />,
        disabled: isUploading || isLoading,
        hideTextOnMobile: true,
      });

      actions.push({
        label: 'Add New Ring',
        onClick: editModal.openAdd,
        variant: 'primary',
        leftIcon: <GiLinkedRings />,
        disabled: isLoading,
      });

      actions.push({
        label: 'Add Systems to Ring',
        onClick: () => setIsSystemsModalOpen(true),
        variant: 'primary',
        leftIcon: <FiPlus />,
        disabled: isLoading,
      });
    }

    return actions;
  }, [
    isLoading,
    isUploading,
    isExporting,
    refetch,
    handleUploadClick,
    handleExportClick,
    editModal.openAdd,
    canEdit,
  ]);

  const headerStats = useMemo(() => {
    return [
      { value: `${dynamicStats.total} / ${dynamicStats.totalNodes}`, label: 'Total Rings / Nodes' },
      {
        value: `${dynamicStats.bts.nodesOnAir} / ${dynamicStats.bts.configuredCount}`,
        label: 'Nodes On-Air / Rings Configured',
        color: 'success' as const,
      },
      {
        value: `${dynamicStats.spec.issued} / ${dynamicStats.spec.pending}`,
        label: 'SPEC (Issued/Pend)',
        color: 'primary' as const,
      },
      {
        value: `${dynamicStats.ofc.ready} / ${dynamicStats.ofc.partial} / ${dynamicStats.ofc.pending}`,
        label: 'OFC (Ready/Partial/Pend)',
        color: 'warning' as const,
      },
    ];
  }, [dynamicStats]);

  const dynamicFilterConfig: EntityConfig<RingEntity> = useMemo(
    () => ({
      ...ringConfig,
      detailFields: [
        ...ringConfig.detailFields.filter((f) => f.key !== 'description'),
        { key: 'ofc_status', label: 'OFC Status', type: 'text' },
        { key: 'spec_status', label: 'SPEC Status', type: 'text' },
        { key: 'bts_status', label: 'Working Status', type: 'text' },
        { key: 'description', label: 'Description', type: 'html' },
        {
          key: 'id',
          label: 'Path Management',
          type: 'custom',
          render: (_value, entity) => (
            <Button
              size="sm"
              variant="primary"
              className="w-full mb-4"
              leftIcon={<FaRoute />}
              onClick={() => router.push(`/dashboard/ring-paths/${entity.id}`)}
            >
              Manage Logical Paths
            </Button>
          ),
        },
        {
          key: 'id',
          label: 'Associated Systems',
          type: 'custom',
          render: (_value, entity) => (
            <RingAssociatedSystemsView
              ringId={entity.id}
              onEdit={(system) => {
                setSystemToEdit(system);
                setIsEditSystemModalOpen(true);
              }}
              onDelete={(system) =>
                setSystemToDisassociate({
                  ringId: entity.id,
                  systemId: system.id!,
                  ringName: entity.name,
                  systemName: system.system_name || 'this system',
                })
              }
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ),
        },
      ],
      filterOptions: [
        ...ringConfig.filterOptions,
        {
          key: 'ofc_status',
          label: 'OFC Status',
          type: 'select' as const,
          options: [
            { value: 'Ready', label: 'Ready' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Partial Ready', label: 'Partial Ready' },
          ],
        },
        {
          key: 'bts_status',
          label: 'Working Status',
          type: 'select' as const,
          options: [
            { value: 'On-Air', label: 'On-Air' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Configured', label: 'Configured' },
          ],
        },
      ].map((opt) => {
        if (opt.key === 'ring_type_id') {
          return {
            ...opt,
            options: (ringTypesData || [])
              .map((t) => {
                return { value: t.id, label: t.name };
              })
              .sort((a, b) => {
                if (a.value === '') return -1;
                if (b.value === '') return 1;
                return a.label.localeCompare(b.label);
              }),
          };
        }
        if (opt.key === 'maintenance_terminal_id') {
          return {
            ...opt,
            options: (maintenanceAreasData || []).map((m) => ({ value: m.id, label: m.name })),
          };
        }
        return opt;
      }),
    }),
    [ringTypesData, maintenanceAreasData, router, canEdit, canDelete]
  );

  // useEffect(() => {
  //   if (ringTypesData && ringTypesData.length > 0 && !filters.filters.ring_type_id) {
  //     const defaultType = ringTypesData.find(
  //       (t) => t.code === 'BBU_RINGS' || t.name === 'BBU_RINGS'
  //     );

  //     if (defaultType) {
  //       filters.setFilters((prev) => ({
  //         ...prev,
  //         ring_type_id: defaultType.id,
  //       }));
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [ringTypesData]);

  const uiFilters = useMemo<Record<string, string>>(() => {
    const src = (filters.filters || {}) as Record<string, unknown>;
    const out: Record<string, string> = {};
    Object.keys(src).forEach((k) => {
      const v: unknown = src[k as keyof typeof src];
      if (v === undefined || v === null) return;
      out[k] =
        typeof v === 'object' && 'value' in v ? String((v as { value: unknown }).value) : String(v);
    });
    return out;
  }, [filters.filters]);

  const handleConfirmDisassociation = useCallback(() => {
    if (!systemToDisassociate) return;
    disassociateSystemMutation.mutate({
      p_ring_id: systemToDisassociate.ringId,
      p_system_id: systemToDisassociate.systemId,
    });
  }, [systemToDisassociate, disassociateSystemMutation]);

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <PageHeader
        title="Ring Manager"
        description="Manage network rings, status, and topology."
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />
      <div className="grow mt-6">
        <EntityManagementComponent
          config={dynamicFilterConfig}
          entitiesQuery={queryResult as UseQueryResult<PagedQueryResult<RingEntity>, Error>}
          toggleStatusMutation={{ mutate: crudActions.handleToggleStatus, isPending: isMutating }}
          onEdit={
            canEdit
              ? (e) => {
                  const orig = rings.find((r) => r.id === e.id);
                  if (orig) editModal.openEdit(orig);
                }
              : undefined
          }
          onDelete={canDelete ? crudActions.handleDelete : undefined}
          onCreateNew={canEdit ? editModal.openAdd : undefined}
          selectedEntityId={viewModal.record?.id ?? null}
          onSelect={(id) => {
            if (!id) {
              viewModal.close();
              return;
            }
            const rec = rings.find((r) => r.id === id);
            if (rec) viewModal.open(rec);
          }}
          onViewDetails={() => handleViewDetails(viewModal.record!)}
          searchTerm={search.searchQuery}
          onSearchChange={search.setSearchQuery}
          filters={uiFilters}
          onFilterChange={(f) => filters.setFilters(f as Filters)}
          onClearFilters={() => filters.setFilters({})}
          isFetching={isFetching}
        />
      </div>

      <RingModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onSubmit={handleSave}
        editingRing={editModal.record}
        ringTypes={ringTypesData}
        maintenanceAreas={maintenanceAreasData}
        isLoading={isMutating}
        isLoadingDropdowns={isLoadingDropdowns}
      />

      <SystemRingModal
        isOpen={isSystemsModalOpen}
        onClose={() => setIsSystemsModalOpen(false)}
        onSubmit={handleSaveSystems}
        isLoading={isMutating || upsertSystemMutation.isPending}
      />

      <EditSystemInRingModal
        isOpen={isEditSystemModalOpen}
        onClose={() => setIsEditSystemModalOpen(false)}
        system={systemToEdit}
        onSubmit={handleUpdateSystemInRing}
        isLoading={upsertSystemMutation.isPending}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />

      <ConfirmModal
        isOpen={!!systemToDisassociate}
        onConfirm={handleConfirmDisassociation}
        onCancel={() => setSystemToDisassociate(null)}
        title="Confirm Disassociation"
        message={`Are you sure you want to remove the system "${systemToDisassociate?.systemName}" from the ring "${systemToDisassociate?.ringName}"?`}
        loading={disassociateSystemMutation.isPending}
        type="danger"
      />
    </div>
  );
}
