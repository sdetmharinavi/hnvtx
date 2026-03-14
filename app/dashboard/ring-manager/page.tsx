// path: app/dashboard/ring-manager/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaRoute } from 'react-icons/fa';
import { FiMap, FiGrid, FiRefreshCw, FiArrowRightCircle, FiGitMerge } from 'react-icons/fi';
import { PageHeader, ActionButton } from '@/components/common/page-header';
import { ErrorDisplay, Button, PageSpinner } from '@/components/common/ui';
import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';

import { useTableQuery, PagedQueryResult, Filters } from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
  V_ringsRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { ringConfig, RingEntity } from '@/config/ring-config';
import { UseQueryResult } from '@tanstack/react-query';
import { EntityConfig } from '@/components/common/entity-management/types';
import { useRingManagerData, DynamicStats } from '@/hooks/data/useRingManagerData';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useQuery } from '@tanstack/react-query';
import { RingMapNode, SegmentConfigMap } from '@/components/map/ClientRingMap/types';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { buildRpcFilters, useRpcRecord } from '@/hooks/database';
import MeshDiagram from '@/components/map/MeshDiagram/MeshDiagram';

const ClientRingMap = dynamic(() => import('@/components/map/ClientRingMap/ClientRingMap'), {
  ssr: false,
  loading: () => <PageSpinner text='Loading Map...' />,
});

type ExtendedRingDetails = V_ringsRowSchema & {
  topology_config?: {
    disabled_segments?: string[];
  } | null;
};

const COLOR_PALETTE = [
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#9333ea',
  '#0891b2',
  '#db2777',
  '#4f46e5',
  '#ca8a04',
  '#059669',
];

const mapNodeData = (node: Record<string, unknown>): RingMapNode | null => {
  if (node.id == null || node.name == null) return null;
  return {
    ...node,
  } as RingMapNode;
};

const useRingSystems = (ringId: string | null) => {
  const supabase = createClient();
  return useTableQuery(supabase, 'ring_based_systems', {
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
    select: (result: PagedQueryResult<Record<string, unknown>>) => {
      const flattened = result.data
        .map((item) => {
          const sys = (item.system || item.systems) as Record<string, unknown> | undefined;
          if (!sys) return null;
          return {
            id: sys.id,
            system_name: sys.system_name,
            is_hub: !!sys.is_hub,
            order_in_ring: typeof item.order_in_ring === 'number' ? item.order_in_ring : null,
            ip_address:
              typeof sys.ip_address === 'string' ? sys.ip_address.split('/')[0] : sys.ip_address,
          } as V_systems_completeRowSchema;
        })
        .filter((item): item is V_systems_completeRowSchema => item !== null);
      return { data: flattened, count: result.count };
    },
  });
};

const RingAssociatedSystemsView = ({ ringId }: { ringId: string }) => {
  const { data: systemsData, isLoading } = useRingSystems(ringId);
  const systems = systemsData?.data || [];

  if (isLoading)
    return <div className='py-4 text-center text-sm text-gray-500'>Loading systems...</div>;
  if (systems.length === 0)
    return (
      <div className='text-sm text-gray-500 italic py-2'>
        No systems associated with this ring yet.
      </div>
    );

  const hubMap = new Map<number, string>();
  systems.forEach((s) => {
    if (s.is_hub && s.order_in_ring !== null) {
      hubMap.set(Math.floor(s.order_in_ring), s.system_name || 'Unknown Hub');
    }
  });

  return (
    <div className='space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2'>
      {systems.map((system) => {
        const isSpur = !system.is_hub && system.order_in_ring !== null;
        const parentOrder = isSpur ? Math.floor(system.order_in_ring!) : null;
        const parentName = parentOrder !== null ? hubMap.get(parentOrder) : null;

        return (
          <div
            key={system.id}
            className='flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600'
          >
            <div>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                  {system.system_name}
                </span>
                {system.ip_address && (
                  <span className='font-mono text-xs text-gray-500 dark:text-gray-400'>
                    / {system.ip_address}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1.5'>
                <span className='font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold'>
                  #{system.order_in_ring ?? '?'}
                </span>
                {system.is_hub ? (
                  <span className='text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide'>
                    <FiArrowRightCircle className='w-3 h-3' /> Hub
                  </span>
                ) : (
                  <span className='text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide'>
                    <FiGitMerge className='w-3 h-3' /> Spur{' '}
                    {parentName && (
                      <span className='text-gray-500 dark:text-gray-400 ml-1 lowercase tracking-normal'>
                        via {parentName}
                      </span>
                    )}
                  </span>
                )}
              </div>
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
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'map' | 'schematic'>('map');

  const manager = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingManagerData,
    displayNameField: 'name',
    syncTables: [
      'rings',
      'v_rings',
      'ring_based_systems',
      'systems',
      'v_systems_complete',
      'v_ofc_connections_complete',
      'logical_fiber_paths',
    ],
  });

  const {
    data: rings,
    isLoading,
    isFetching,
    error,
    refetch,
    queryResult,
    search,
    filters,
    viewModal,
  } = manager;

  const dynamicStats = useMemo<DynamicStats>(() => {
    return (
      (manager as unknown as { stats: DynamicStats }).stats || {
        total: 0,
        totalNodes: 0,
        spec: { issued: 0, pending: 0 },
        ofc: { ready: 0, partial: 0, pending: 0 },
        bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 },
      }
    );
  }, [manager]);

  const { originalData: ringTypesRaw } = useLookupTypeOptions('RING_TYPES');
  const { originalData: maintenanceAreasRaw } = useMaintenanceAreaOptions();

  const ringTypesData = useMemo(
    () => (ringTypesRaw || []) as Lookup_typesRowSchema[],
    [ringTypesRaw],
  );
  const maintenanceAreasData = useMemo(
    () => (maintenanceAreasRaw || []) as Maintenance_areasRowSchema[],
    [maintenanceAreasRaw],
  );

  const handleViewDetails = useCallback(
    (record: V_ringsRowSchema) => {
      if (record.id) router.push(`/dashboard/rings/${record.id}`);
    },
    [router],
  );

  const isBusy = isLoading || isFetching || isSyncingData;

  const headerActions = useMemo(
    (): ActionButton[] => [
      {
        label: 'Refresh',
        onClick: async () => {
          if (isOnline) await syncData(['rings', 'v_rings', 'ring_based_systems']);
          else refetch();
          toast.success('Rings refreshed!');
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy,
      },
    ],
    [isBusy, isOnline, refetch, syncData],
  );

  const headerStats = useMemo<StatProps[]>(() => {
    const currentSpecFilter = filters.filters.spec_status;
    const currentOfcFilter = filters.filters.ofc_status;
    const currentBtsFilter = filters.filters.bts_status;

    return [
      {
        value: `${dynamicStats.total} / ${dynamicStats.totalNodes}`,
        label: 'Total Rings / Nodes',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.ofc_status;
            delete next.spec_status;
            delete next.bts_status;
            return next;
          }),
        isActive: !currentSpecFilter && !currentOfcFilter && !currentBtsFilter,
      },
      {
        value: `${dynamicStats.bts.nodesOnAir} / ${dynamicStats.bts.configuredCount}`,
        label: 'Nodes On-Air / Configured',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, bts_status: 'On-Air' })),
        isActive: currentBtsFilter === 'On-Air',
      },
      {
        value: `${dynamicStats.ofc.ready} / ${dynamicStats.ofc.partial} / ${dynamicStats.ofc.pending}`,
        label: 'OFC (Ready/Partial/Pend)',
        color: 'warning',
        onClick: () => filters.setFilters((prev) => ({ ...prev, ofc_status: 'Ready' })),
        isActive: currentOfcFilter === 'Ready',
      },
    ];
  }, [dynamicStats, filters]);

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
              size='sm'
              variant='primary'
              className='w-full mb-4'
              leftIcon={<FaRoute />}
              onClick={() => router.push(`/dashboard/ring-paths/${entity.id}`)}
            >
              View Logical Paths
            </Button>
          ),
        },
        {
          key: 'id',
          label: 'Associated Systems',
          type: 'custom',
          render: (_value, entity) => <RingAssociatedSystemsView ringId={entity.id} />,
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
        if (opt.key === 'ring_type_id')
          return { ...opt, options: ringTypesData.map((t) => ({ value: t.id!, label: t.name! })) };
        if (opt.key === 'maintenance_terminal_id')
          return {
            ...opt,
            options: maintenanceAreasData.map((m) => ({ value: m.id!, label: m.name! })),
          };
        return opt;
      }),
    }),
    [ringTypesData, maintenanceAreasData, router],
  );

  const uiFilters = useMemo<Record<string, string>>(() => {
    const src = filters.filters || {};
    const out: Record<string, string> = {};
    Object.keys(src).forEach((k) => {
      const v = src[k];
      if (v === undefined || v === null) return;
      out[k] =
        typeof v === 'object' && v !== null && 'value' in v
          ? String((v as Record<string, unknown>).value)
          : String(v);
    });
    return out;
  }, [filters.filters]);

  // --- MAP RENDER LOGIC FOR SELECTED RING ---
  const selectedRingId = viewModal.record?.id;
  const { data: ringDetailsData } = useRpcRecord(supabase, 'v_rings', selectedRingId || null);
  const ringDetails = ringDetailsData as ExtendedRingDetails | null;

  const { data: rawNodes } = useLocalFirstQuery<'v_ring_nodes'>({
    queryKey: ['ring-nodes-detail', selectedRingId],
    onlineQueryFn: async () => {
      if (!selectedRingId) return [];
      const rpcFilters = buildRpcFilters({ ring_id: selectedRingId });
      const { data } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ring_nodes',
        p_limit: 1000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'order_in_ring',
      });
      return (data as { data: RingMapNode[] })?.data || [];
    },
    localQueryFn: () =>
      selectedRingId
        ? localDb.v_ring_nodes.where('ring_id').equals(selectedRingId).toArray()
        : Promise.resolve([]),
    dexieTable: localDb.v_ring_nodes,
    enabled: !!selectedRingId,
  });

  const mappedNodes = useMemo(
    () => (rawNodes || []).map(mapNodeData).filter(Boolean) as RingMapNode[],
    [rawNodes],
  );
  const ringNodeIds = useMemo(
    () => (rawNodes || []).map((n) => n.node_id).filter(Boolean) as string[],
    [rawNodes],
  );

  const { data: ringCables } = useQuery({
    queryKey: ['ring-cables-physical', selectedRingId, ringNodeIds],
    queryFn: async () => {
      if (ringNodeIds.length < 2) return [];
      const idList = ringNodeIds.map((id) => `'${id}'`).join(',');
      const { data } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ofc_cables_complete',
        p_limit: 1000,
        p_offset: 0,
        p_filters: { or: `sn_id IN (${idList}) OR en_id IN (${idList})` },
      });
      const allCables = (data as { data: Record<string, unknown>[] })?.data || [];
      const ringNodeSet = new Set(ringNodeIds);
      return allCables.filter(
        (c: Record<string, unknown>) =>
          ringNodeSet.has(c.sn_id as string) && ringNodeSet.has(c.en_id as string),
      );
    },
    enabled: ringNodeIds.length >= 2,
  });

  const { data: pathConfigs } = useQuery({
    queryKey: ['ring-path-config', selectedRingId],
    queryFn: async () => {
      const { data } = await supabase
        .from('logical_paths')
        .select('id, name, start_node_id, end_node_id, source_system_id, destination_system_id')
        .eq('ring_id', selectedRingId!);
      return data || [];
    },
    enabled: !!selectedRingId,
  });

  const { potentialSegments, spurConnections } = useMemo(() => {
    if (mappedNodes.length === 0) return { potentialSegments: [], spurConnections: [] };
    const hubs = mappedNodes
      .filter((n) => n.is_hub)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));
    const spokes = mappedNodes.filter((n) => !n.is_hub);
    const segments: Array<[RingMapNode, RingMapNode]> = [];

    if (hubs.length > 1) {
      for (let i = 0; i < hubs.length - 1; i++) segments.push([hubs[i], hubs[i + 1]]);
      if (ringDetails?.is_closed_loop) segments.push([hubs[hubs.length - 1], hubs[0]]);
    } else {
      const allNodes = [...mappedNodes].sort(
        (a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0),
      );
      if (allNodes.length > 1) {
        allNodes.forEach((node, i) => {
          if (i < allNodes.length - 1) segments.push([node, allNodes[i + 1]]);
          else if (ringDetails?.is_closed_loop) segments.push([node, allNodes[0]]);
        });
      }
    }

    const spurs: Array<[RingMapNode, RingMapNode]> = [];
    const hubMap = new Map<number, RingMapNode>();
    hubs.forEach((h) => hubMap.set(Math.floor(h.order_in_ring || 0), h));
    spokes.forEach((s) => {
      const parent = hubMap.get(Math.floor(s.order_in_ring || 0));
      if (parent) spurs.push([parent, s]);
    });
    return { potentialSegments: segments, spurConnections: spurs };
  }, [mappedNodes, ringDetails]);

  const { allSolidLines, configMap } = useMemo(() => {
    const disabledKeys = new Set(ringDetails?.topology_config?.disabled_segments || []);
    const activeTopology = potentialSegments.filter(
      ([s, e]) => !disabledKeys.has(`${s.id}-${e.id}`) && !disabledKeys.has(`${e.id}-${s.id}`),
    );
    const lines: Array<[RingMapNode, RingMapNode]> = [];
    const map: SegmentConfigMap = {};
    const nodeMap = new Map(mappedNodes.map((n) => [n.id!, n]));

    if (pathConfigs && pathConfigs.length > 0) {
      pathConfigs.forEach((pc: Record<string, unknown>) => {
        const start = nodeMap.get(pc.source_system_id as string);
        const end = nodeMap.get(pc.destination_system_id as string);
        if (start && end) {
          lines.push([start, end]);
          const sortedKey = [start.id, end.id].sort().join('-');
          if (!map[sortedKey]) map[sortedKey] = [];
          map[sortedKey].push({
            connectionId: pc.id as string,
            cableName: pc.name as string,
            color: COLOR_PALETTE[lines.length % COLOR_PALETTE.length],
          });
        }
      });
    }

    activeTopology.forEach(([start, end]) => {
      const sortedKey = [start.id, end.id].sort().join('-');
      if (!map[sortedKey] || map[sortedKey].length === 0) {
        lines.push([start, end]);
        let cableName = 'Physical Link';
        if (ringCables) {
          const matching = ringCables.find(
            (c) =>
              (c.sn_id === start.node_id && c.en_id === end.node_id) ||
              (c.sn_id === end.node_id && c.en_id === start.node_id),
          );
          if (matching) cableName = (matching.route_name as string) || 'Link';
        }
        if (!map[sortedKey]) map[sortedKey] = [];
        map[sortedKey].push({ cableName });
      }
    });
    return { allSolidLines: lines, configMap: map };
  }, [ringDetails, potentialSegments, pathConfigs, mappedNodes, ringCables]);

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <div className='p-4 md:p-6 h-full flex flex-col'>
      <PageHeader
        title='Ring Topology Viewer'
        description='Visualize network rings and their associated systems.'
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && rings.length === 0}
        isFetching={isFetching}
      />

      {/* If a ring is selected, inject the View Toggle into the search bar or above entity component */}
      {selectedRingId && mappedNodes.length > 0 && (
        <div className='flex justify-end mt-4 mb-2'>
          <div className='flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1'>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FiMap className='inline mr-1' /> Map
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'schematic' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FiGrid className='inline mr-1' /> Schematic
            </button>
          </div>
        </div>
      )}

      <div className='grow mt-4'>
        <EntityManagementComponent
          config={dynamicFilterConfig}
          entitiesQuery={queryResult as UseQueryResult<PagedQueryResult<RingEntity>, Error>}
          isFetching={isFetching}
          selectedEntityId={selectedRingId ?? null}
          onSelect={(id) => {
            if (!id) viewModal.close();
            else {
              const rec = rings.find((r) => r.id === id);
              if (rec) viewModal.open(rec);
            }
          }}
          onViewDetails={() => handleViewDetails(viewModal.record!)}
          searchTerm={search.searchQuery}
          onSearchChange={search.setSearchQuery}
          filters={uiFilters}
          onFilterChange={(f) => filters.setFilters(f as Filters)}
          onClearFilters={() => filters.setFilters({})}
        />
      </div>

      {/* RENDER SELECTED RING MAP ON TOP IF APPLICABLE */}
      {selectedRingId && mappedNodes.length > 0 && (
        <div className='fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700'>
          <div className='flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2'>
              <GiLinkedRings /> {ringDetails?.name || 'Ring Map'}
            </h2>
            <Button variant='outline' onClick={() => viewModal.close()}>
              Close Viewer
            </Button>
          </div>
          <div className='flex-1 relative'>
            {viewMode === 'schematic' ? (
              <MeshDiagram
                nodes={mappedNodes}
                connections={allSolidLines}
                segmentConfigs={configMap}
              />
            ) : (
              <ClientRingMap
                nodes={mappedNodes.filter((n) => n.lat != null)}
                solidLines={allSolidLines}
                dashedLines={spurConnections}
                segmentConfigs={configMap}
                showControls
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
