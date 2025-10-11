'use client';

import React, { useState, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { Network, Settings, RefreshCw, Loader2, Eye } from 'lucide-react';
import { BsnlCable, BsnlSystem, AllocationSaveData } from '@/components/bsnl/types';
import { AdvancedSearchBar } from '@/components/bsnl/AdvancedSearchBar';
import { OptimizedNetworkMap } from '@/components/bsnl/OptimizedNetworkMap';
import { DataTable, TableAction } from '@/components/table';
import AdvancedAllocationModal from '@/components/bsnl/NewAllocationModal';
import { useBsnlDashboardData } from '@/components/bsnl/useBsnlDashboardData';
import { PageSpinner, ErrorDisplay } from '@/components/common/ui';
import { toast } from 'sonner';
import { DashboardStatsGrid } from '@/components/bsnl/DashboardStatsGrid';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { LatLngBounds } from 'leaflet';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { SystemDetailsModal } from '@/config/system-details-config';
import { CableDetailsModal } from '@/config/cable-details-config';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { useDebounce } from '@/hooks/useDebounce';

type BsnlDashboardTab = 'overview' | 'systems' | 'allocations';

export default function ScalableFiberNetworkDashboard() {
  const [activeTab, setActiveTab] = useState<BsnlDashboardTab>('overview');
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isCableDetailsOpen, setIsCableDetailsOpen] = useState(false);

  const [filters, setFilters] = useState<BsnlSearchFilters>({
    query: '',
    status: undefined,
    type: undefined,
    region: undefined,
    nodeType: undefined,
    priority: undefined,
  });
  
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(13);
  
  // THE FIX: Debounce the mapBounds to prevent excessive refetching
  const debouncedMapBounds = useDebounce(mapBounds, 500); // 500ms delay

  // THE FIX: Pass the debouncedMapBounds to the data fetching hook
  const { data, isLoading, isError, error, refetchAll, isFetching } = useBsnlDashboardData(filters);

  const [selectedSystem, setSelectedSystem] = useState<BsnlSystem | null>(null);
  const [selectedCable, setSelectedCable] = useState<BsnlCable | null>(null);
  
  const handleBoundsChange = useCallback((bounds: LatLngBounds | null) => {
    setMapBounds(bounds);
  }, []);
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);
  const handleSaveAllocation = (
    data: AllocationSaveData // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    toast.info('Allocation feature is a work in progress.');
  };
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      status: undefined,
      type: undefined,
      region: undefined,
      nodeType: undefined,
      priority: undefined,
    });
  }, []);
  const handleRefresh = async () => {
    toast.info('Refreshing network data...');
    await refetchAll();
    toast.success('Dashboard data refreshed.');
  };

  const { typeOptions, regionOptions, nodeTypeOptions } = useMemo(() => {
    const allSystemTypes = [
      ...new Set(data.systems.map((s) => s.system_type_name).filter(Boolean)),
    ];
    const allCableTypes = [...new Set(data.ofcCables.map((c) => c.ofc_type_name).filter(Boolean))];
    const uniqueTypes = [...new Set([...allSystemTypes, ...allCableTypes])].sort();
    const allRegions = [
      ...new Set(data.nodes.map((n) => n.maintenance_area_name).filter(Boolean)),
    ].sort();
    const allNodeTypes = [
      ...new Set(data.nodes.map((n) => n.node_type_name).filter(Boolean)),
    ].sort();
    return {
      typeOptions: uniqueTypes as string[],
      regionOptions: allRegions as string[],
      nodeTypeOptions: allNodeTypes as string[],
    };
  }, [data]);

  const systemColumns: Column<Row<'v_systems_complete'>>[] = useMemo(
    () => [
      {
        key: 'system_name',
        title: 'System Name',
        dataIndex: 'system_name',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlSystem;
          return (
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{rec.system_name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{rec.system_type_name}</div>
            </div>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlSystem;
          return (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                rec.status
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {rec.status ? 'Active' : 'Inactive'}
            </span>
          );
        },
      },
      { key: 'node_name', title: 'Node', dataIndex: 'node_name', sortable: true },
      {
        key: 'ip_address',
        title: 'IP Address',
        dataIndex: 'ip_address',
        sortable: true,
        render: (_, record) => <code className="text-xs">{record.ip_address as string}</code>,
      },
      {
        key: 'system_maintenance_terminal_name',
        title: 'Region',
        dataIndex: 'system_maintenance_terminal_name',
        sortable: true,
      },
    ],
    []
  );

  const cableColumns: Column<Row<'v_ofc_cables_complete'>>[] = useMemo(
    () => [
      {
        key: 'route_name',
        title: 'Route Name',
        dataIndex: 'route_name',
        width: '300px',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlCable;
          return (
            <div className="grid grid-rows-2">
              <TruncateTooltip text={rec.route_name || ''} />
              <div className="text-sm text-gray-500 dark:text-gray-400">{rec.asset_no}</div>
            </div>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        width: '80px',
        dataIndex: 'status',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlCable;
          return (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                rec.status
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {rec.status ? 'Active' : 'Inactive'}
            </span>
          );
        },
      },
      {
        key: 'capacity',
        title: 'Capacity / RKM',
        width: '100px',
        dataIndex: 'capacity',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlCable;
          return `${rec.capacity}F / ${rec.current_rkm?.toFixed(1)}km`;
        },
      },
      {
        key: 'endpoints',
        title: 'Endpoints',
        width: '350px',
        dataIndex: 'sn_name',
        sortable: true,
        render: (_, record) => {
          const rec = record as BsnlCable;
          return <TruncateTooltip text={rec.sn_name + ' → ' + rec.en_name} />;
        },
      },
      {
        key: 'ofc_owner_name',
        title: 'Owner',
        width: '100px',
        dataIndex: 'ofc_owner_name',
        sortable: true,
      },
    ],
    []
  );

  const systemTableActions: TableAction<'v_systems_complete'>[] = useMemo(
    () => [
      {
        key: 'view-details',
        label: 'View Details',
        icon: <Eye size={16} />,
        onClick: (record) => {
          setSelectedSystem(record as BsnlSystem);
          setIsSystemDetailsOpen(true);
        },
      },
    ],
    []
  );

  const cableTableActions: TableAction<'v_ofc_cables_complete'>[] = useMemo(
    () => [
      {
        key: 'view-details',
        label: 'View Details',
        icon: <Eye size={16} />,
        onClick: (record) => {
          setSelectedCable(record as BsnlCable);
          setIsCableDetailsOpen(true);
        },
      },
    ],
    []
  );

  const isInitialLoad = isLoading && !data.systems.length && !data.ofcCables.length && !debouncedMapBounds;

  if (isInitialLoad) return <PageSpinner text="Loading Network Dashboard Data..." />;
  if (isError) return <ErrorDisplay error={error?.message || 'An unknown error occurred.'} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  BSNL Fiber Network Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.systems.length.toLocaleString()} Systems |{' '}
                  {data.ofcCables.length.toLocaleString()} Cables
                  {isFetching && (
                    <span className="ml-2 inline-flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdvancedSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onClear={clearFilters}
          typeOptions={typeOptions}
          regionOptions={regionOptions}
          nodeTypeOptions={nodeTypeOptions}
        />
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 -mb-px">
            {(['overview', 'systems', 'allocations'] as BsnlDashboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="relative">
          {isFetching && !isInitialLoad && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Updating results...
                </span>
              </div>
            </div>
          )}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <DashboardStatsGrid />
              <div className="h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <OptimizedNetworkMap
                  nodes={data.nodes}
                  cables={data.ofcCables}
                  selectedSystem={selectedSystem}
                  visibleLayers={{ nodes: true, cables: true, systems: true }}
                  mapBounds={mapBounds}
                  zoom={zoom}
                  onBoundsChange={handleBoundsChange}
                  onZoomChange={handleZoomChange}
                />
              </div>
            </div>
          )}
          {activeTab === 'systems' && (
            <DataTable
              tableName="v_systems_complete"
              data={data.systems}
              columns={systemColumns}
              loading={isLoading}
              actions={systemTableActions}
              sortable={true}
              pagination={{
                current: 1,
                pageSize: 50,
                total: data.systems.length,
                onChange: () => {},
              }}
            />
          )}
          {activeTab === 'allocations' && (
            <DataTable
              tableName="v_ofc_cables_complete"
              data={data.ofcCables}
              columns={cableColumns}
              loading={isLoading}
              actions={cableTableActions}
              sortable={true}
              pagination={{
                current: 1,
                pageSize: 25,
                total: data.ofcCables.length,
                onChange: () => {},
              }}
            />
          )}
        </div>
      </div>

      <AdvancedAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSave={handleSaveAllocation}
        systems={data.systems}
        nodes={data.nodes}
        cables={data.ofcCables}
      />

      <SystemDetailsModal
        system={selectedSystem}
        isOpen={isSystemDetailsOpen}
        onClose={() => setIsSystemDetailsOpen(false)}
      />
      <CableDetailsModal
        cable={selectedCable}
        isOpen={isCableDetailsOpen}
        onClose={() => setIsCableDetailsOpen(false)}
      />
    </div>
  );
}