"use client"

import React, { useState, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { Network, Settings, RefreshCw } from 'lucide-react';
import { BsnlCable, BsnlSystem, SearchFilters, BsnlNode } from '@/components/bsnl/types';
import { AdvancedSearchBar } from '@/components/bsnl/AdvancedSearchBar';
import { OptimizedNetworkMap } from '@/components/bsnl/OptimizedNetworkMap';
import { PaginatedTable } from '@/components/bsnl/PaginatedTable';
import AdvancedAllocationModal, { AllocationSaveData } from '@/components/bsnl/NewAllocationModal';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { PageSpinner, ErrorDisplay } from '@/components/common/ui';

type BsnlDashboardTab = 'overview' | 'systems' | 'allocations';

function useSearchAndFilter<T extends BsnlCable | BsnlSystem>(
  items: T[],
  searchFn: (item: T, filters: SearchFilters) => boolean,
  filters: SearchFilters
) {
  return useMemo(() => {
    return items.filter(item => searchFn(item, filters));
  }, [items, searchFn, filters]);
}

export default function ScalableFiberNetworkDashboard() {
  const supabase = createClient();
  const { data: nodesData, isLoading: isLoadingNodes, isError: isErrorNodes, error: errorNodes } = useTableQuery(supabase, 'v_nodes_complete');
  const { data: cablesData, isLoading: isLoadingCables, isError: isErrorCables, error: errorCables } = useTableQuery(supabase, 'v_ofc_cables_complete');
  const { data: systemsData, isLoading: isLoadingSystems, isError: isErrorSystems, error: errorSystems } = useTableQuery(supabase, 'v_systems_complete');

  const isLoading = isLoadingNodes || isLoadingCables || isLoadingSystems;
  const isError = isErrorNodes || isErrorCables || isErrorSystems;
  const error = errorNodes || errorCables || errorSystems;

  const data = useMemo(() => ({
    nodes: (nodesData as BsnlNode[]) || [],
    ofcCables: (cablesData as BsnlCable[]) || [],
    systems: (systemsData as BsnlSystem[]) || [],
  }), [nodesData, cablesData, systemsData]);

  const [selectedSystem, setSelectedSystem] = useState<BsnlSystem | null>(null);
  const [selectedCable, setSelectedCable] = useState<BsnlCable | null>(null);
  const [activeTab, setActiveTab] = useState<BsnlDashboardTab>('systems');
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '', status: [], type: [], region: [], district: [], priority: []
  });

  const handleSaveAllocation = (allocationData: AllocationSaveData) => {
    console.log("Allocation Saved:", allocationData);
  };

  const searchSystems = useCallback((system: BsnlSystem, filters: SearchFilters) => {
    const query = filters.query.toLowerCase();
    if (filters.query && !(system.system_name?.toLowerCase().includes(query) || system.node_name?.toLowerCase().includes(query))) return false;
    return true;
  }, []);

  const searchCables = useCallback((cable: BsnlCable, filters: SearchFilters) => {
    const query = filters.query.toLowerCase();
    if (filters.query && !(cable.route_name?.toLowerCase().includes(query) || cable.asset_no?.toLowerCase().includes(query))) return false;
    return true;
  }, []);

  const filteredSystems = useSearchAndFilter(data.systems, searchSystems, filters);
  const filteredCables = useSearchAndFilter(data.ofcCables, searchCables, filters);

  const clearFilters = useCallback(() => {
    setFilters({ query: '', status: [], type: [], region: [], district: [], priority: [] });
  }, []);

  const systemColumns = [
    { key: 'name', label: 'System Name', render: (system: BsnlSystem) => (<div><div className="font-medium text-gray-900 dark:text-white">{system.system_name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{system.system_type_name}</div></div>) },
    { key: 'status', label: 'Status', render: (system: BsnlSystem) => (<span className={`px-2 py-1 text-xs rounded-full ${system.status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{system.status ? 'Active' : 'Inactive'}</span>) },
    { key: 'node', label: 'Node', render: (system: BsnlSystem) => system.node_name },
    { key: 'ip', label: 'IP Address', render: (system: BsnlSystem) => <code className="text-xs">{system.ip_address as string}</code> },
    { key: 'region', label: 'Region', render: (system: BsnlSystem) => system.system_maintenance_terminal_name }
  ];

  const cableColumns = [
    { key: 'name', label: 'Route Name', render: (cable: BsnlCable) => (<div><div className="font-medium text-gray-900 dark:text-white">{cable.route_name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{cable.asset_no}</div></div>) },
    { key: 'status', label: 'Status', render: (cable: BsnlCable) => (<span className={`px-2 py-1 text-xs rounded-full ${cable.status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{cable.status ? 'Active' : 'Inactive'}</span>) },
    { key: 'capacity', label: 'Capacity', render: (cable: BsnlCable) => `${cable.capacity}F / ${cable.current_rkm?.toFixed(1)}km` },
    { key: 'endpoints', label: 'Endpoints', render: (cable: BsnlCable) => <div className="text-sm">{cable.sn_name} → {cable.en_name}</div> },
    { key: 'owner', label: 'Owner', render: (cable: BsnlCable) => cable.ofc_owner_name }
  ];
  
  if (isLoading) return <PageSpinner text="Loading Network Dashboard Data..." />;
  if (isError) return <ErrorDisplay error={error?.message || "An unknown error occurred."} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BSNL Fiber Network Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{data.systems.length.toLocaleString()} Systems | {data.ofcCables.length.toLocaleString()} Cables</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => { /* Implement refetch logic */ }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"><RefreshCw className={`h-5 w-5`} /></button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"><Settings className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdvancedSearchBar filters={filters} onFiltersChange={setFilters} onClear={clearFilters} />
        
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 -mb-px">
            {(['overview', 'systems', 'allocations'] as BsnlDashboardTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
            <div className="h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <OptimizedNetworkMap nodes={data.nodes} cables={data.ofcCables} selectedSystem={selectedSystem} visibleLayers={{ nodes: true, cables: true, systems: true }} />
            </div>
        )}

        {activeTab === 'systems' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
            <PaginatedTable data={filteredSystems} columns={systemColumns} onItemClick={setSelectedSystem} pageSize={50} />
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
            <PaginatedTable data={filteredCables} columns={cableColumns} onItemClick={setSelectedCable} pageSize={25} />
          </div>
        )}
      </div>

      <AdvancedAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSave={handleSaveAllocation}
        systems={data.systems}
        nodes={data.nodes}
        cables={data.ofcCables}
      />
    </div>
  );
}