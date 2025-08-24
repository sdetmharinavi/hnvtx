import React, { useState } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiInfo, 
  FiPlus, 
  FiX,
  FiAlertCircle 
} from 'react-icons/fi';
interface DataItem {
    id: string | number;  // Adjust the type based on your actual ID type
    name: string;
    description?: string;
    status?: boolean;
    title?: string;
    // Add other properties that your data items have
  }
interface DataListViewProps {
    data: DataItem[];
    isLoading: boolean;
    error: unknown;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
    showFilters: boolean;
    onToggleFilters: () => void;
    filters: unknown;
    onFilterChange: (newFilters: unknown) => void;
    onClearFilters: () => void;
    viewMode: string;
    onViewModeChange: (mode: string) => void;
    showViewModeToggle: boolean;
    selectedItemId: string | null;
    showDetailsPanel: boolean;
    setShowDetailsPanel: (value: boolean) => void;
    detailsTitle: string;
    onCreateNew: () => void;
    createButtonText: string;
    createButtonIcon: React.ReactNode;
    onItemSelect: (item: DataItem) => void;
    renderListItem: (item: DataItem, isSelected: boolean, onSelect: () => void) => React.ReactNode;
    renderGridItem: (item: DataItem, isSelected: boolean, onSelect: () => void) => React.ReactNode;
    renderTreeItem: (item: DataItem, level: number, isSelected: boolean, isExpanded: boolean, onSelect: () => void, onToggleExpand: () => void) => React.ReactNode;
    renderDetailsPanel: (selectedItem: DataItem) => React.ReactNode;
    renderFilters: (filters: unknown, onFilterChange: (newFilters: unknown) => void, onClearFilters: () => void) => React.ReactNode;
    emptyStateIcon: React.ComponentType<{ className?: string }>;
    createIcon: React.ComponentType<{ className?: string }>;
    emptyStateTitle: string;
    emptyStateDescription: string;
    showCreateOnEmpty: boolean;
    loadingText: string;
    errorTitle: string;
    className: string;
    listClassName: string;
    detailsClassName: string;
}

/**
 * A reusable data list view component with search, filters, and details panel
 * @param {Object} props - Component props
 */
const DataListView = (props: DataListViewProps) => {
  // Destructure props with defaults
  const {
    data = [],
    isLoading = false,
    error = null,
    searchTerm = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    showFilters = false,
    onToggleFilters,
    filters = {},
    onFilterChange,
    onClearFilters,
    viewMode = 'list',
    onViewModeChange,
    showViewModeToggle = true,
    selectedItemId = null,
    onItemSelect,
    showDetailsPanel = false,
    setShowDetailsPanel,
    detailsTitle = 'Details',
    onCreateNew,
    createButtonText = 'Add New',
    renderListItem,
    renderTreeItem,
    renderGridItem,
    renderDetailsPanel,
    renderFilters,
    emptyStateIcon = FiInfo,
    emptyStateTitle = 'No items found',
    emptyStateDescription = 'No items match your criteria.',
    showCreateOnEmpty = true,
    loadingText = 'Loading...',
    errorTitle = 'Error loading data',
    className = '',
    listClassName = '',
    detailsClassName = '',
  } = props;

  const [internalShowDetailsPanel, setInternalShowDetailsPanel] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const detailsPanelVisible = showDetailsPanel !== undefined ? showDetailsPanel : internalShowDetailsPanel;
  const setDetailsPanelVisible = setShowDetailsPanel || setInternalShowDetailsPanel;

  const selectedItem = data.find((item) => (item as unknown as { id: string }).id === selectedItemId);

  const handleItemSelect = (item: DataItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
    // Auto-show details panel on mobile when item is selected
    if (window.innerWidth < 1024) {
      setDetailsPanelVisible(true);
    }
  };

  const ViewModeToggle = () => {
    if (!showViewModeToggle) return null;
    
    return (
      <div className="flex items-center space-x-1 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onViewModeChange && onViewModeChange('list')}
          className={`p-2 rounded-md ${
            viewMode === 'list'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <FiList className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange && onViewModeChange('grid')}
          className={`p-2 rounded-md ${
            viewMode === 'grid'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <FiGrid className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const SearchAndFiltersSection = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              className={`p-2 rounded-md ${
                showFilters
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <FiFilter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {showFilters && renderFilters && (
        <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          {renderFilters(filters, onFilterChange, onClearFilters)}
        </div>
      )}
      
      <ViewModeToggle />
    </div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{loadingText}</p>
      </div>
    </div>
  );

  const ErrorState = () => {
    const ErrorIcon = FiAlertCircle;
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 inline-block mb-4">
            <ErrorIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400">
            {errorTitle}: {(error as Error)?.message || String(error)}
          </p>
        </div>
      </div>
    );
  };

  const EmptyState = () => {
    
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          {React.createElement(emptyStateIcon, { 
            className: "h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" 
          })}
          <p className="text-gray-900 dark:text-white font-medium mb-2">
            {emptyStateTitle}
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {emptyStateDescription}
          </p>
          {showCreateOnEmpty && onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <FiPlus className="h-4 w-4 mr-2" />
              {createButtonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState />;
    if (data.length === 0) return <EmptyState />;

    const contentClass = viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
      : "divide-y divide-gray-100 dark:divide-gray-700";

    return (
      <div className={contentClass}>
        {data.map((item) => {
          const isSelected = selectedItemId === item.id;
          
          if (viewMode === 'grid' && renderGridItem) {
            return renderGridItem(item, isSelected, () => handleItemSelect(item));
          } else if (viewMode === 'tree' && renderTreeItem) {
            return renderTreeItem(item, 0, isSelected, false, () => handleItemSelect(item), () => {});
          } else if (renderListItem) {
            return renderListItem(item, isSelected, () => handleItemSelect(item));
          }
          
          // Fallback default rendering
          return (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {item.name || item.title || item.id}
              </div>
              {item.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] ${className}`}>
      {/* Left Panel - List */}
      <div
        className={`flex-1 flex flex-col ${
          detailsPanelVisible ? "hidden lg:flex" : "flex"
        } lg:border-r lg:border-gray-200 lg:dark:border-gray-700 ${listClassName}`}
      >
        <SearchAndFiltersSection />
        
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {renderContent()}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div
        className={`${
          detailsPanelVisible ? "flex" : "hidden lg:flex"
        } flex-col w-full lg:w-96 xl:w-1/3 bg-white dark:bg-gray-800 border-t lg:border-t-0 border-gray-200 dark:border-gray-700 ${detailsClassName}`}
      >
        {/* Mobile Details Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {detailsTitle}
            </h2>
            <button
              onClick={() => setDetailsPanelVisible(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop Details Header */}
        <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {detailsTitle}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedItem && renderDetailsPanel ? (
            renderDetailsPanel(selectedItem)
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <FiInfo className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select an item to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataListView;


// // Example usage component
// const ExampleUsage = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedId, setSelectedId] = useState(null);
//   const [viewMode, setViewMode] = useState('list');
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState({});

//   // Mock data
//   const sampleData = [
//     { id: '1', name: 'Software Engineer', description: 'Develops applications', department: 'Engineering', status: 'active' },
//     { id: '2', name: 'Product Manager', description: 'Manages product roadmap', department: 'Product', status: 'active' },
//     { id: '3', name: 'UX Designer', description: 'Designs user experiences', department: 'Design', status: 'inactive' },
//     { id: '4', name: 'Data Analyst', description: 'Analyzes business data', department: 'Analytics', status: 'active' },
//   ];

//   const filteredData = sampleData.filter((item) => {
//     const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = !filters.status || item.status === filters.status;
//     const matchesDepartment = !filters.department || item.department === filters.department;
//     return matchesSearch && matchesStatus && matchesDepartment;
//   });

//   const handleFilterChange = (newFilters) => {
//     setFilters({ ...filters, ...newFilters });
//   };

//   const handleClearFilters = () => {
//     setFilters({});
//   };

//   const handleItemSelect = (item) => {
//     setSelectedId(item.id);
//   };

//   const handleCreateNew = () => {
//     alert('Create new position');
//   };

//   const handleSearchChange = (value) => {
//     setSearchTerm(value);
//   };

//   const handleToggleFilters = () => {
//     setShowFilters(!showFilters);
//   };

//   const handleViewModeChange = (mode) => {
//     setViewMode(mode);
//   };

//   const renderListItem = (item, isSelected, onSelect) => (
//     <div
//       key={item.id}
//       onClick={onSelect}
//       className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
//         isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' : ''
//       }`}
//     >
//       <div className="flex justify-between items-start">
//         <div>
//           <h3 className="font-medium text-gray-900 dark:text-white">
//             {item.name}
//           </h3>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//             {item.description}
//           </p>
//         </div>
//         <div className="flex flex-col items-end space-y-1">
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
//             {item.department}
//           </span>
//           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//             item.status === 'active' 
//               ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
//               : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
//           }`}>
//             {item.status}
//           </span>
//         </div>
//       </div>
//     </div>
//   );

//   const renderFiltersComponent = (currentFilters, onFilterChange, onClearFilters) => (
//     <div className="pt-3 space-y-3">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//             Status
//           </label>
//           <select
//             value={currentFilters.status || ''}
//             onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           >
//             <option value="">All Status</option>
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//             Department
//           </label>
//           <select
//             value={currentFilters.department || ''}
//             onChange={(e) => onFilterChange({ department: e.target.value || undefined })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           >
//             <option value="">All Departments</option>
//             <option value="Engineering">Engineering</option>
//             <option value="Product">Product</option>
//             <option value="Design">Design</option>
//             <option value="Analytics">Analytics</option>
//           </select>
//         </div>
//       </div>
//       <div className="flex justify-end">
//         <button
//           onClick={onClearFilters}
//           className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
//         >
//           Clear Filters
//         </button>
//       </div>
//     </div>
//   );

//   const renderDetailsPanelComponent = (item) => (
//     <div className="p-6">
//       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//         {item.name}
//       </h3>
//       <div className="space-y-4">
//         <div>
//           <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
//             Description
//           </label>
//           <p className="text-gray-900 dark:text-white mt-1">
//             {item.description}
//           </p>
//         </div>
//         <div>
//           <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
//             Department
//           </label>
//           <p className="text-gray-900 dark:text-white mt-1">
//             {item.department}
//           </p>
//         </div>
//         <div>
//           <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
//             Status
//           </label>
//           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
//             item.status === 'active' 
//               ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
//               : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
//           }`}>
//             {item.status}
//           </span>
//         </div>
//       </div>
//       <div className="mt-6 flex space-x-3">
//         <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
//           Edit
//         </button>
//         <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
//           Delete
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="h-screen bg-gray-50 dark:bg-gray-900">
//       <DataListView
//         data={filteredData}
//         searchTerm={searchTerm}
//         onSearchChange={handleSearchChange}
//         searchPlaceholder="Search positions..."
//         showFilters={showFilters}
//         onToggleFilters={handleToggleFilters}
//         filters={filters}
//         onFilterChange={handleFilterChange}
//         onClearFilters={handleClearFilters}
//         selectedItemId={selectedId}
//         onItemSelect={handleItemSelect}
//         viewMode={viewMode}
//         onViewModeChange={handleViewModeChange}
//         detailsTitle="Position Details"
//         emptyStateTitle="No positions found"
//         emptyStateDescription="Try adjusting your search criteria."
//         createButtonText="Add Position"
//         onCreateNew={handleCreateNew}
//         renderListItem={renderListItem}
//         renderFilters={renderFiltersComponent}
//         renderDetailsPanel={renderDetailsPanelComponent}
//       />
//     </div>
//   );
// };

// export default ExampleUsage;