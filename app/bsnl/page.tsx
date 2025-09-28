"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, TileLayerProps } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { 
  Cable, 
  Network, 
  Settings, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  GitBranch,
  Route,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { mockData } from '@/components/bsnl/NewAllocationModal';
import AdvancedAllocationModal from '@/components/bsnl/NewAllocationModal';

// Enhanced Types (keeping all existing types)
interface FiberNode {
  id: string;
  name: string;
  type: 'OFC' | 'JC' | 'END_POINT' | 'JOINT' | 'CPAN';
  position: [number, number];
  capacity: string;
  status: 'active' | 'inactive' | 'maintenance';
  connections: string[];
  fiberTerminations: FiberTermination[];
  region?: string;
  district?: string;
}

interface FiberTermination {
  fiberNumber: number;
  ofcId: string;
  systemId?: string;
  status: 'available' | 'occupied' | 'reserved' | 'faulty';
  connectedTo?: {
    nodeId: string;
    fiberNumber: number;
    ofcId: string;
  };
}

interface OFCCable {
  id: string;
  name: string;
  type: 'main' | 'branch' | 'cascade';
  startNode: string;
  endNode: string;
  fiberCount: number;
  length: number;
  status: 'operational' | 'damaged' | 'under_maintenance';
  path: [number, number][];
  fiberAllocations: FiberAllocation[];
  region?: string;
  district?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface FiberAllocation {
  fiberNumber: number;
  systemId: string;
  allocatedAt: string;
  routePath: FiberRoutePath[];
  status: 'active' | 'standby' | 'faulty';
}

interface FiberRoutePath {
  nodeId: string;
  ofcId: string;
  fiberNumber: number;
  action: 'terminate' | 'pass_through' | 'tap' | 'cascade';
  tapTo?: {
    ofcId: string;
    fiberNumber: number;
  };
}

interface NetworkSystem {
  id: string;
  name: string;
  type: 'transmission' | 'access' | 'backbone';
  startNode: string;
  endNode: string;
  fiberRoute: FiberRoutePath[];
  bandwidth: string;
  redundancy: 'protected' | 'unprotected';
  status: 'operational' | 'degraded' | 'down';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  region?: string;
  district?: string;
}

// Enhanced search and filter interfaces
interface SearchFilters {
  query: string;
  status: string[];
  type: string[];
  region: string[];
  district: string[];
  priority: string[];
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Virtual scrolling hook for large lists
function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const containerSize = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + containerSize + 5, items.length);
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, scrollTop, containerHeight, itemHeight]);
  
  return { visibleItems, setScrollTop };
}

// Search and filter utilities
function useSearchAndFilter<T>(
  items: T[],
  searchFn: (item: T, filters: SearchFilters) => boolean,
  filters: SearchFilters
) {
  return useMemo(() => {
    return items.filter(item => searchFn(item, filters));
  }, [items, searchFn, filters]);
}

// Sample data generator for testing scalability
function generateLargeDataset() {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const districts = ['District-A', 'District-B', 'District-C', 'District-D', 'District-E'];
  
  // Generate nodes
  const nodes: FiberNode[] = [];
  for (let i = 0; i < 100; i++) {
    nodes.push({
      id: `node_${i}`,
      name: `NODE ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
      type: ['OFC', 'JC', 'END_POINT'][i % 3] as FiberNode['type'],
      position: [22.5 + (Math.random() - 0.5) * 0.1, 88.35 + (Math.random() - 0.5) * 0.1],
      capacity: ['12F', '24F', '48F', '96F'][i % 4],
      status: ['active', 'inactive', 'maintenance'][i % 3] as FiberNode['status'],
      connections: [],
      fiberTerminations: [],
      region: regions[i % regions.length],
      district: districts[i % districts.length]
    });
  }

  // Generate OFC cables
  const ofcCables: OFCCable[] = [];
  for (let i = 0; i < 500; i++) {
    const startNode = nodes[Math.floor(Math.random() * nodes.length)];
    const endNode = nodes[Math.floor(Math.random() * nodes.length)];
    
    ofcCables.push({
      id: `ofc_${i}`,
      name: `OFC ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
      type: ['main', 'branch', 'cascade'][i % 3] as OFCCable['type'],
      startNode: startNode.id,
      endNode: endNode.id,
      fiberCount: [12, 24, 48, 96][i % 4],
      length: Math.random() * 10 + 0.5,
      status: ['operational', 'damaged', 'under_maintenance'][i % 3] as OFCCable['status'],
      path: [startNode.position, endNode.position],
      fiberAllocations: [],
      region: regions[i % regions.length],
      district: districts[i % districts.length],
      priority: ['high', 'medium', 'low'][i % 3] as OFCCable['priority'],
    });
  }

  // Generate systems
  const systems: NetworkSystem[] = [];
  for (let i = 0; i < 1000; i++) {
    const startNode = nodes[Math.floor(Math.random() * nodes.length)];
    const endNode = nodes[Math.floor(Math.random() * nodes.length)];
    
    systems.push({
      id: `system_${i}`,
      name: `CPAN ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
      type: ['transmission', 'access', 'backbone'][i % 3] as NetworkSystem['type'],
      startNode: startNode.id,
      endNode: endNode.id,
      fiberRoute: [],
      bandwidth: ['1Gbps', '10Gbps', '100Gbps'][i % 3],
      redundancy: ['protected', 'unprotected'][i % 2] as NetworkSystem['redundancy'],
      status: ['operational', 'degraded', 'down'][i % 3] as NetworkSystem['status'],
      priority: ['critical', 'high', 'medium', 'low'][i % 4] as NetworkSystem['priority'],
      region: regions[i % regions.length],
      district: districts[i % districts.length]
    });
  }

  return { nodes, ofcCables, systems };
}

// Enhanced search bar component
function AdvancedSearchBar({ 
  filters, 
  onFiltersChange, 
  onClear,
  suggestions = []
}: {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
  suggestions?: string[];
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search networks, cables, systems..."
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
        </button>
        
        <button
          onClick={onClear}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Clear
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => onFiltersChange({
                ...filters,
                status: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="operational">Operational</option>
              <option value="active">Active</option>
              <option value="degraded">Degraded</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              multiple
              value={filters.type}
              onChange={(e) => onFiltersChange({
                ...filters,
                type: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="main">Main</option>
              <option value="branch">Branch</option>
              <option value="cascade">Cascade</option>
              <option value="transmission">Transmission</option>
              <option value="access">Access</option>
              <option value="backbone">Backbone</option>
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              multiple
              value={filters.region}
              onChange={(e) => onFiltersChange({
                ...filters,
                region: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="Central">Central</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              multiple
              value={filters.district}
              onChange={(e) => onFiltersChange({
                ...filters,
                district: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="District-A">District A</option>
              <option value="District-B">District B</option>
              <option value="District-C">District C</option>
              <option value="District-D">District D</option>
              <option value="District-E">District E</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              multiple
              value={filters.priority}
              onChange={(e) => onFiltersChange({
                ...filters,
                priority: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// Virtualized list component
function VirtualizedList<T>({ 
  items, 
  renderItem, 
  itemHeight = 80,
  containerHeight = 400,
  onItemClick
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  onItemClick?: (item: T) => void;
}) {
  const { visibleItems, setScrollTop } = useVirtualScroll(items, containerHeight, itemHeight);
  
  return (
    <div 
      className="overflow-auto border rounded-lg"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleItems.offsetY}px)` }}>
          {visibleItems.items.map((item, index) => (
            <div 
              key={visibleItems.startIndex + index}
              style={{ height: itemHeight }}
              className="flex items-center px-4 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              {renderItem(item, visibleItems.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Paginated data table component
function PaginatedTable<T>({
  data,
  columns,
  pageSize = 50,
  onItemClick
}: {
  data: T[];
  columns: { key: string; label: string; render: (item: T) => React.ReactNode }[];
  pageSize?: number;
  onItemClick?: (item: T) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr 
                key={index}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Optimized map component with layer management
function OptimizedNetworkMap({
  nodes,
  cables,
  selectedSystem,
  visibleLayers = { nodes: true, cables: true, systems: true }
}: {
  nodes: FiberNode[];
  cables: OFCCable[];
  selectedSystem: NetworkSystem | null;
  visibleLayers?: { nodes: boolean; cables: boolean; systems: boolean };
}) {
  // Calculate map bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) return null;

    const lats = nodes.map(n => n.position[0]);
    const lngs = nodes.map(n => n.position[1]);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ] as [[number, number], [number, number]];
  }, [nodes]);

  // Filter visible items based on zoom level and performance
  const [zoom, setZoom] = useState(13);
  const [bounds2, setBounds2] = useState<LatLngBounds | null>(null);

  const visibleNodes = useMemo(() => {
    if (!bounds2 || !visibleLayers.nodes) return [];

    // Show fewer items at lower zoom levels for performance
    const maxItems = zoom > 14 ? 1000 : zoom > 12 ? 500 : 100;

    return nodes.slice(0, maxItems).filter(node => {
      const [lat, lng] = node.position;
      return lat >= bounds2.getSouth() && lat <= bounds2.getNorth() &&
             lng >= bounds2.getWest() && lng <= bounds2.getEast();
    });
  }, [nodes, bounds2, zoom, visibleLayers.nodes]);

  const visibleCables = useMemo(() => {
    if (!bounds2 || !visibleLayers.cables) return [];

    const maxItems = zoom > 14 ? 1000 : zoom > 12 ? 200 : 50;

    return cables.slice(0, maxItems).filter(cable => {
      return cable.path.some(([lat, lng]) => {
        return lat >= bounds2.getSouth() && lat <= bounds2.getNorth() &&
               lng >= bounds2.getWest() && lng <= bounds2.getEast();
      });
    });
  }, [cables, bounds2, zoom, visibleLayers.cables]);

  if (!bounds) return null;

  return (
    <MapContainer
      bounds={bounds}
      className="h-full w-full rounded-lg"
    >
      <MapEventHandler setBounds2={setBounds2} setZoom={setZoom} />
      <TileLayer
      {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap contributors' } as TileLayerProps)}
      />
      {/* Render cables */}
      {visibleCables.map((cable: OFCCable) => (
      <Polyline
        key={cable.id}
        positions={cable.path}
        pathOptions={{
        color: selectedSystem ? '#8b5cf6' : cable.status === 'operational' ? '#10b981' : '#ef4444',
        weight: selectedSystem ? 6 : 3,
        opacity: 0.7
        }}
      >
        <Popup>
        <div className="w-48">
          <h3 className="font-semibold">{cable.name}</h3>
          <p className="text-sm">Type: {cable.type}</p>
          <p className="text-sm">Fibers: {cable.fiberCount}</p>
          <p className="text-sm">Status: {cable.status}</p>
          <p className="text-sm">Region: {cable.region}</p>
        </div>
        </Popup>
      </Polyline>
      ))}
      
      {/* Render nodes */}
      {visibleNodes.map((node: FiberNode) => (
      <Marker key={node.id} position={node.position}>
        <Popup>
        <div className="w-48">
          <h3 className="font-semibold">{node.name}</h3>
          <p className="text-sm">Type: {node.type}</p>
          <p className="text-sm">Status: {node.status}</p>
          <p className="text-sm">Region: {node.region}</p>
        </div>
        </Popup>
      </Marker>
      ))}
    </MapContainer>
  );
}

// Component to handle map events using useMap hook
function MapEventHandler({
  setBounds2,
  setZoom
}: {
  setBounds2: (bounds: LatLngBounds) => void;
  setZoom: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Set initial bounds and zoom
    setBounds2(map.getBounds());
    setZoom(map.getZoom());

    // Set up event listeners
    const handleMapEvent = () => {
      setBounds2(map.getBounds());
      setZoom(map.getZoom());
    };

    map.on('zoomend moveend', handleMapEvent);

    // Cleanup event listeners on unmount
    return () => {
      map.off('zoomend moveend', handleMapEvent);
    };
  }, [map, setBounds2, setZoom]);

  return null;
}

// Main dashboard component with scalability improvements
export default function ScalableFiberNetworkDashboard() {
  // CORRECTED: Conditionally generate mock data only in development
  const [data] = useState(() => {
    // This check ensures the mock data function is completely removed from production builds.
    if (process.env.NODE_ENV === 'development') {
      return generateLargeDataset();
    }
    // In production, initialize with an empty state, ready for real data.
    return { nodes: [], ofcCables: [], systems: [] };
  });

  const [selectedSystem, setSelectedSystem] = useState<NetworkSystem | null>(null);
  const [selectedCable, setSelectedCable] = useState<OFCCable | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'allocations'>('overview');
  const [loading, setLoading] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  // 3. Create a handler function for saving the new allocation
  const handleSaveAllocation = (allocationData: FiberAllocation) => {
    console.log("New Allocation to be saved:", allocationData);
    // In a real application, you would:
    // 1. Update your main data state
    //    const cableToUpdate = data.ofcCables.find(c => ...);
    //    cableToUpdate.fiberAllocations.push(...);
    // 2. Make an API call to save the data to the backend
    // 3. Re-fetch or re-validate data if necessary
    alert(`Allocation for ${allocationData.systemId} created successfully! Check the console.`);
  };
  // Search and filter states
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    type: [],
    region: [],
    district: [],
    priority: []
  });

  const [visibleLayers, setVisibleLayers] = useState({
    nodes: true,
    cables: true,
    systems: true
  });

  // Search functions
  const searchSystems = useCallback((system: NetworkSystem, filters: SearchFilters) => {
    if (filters.query && !system.name.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(system.status)) {
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(system.type)) {
      return false;
    }
    if (filters.region.length > 0 && system.region && !filters.region.includes(system.region)) {
      return false;
    }
    if (filters.district.length > 0 && system.district && !filters.district.includes(system.district)) {
      return false;
    }
    if (filters.priority.length > 0 && system.priority && !filters.priority.includes(system.priority)) {
      return false;
    }
    return true;
  }, []);

  const searchCables = useCallback((cable: OFCCable, filters: SearchFilters) => {
    if (filters.query && !cable.name.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(cable.status)) {
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(cable.type)) {
      return false;
    }
    if (filters.region.length > 0 && cable.region && !filters.region.includes(cable.region)) {
      return false;
    }
    if (filters.district.length > 0 && cable.district && !filters.district.includes(cable.district)) {
      return false;
    }
    if (filters.priority.length > 0 && cable.priority && !filters.priority.includes(cable.priority)) {
      return false;
    }
    return true;
  }, []);

  // Filtered data
  const filteredSystems = useSearchAndFilter(data.systems, searchSystems, filters);
  const filteredCables = useSearchAndFilter(data.ofcCables, searchCables, filters);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      status: [],
      type: [],
      region: [],
      district: [],
      priority: []
    });
  }, []);

  const systemColumns = [
    {
      key: 'name',
      label: 'System Name',
      render: (system: NetworkSystem) => (
        <div>
          <div className="font-medium">{system.name}</div>
          <div className="text-sm text-gray-500">{system.type}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (system: NetworkSystem) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          system.status === 'operational' ? 'bg-green-100 text-green-800' :
          system.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {system.status}
        </span>
      )
    },
    {
      key: 'bandwidth',
      label: 'Bandwidth',
      render: (system: NetworkSystem) => system.bandwidth
    },
    {
      key: 'region',
      label: 'Region/District',
      render: (system: NetworkSystem) => (
        <div className="text-sm">
          <div>{system.region}</div>
          <div className="text-gray-500">{system.district}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (system: NetworkSystem) => (
        <span className={`px-2 py-1 text-xs rounded ${
          system.priority === 'critical' ? 'bg-red-100 text-red-700' :
          system.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          system.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {system.priority}
        </span>
      )
    }
  ];

  const cableColumns = [
    {
      key: 'name',
      label: 'Cable Name',
      render: (cable: OFCCable) => (
        <div>
          <div className="font-medium">{cable.name}</div>
          <div className="text-sm text-gray-500">{cable.type}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (cable: OFCCable) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          cable.status === 'operational' ? 'bg-green-100 text-green-800' :
          cable.status === 'damaged' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {cable.status}
        </span>
      )
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (cable: OFCCable) => `${cable.fiberCount}F / ${cable.length.toFixed(1)}km`
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (cable: OFCCable) => {
        const used = cable.fiberAllocations.length;
        const total = cable.fiberCount;
        const percentage = (used / total * 100).toFixed(1);
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{used}/{total}</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  parseFloat(percentage) > 80 ? 'bg-red-500' :
                  parseFloat(percentage) > 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{percentage}%</span>
          </div>
        );
      }
    },
    {
      key: 'region',
      label: 'Region/District',
      render: (cable: OFCCable) => (
        <div className="text-sm">
          <div>{cable.region}</div>
          <div className="text-gray-500">{cable.district}</div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  BSNL Scalable Fiber Network
                </h1>
                <p className="text-sm text-gray-500">
                  {data.systems.length.toLocaleString()} Systems | {data.ofcCables.length.toLocaleString()} Cables | {data.nodes.length.toLocaleString()} Nodes
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setVisibleLayers({...visibleLayers, nodes: !visibleLayers.nodes})}
                  className={`p-2 rounded ${visibleLayers.nodes ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                  title="Toggle Nodes"
                >
                  <MapPin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVisibleLayers({...visibleLayers, cables: !visibleLayers.cables})}
                  className={`p-2 rounded ${visibleLayers.cables ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                  title="Toggle Cables"
                >
                  <Cable className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVisibleLayers({...visibleLayers, systems: !visibleLayers.systems})}
                  className={`p-2 rounded ${visibleLayers.systems ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
                  title="Toggle Systems"
                >
                  <Route className="h-4 w-4" />
                </button>
              </div>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1000);
                }}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Upload className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <AdvancedSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onClear={clearFilters}
        />

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['overview', 'systems', 'allocations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'overview' | 'systems' | 'allocations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize relative ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'systems' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                    {filteredSystems.length}
                  </span>
                )}
                {tab === 'allocations' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                    {filteredCables.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Network className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {data.systems.filter(s => s.status === 'operational').length.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Active Systems</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Cable className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {data.ofcCables.filter(c => c.status === 'operational').length.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">OFC Cables</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {data.nodes.filter(n => n.status === 'active').length.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Active Nodes</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <GitBranch className="h-6 w-6 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {data.ofcCables.reduce((sum, cable) => sum + cable.fiberAllocations.length, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Fiber Allocations</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {data.systems.filter(s => s.status === 'down').length + 
                       data.ofcCables.filter(c => c.status === 'damaged').length}
                    </p>
                    <p className="text-xs text-gray-500">Issues</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-xl font-semibold text-gray-900">
                      {(((data.systems.filter(s => s.status === 'operational').length / data.systems.length) * 100)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Map */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Network Topology</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {Math.min(1000, data.nodes.length)} nodes and {Math.min(1000, data.ofcCables.length)} cables (optimized for performance)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Layers:</span>
                  <button
                    onClick={() => setVisibleLayers({...visibleLayers, nodes: !visibleLayers.nodes})}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleLayers.nodes ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    Nodes {visibleLayers.nodes ? <Eye className="inline h-3 w-3" /> : <EyeOff className="inline h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => setVisibleLayers({...visibleLayers, cables: !visibleLayers.cables})}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleLayers.cables ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    Cables {visibleLayers.cables ? <Eye className="inline h-3 w-3" /> : <EyeOff className="inline h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="h-96">
                <OptimizedNetworkMap 
                  nodes={data.nodes}
                  cables={data.ofcCables}
                  selectedSystem={selectedSystem}
                  visibleLayers={visibleLayers}
                />
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>
                <div className="space-y-3">
                  {['North', 'South', 'East', 'West', 'Central'].map(region => {
                    const regionSystems = data.systems.filter(s => s.region === region);
                    const regionCables = data.ofcCables.filter(c => c.region === region);
                    
                    return (
                      <div key={region} className="flex items-center justify-between">
                        <span className="font-medium">{region}</span>
                        <div className="text-sm text-gray-600">
                          <span className="mr-4">{regionSystems.length} systems</span>
                          <span>{regionCables.length} cables</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status Overview</h3>
                <div className="space-y-3">
                  {[
                    { status: 'operational', color: 'text-green-600', bgColor: 'bg-green-100' },
                    { status: 'degraded', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
                    { status: 'down', color: 'text-red-600', bgColor: 'bg-red-100' }
                  ].map(({ status, color, bgColor }) => {
                    const count = data.systems.filter(s => s.status === status).length;
                    const percentage = (count / data.systems.length * 100).toFixed(1);
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${bgColor} mr-3`}></div>
                          <span className="capitalize">{status}</span>
                        </div>
                        <div className={`text-sm font-medium ${color}`}>
                          {count.toLocaleString()} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Systems Tab - Enhanced with scalability */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Network Systems</h2>
                <p className="text-sm text-gray-500">
                  Showing {filteredSystems.length.toLocaleString()} of {data.systems.length.toLocaleString()} systems
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add System
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <PaginatedTable
                data={filteredSystems}
                columns={systemColumns}
                onItemClick={setSelectedSystem}
                pageSize={50}
              />
            </div>

            {/* Selected System Details */}
            {selectedSystem && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedSystem.name}</h3>
                    <p className="text-sm text-gray-500">System Details</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSystem(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Type:</span> {selectedSystem.type}</div>
                      <div><span className="font-medium">Bandwidth:</span> {selectedSystem.bandwidth}</div>
                      <div><span className="font-medium">Redundancy:</span> {selectedSystem.redundancy}</div>
                      <div><span className="font-medium">Region:</span> {selectedSystem.region}</div>
                      <div><span className="font-medium">District:</span> {selectedSystem.district}</div>
                      <div><span className="font-medium">Priority:</span> 
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          selectedSystem.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          selectedSystem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedSystem.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status & Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          selectedSystem.status === 'operational' ? 'bg-green-100 text-green-700' :
                          selectedSystem.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedSystem.status}
                        </span>
                      </div>
                      <div><span className="font-medium">Start Node:</span> {selectedSystem.startNode}</div>
                      <div><span className="font-medium">End Node:</span> {selectedSystem.endNode}</div>
                      <div><span className="font-medium">Route Hops:</span> {selectedSystem.fiberRoute.length}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                        View Route Details
                      </button>
                      <button className="w-full px-3 py-2 text-left text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                        Monitor Performance
                      </button>
                      <button className="w-full px-3 py-2 text-left text-sm bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                        Schedule Maintenance
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Allocations Tab - Enhanced with scalability */}
        {activeTab === 'allocations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Fiber Allocations</h2>
                <p className="text-sm text-gray-500">
                  Showing {filteredCables.length.toLocaleString()} of {data.ofcCables.length.toLocaleString()} cables
                </p>
              </div>
              <div className="flex space-x-2">
              <button 
              onClick={() => setIsAllocationModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Allocation
            </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <PaginatedTable
                data={filteredCables}
                columns={cableColumns}
                onItemClick={setSelectedCable}
                pageSize={25}
              />
            </div>

            {/* Overall Utilization Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization by Type</h3>
                <div className="space-y-3">
                  {['main', 'branch', 'cascade'].map(type => {
                    const cables = data.ofcCables.filter(c => c.type === type);
                    const totalFibers = cables.reduce((sum, c) => sum + c.fiberCount, 0);
                    const usedFibers = cables.reduce((sum, c) => sum + c.fiberAllocations.length, 0);
                    const percentage = totalFibers > 0 ? (usedFibers / totalFibers * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{usedFibers}/{totalFibers}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                parseFloat(percentage) > 80 ? 'bg-red-500' :
                                parseFloat(percentage) > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Planning</h3>
                <div className="space-y-3">
                  {[
                    { threshold: 90, label: 'Critical (>90%)', color: 'text-red-600' },
                    { threshold: 80, label: 'Warning (>80%)', color: 'text-yellow-600' },
                    { threshold: 60, label: 'Good (>60%)', color: 'text-green-600' },
                    { threshold: 0, label: 'Low (<60%)', color: 'text-blue-600' }
                  ].map(({ threshold, label, color }) => {
                    let count = 0;
                    if (threshold === 90) {
                      count = data.ofcCables.filter(c => 
                        (c.fiberAllocations.length / c.fiberCount * 100) > 90
                      ).length;
                    } else if (threshold === 80) {
                      count = data.ofcCables.filter(c => {
                        const util = (c.fiberAllocations.length / c.fiberCount * 100);
                        return util > 80 && util <= 90;
                      }).length;
                    } else if (threshold === 60) {
                      count = data.ofcCables.filter(c => {
                        const util = (c.fiberAllocations.length / c.fiberCount * 100);
                        return util > 60 && util <= 80;
                      }).length;
                    } else {
                      count = data.ofcCables.filter(c => 
                        (c.fiberAllocations.length / c.fiberCount * 100) <= 60
                      ).length;
                    }
                    
                    return (
                      <div key={threshold} className="flex items-center justify-between">
                        <span className={`font-medium ${color}`}>{label}</span>
                        <span className={`text-sm ${color}`}>{count.toLocaleString()} cables</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-900">New allocation created</span>
                    </div>
                    <p className="text-gray-500 ml-5 text-xs">2 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-gray-900">Cable utilization warning</span>
                    </div>
                    <p className="text-gray-500 ml-5 text-xs">15 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-900">System maintenance completed</span>
                    </div>
                    <p className="text-gray-500 ml-5 text-xs">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <AdvancedAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSave={handleSaveAllocation}
        systems={mockData.systems}
        nodes={mockData.nodes}
        cables={mockData.ofcCables}
      />
    </div>
  );
}