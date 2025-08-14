// components/maintenance-areas/AreasToolbar.tsx
import { MdFilterList as Filter, MdSearch as Search, MdClear as Clear } from "react-icons/md";
import { AreaType } from "@/components/maintenance-areas/maintenance-areas-types";
import type React from "react";

interface AreasToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: { status?: string; areaType?: string };
  setFilters: (filters: { status?: string; areaType?: string }) => void;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: "list" | "tree";
  setViewMode: (mode: "list" | "tree") => void;
  areaTypes: AreaType[];
}

export function AreasToolbar({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode,
  areaTypes
}: AreasToolbarProps) {
  return (
    <div className='border-b border-gray-200 dark:border-gray-700 p-4'>
      <div className='mb-4 flex flex-col sm:flex-row items-center gap-4'>
        <div className='relative flex-1 w-full'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500' />
          <input 
            type='text' 
            placeholder='Search areas...' 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className='w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <Clear className='h-4 w-4' />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(p => !p)} 
            className='flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto justify-center'
          >
            <Filter className='h-4 w-4' />
            Filters
          </button>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'tree'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>
      {showFilters && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg bg-gray-50 dark:bg-gray-700 p-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>Status</label>
            <select 
              value={filters.status?.toString() ?? ''} 
              onChange={(e) => setFilters({...filters, status: e.target.value})} 
              className='w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>Area Type</label>
            <select 
              value={filters.areaType || ''} 
              onChange={(e) => setFilters({...filters, areaType: e.target.value})} 
              className='w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
            >
              <option value="">All Types</option>
              {areaTypes?.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className='flex items-end'>
            <button 
              onClick={() => setFilters({})} 
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}