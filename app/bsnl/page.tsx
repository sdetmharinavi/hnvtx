// app/bsnl/page.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { Network, Loader2, Eye } from 'lucide-react';
import { BsnlCable, BsnlSystem, AllocationSaveData } from '@/components/bsnl/types';
import { AdvancedSearchBar } from '@/components/bsnl/AdvancedSearchBar';
import dynamic from 'next/dynamic';
import { DataTable, TableAction } from '@/components/table';
import AdvancedAllocationModal from '@/components/bsnl/NewAllocationModal';
import { useBsnlDashboardData } from '@/hooks/data/useBsnlDashboardData';
import { PageSpinner, ErrorDisplay, StatusBadge } from '@/components/common/ui';
import { toast } from 'sonner';
import { DashboardStatsGrid } from '@/components/bsnl/DashboardStatsGrid';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { LatLngBounds } from 'leaflet';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { SystemDetailsModal } from '@/config/system-details-config';
import { CableDetailsModal } from '@/config/cable-details-config';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { useDebounce } from 'use-debounce';
// REMOVED: useDashboardOverview import (Data passed from main hook now)
import { formatIP } from '@/utils/formatters';

const OptimizedNetworkMap = dynamic(
  () => import('@/components/bsnl/OptimizedNetworkMap').then((mod) => mod.OptimizedNetworkMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
        <PageSpinner text="Loading Map..." />
      </div>
    ),
  },
);

type BsnlDashboardTab = 'overview' | 'systems' | 'routes';

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

  const debouncedMapBounds = useDebounce(mapBounds, 500);

  const { data, isLoading, isError, error } = useBsnlDashboardData(filters, debouncedMapBounds[0]);

  const [selectedSystem, setSelectedSystem] = useState<BsnlSystem | null>(null);
  const [selectedCable, setSelectedCable] = useState<BsnlCable | null>(null);

  const handleBoundsChange = useCallback((bounds: LatLngBounds | null) => {
    setMapBounds(bounds);
  }, []);
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);
  const handleSaveAllocation = (data: AllocationSaveData) => {
    toast.info('Allocation feature is a work in progress.');
    console.log(data);
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

  // Generate a stable key for filters to control auto-zoom behavior
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

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

  const systemColumns = useMemo(
    (): Column<Row<'v_systems_complete'>>[] => [
      {
        key: 'system_name',
        title: 'System Name',
        dataIndex: 'system_name',
        render: (val) => <TruncateTooltip text={String(val ?? '')} />,
      },
      { key: 'system_type_name', title: 'Type', dataIndex: 'system_type_code' },
      {
        key: 'node_name',
        title: 'Node',
        dataIndex: 'node_name',
        render: (val) => <TruncateTooltip text={String(val ?? '')} />,
      },
      {
        key: 'ip_address',
        title: 'IP Address',
        dataIndex: 'ip_address',
        render: (val) => (val ? <code>{formatIP(val)}</code> : null),
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        render: (val) => <StatusBadge status={val as boolean} />,
      },
    ],
    [],
  );

  const cableColumns = useMemo(
    (): Column<Row<'v_ofc_cables_complete'>>[] => [
      {
        key: 'route_name',
        title: 'Route Name',
        dataIndex: 'route_name',
        render: (val) => <TruncateTooltip text={String(val ?? '')} />,
      },
      {
        key: 'transnet_id',
        title: 'Transnet ID',
        dataIndex: 'transnet_id',
      },
      { key: 'ofc_type_name', title: 'Type', dataIndex: 'ofc_type_name' },
      { key: 'capacity', title: 'Capacity', dataIndex: 'capacity' },
      {
        key: 'sn_name',
        title: 'Start Node',
        dataIndex: 'sn_name',
        render: (val) => <TruncateTooltip text={String(val ?? '')} />,
      },
      {
        key: 'en_name',
        title: 'End Node',
        dataIndex: 'en_name',
        render: (val) => <TruncateTooltip text={String(val ?? '')} />,
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        render: (val) => <StatusBadge status={val as boolean} />,
      },
    ],
    [],
  );

  const systemTableActions = useMemo(
    (): TableAction<'v_systems_complete'>[] => [
      {
        key: 'view-system',
        label: 'View Details',
        icon: <Eye />,
        onClick: (record) => {
          setSelectedSystem(record as BsnlSystem);
          setIsSystemDetailsOpen(true);
        },
      },
    ],
    [],
  );

  const cableTableActions = useMemo(
    (): TableAction<'v_ofc_cables_complete'>[] => [
      {
        key: 'view-cable',
        label: 'View Details',
        icon: <Eye />,
        onClick: (record) => {
          setSelectedCable(record as BsnlCable);
          setIsCableDetailsOpen(true);
        },
      },
    ],
    [],
  );

  if (isLoading) return <PageSpinner text="Loading Network Dashboard Data..." />;
  if (isError) return <ErrorDisplay error={error || 'An unknown error occurred.'} />;

  const totalSystems = data.systems.length;
  const totalCables = data.ofcCables.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  Harinavi Network Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalSystems.toLocaleString()} Systems | {totalCables.toLocaleString()} Cables
                  {/* Sync status removed from here as it's in the global header */}
                </p>
              </div>
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
            {(['overview', 'systems', 'routes'] as BsnlDashboardTab[]).map((tab) => (
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Pass the ALREADY FILTERED data to the grid */}
              <DashboardStatsGrid data={data} />
              <div className="h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <OptimizedNetworkMap
                  nodes={data.nodes}
                  cables={data.ofcCables}
                  systems={data.systems}
                  selectedSystem={selectedSystem}
                  visibleLayers={{ nodes: true, cables: true, systems: true }}
                  mapBounds={mapBounds}
                  zoom={zoom}
                  onBoundsChange={handleBoundsChange}
                  onZoomChange={handleZoomChange}
                  filterKey={filterKey}
                />
              </div>
            </div>
          )}
          {activeTab === 'systems' && (
            <DataTable
              autoHideEmptyColumns={true}
              tableName="v_systems_complete"
              data={data.systems}
              columns={systemColumns}
              loading={isLoading}
              actions={systemTableActions}
              sortable={true}
            />
          )}
          {activeTab === 'routes' && (
            <DataTable
              autoHideEmptyColumns={true}
              tableName="v_ofc_cables_complete"
              data={data.ofcCables}
              columns={cableColumns}
              loading={isLoading}
              actions={cableTableActions}
              sortable={true}
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