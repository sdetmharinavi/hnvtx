import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, SetStateAction, useState } from "react";
import { FiDownload, FiEdit3, FiEye, FiMapPin, FiPlus, FiSearch, FiX } from "react-icons/fi";
import DataTable from "./DataTable";

// Demo component to showcase the table
const DataTableDemo = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState([
      {
        id: 1,
        name: 'Server-01',
        type: 'Database Server',
        location: 'Node-A / DC-East',
        ip: '192.168.1.100',
        status: true,
        commissioned: '2024-01-15',
        cpu_usage: 75,
        memory_usage: 68,
        uptime: '15d 4h'
      },
      {
        id: 2,
        name: 'Server-02',
        type: 'Web Server',
        location: 'Node-B / DC-West',
        ip: '192.168.1.101',
        status: true,
        commissioned: '2024-02-20',
        cpu_usage: 45,
        memory_usage: 52,
        uptime: '8d 12h'
      },
      {
        id: 3,
        name: 'Server-03',
        type: 'Application Server',
        location: 'Node-C / DC-Central',
        ip: '192.168.1.102',
        status: false,
        commissioned: '2023-12-10',
        cpu_usage: 0,
        memory_usage: 0,
        uptime: '0d 0h'
      },
      {
        id: 4,
        name: 'Server-04',
        type: 'Database Server',
        location: 'Node-A / DC-East',
        ip: '192.168.1.103',
        status: true,
        commissioned: '2024-03-05',
        cpu_usage: 82,
        memory_usage: 78,
        uptime: '3d 18h'
      },
      {
        id: 5,
        name: 'Server-05',
        type: 'Load Balancer',
        location: 'Node-D / DC-South',
        ip: '192.168.1.104',
        status: true,
        commissioned: '2024-01-30',
        cpu_usage: 35,
        memory_usage: 42,
        uptime: '12d 6h'
      },
      {
        id: 6,
        name: 'Server-06',
        type: 'Web Server',
        location: 'Node-B / DC-West',
        ip: '192.168.1.105',
        status: false,
        commissioned: '2023-11-15',
        cpu_usage: 0,
        memory_usage: 0,
        uptime: '0d 0h'
      },
      {
        id: 7,
        name: 'Server-07',
        type: 'Application Server',
        location: 'Node-C / DC-Central',
        ip: '192.168.1.106',
        status: true,
        commissioned: '2024-02-12',
        cpu_usage: 58,
        memory_usage: 61,
        uptime: '7d 9h'
      },
      {
        id: 8,
        name: 'Server-08',
        type: 'Database Server',
        location: 'Node-A / DC-East',
        ip: '192.168.1.107',
        status: true,
        commissioned: '2024-03-18',
        cpu_usage: 91,
        memory_usage: 87,
        uptime: '1d 14h'
      }
    ]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
  
    // Column definitions
    const columns = [
      {
        key: 'name',
        title: 'System Name',
        dataIndex: 'name',
        sortable: true,
        searchable: true,
        filterable: true,
        editable: true,
        width: 200,
        render: (value: any, record: any) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{value}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">ID: {record.id}</span>
          </div>
        )
      },
      {
        key: 'type',
        title: 'Type',
        dataIndex: 'type',
        sortable: true,
        searchable: true,
        filterable: true,
        filterOptions: [
          { label: 'Database Server', value: 'Database Server' },
          { label: 'Web Server', value: 'Web Server' },
          { label: 'Application Server', value: 'Application Server' },
          { label: 'Load Balancer', value: 'Load Balancer' }
        ],
        width: 150,
        render: (value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            {value}
          </span>
        )
      },
      {
        key: 'location',
        title: 'Location',
        dataIndex: 'location',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 180,
        render: (value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => (
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-400" size={14} />
            <span className="text-sm">{value}</span>
          </div>
        )
      },
      {
        key: 'ip',
        title: 'IP Address',
        dataIndex: 'ip',
        sortable: true,
        searchable: true,
        width: 130,
        render: (value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => (
          <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {value}
          </span>
        )
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        sortable: true,
        filterable: true,
        filterOptions: [
          { label: 'Active', value: true },
          { label: 'Inactive', value: false }
        ],
        width: 100,
        align: 'center',
        render: (value: any) => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        )
      },
      {
        key: 'cpu_usage',
        title: 'CPU Usage',
        dataIndex: 'cpu_usage',
        sortable: true,
        width: 120,
        align: 'center',
        render: (value: any) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-medium min-w-[2rem]">{value}%</span>
          </div>
        )
      },
      {
        key: 'memory_usage',
        title: 'Memory',
        dataIndex: 'memory_usage',
        sortable: true,
        width: 120,
        align: 'center',
        render: (value: any) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-medium min-w-[2rem]">{value}%</span>
          </div>
        )
      },
      {
        key: 'uptime',
        title: 'Uptime',
        dataIndex: 'uptime',
        sortable: true,
        width: 100,
        align: 'center',
        render: (value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => (
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {value}
          </span>
        )
      },
      {
        key: 'commissioned',
        title: 'Commissioned',
        dataIndex: 'commissioned',
        sortable: true,
        width: 120,
        render: (value: string | number | Date) => new Date(value).toLocaleDateString()
      }
    ];
  
    // Table actions
    const actions = [
      {
        key: 'view',
        label: 'View Details',
        icon: <FiEye size={16} />,
        variant: 'primary',
        onClick: (record: { name: any; }) => {
          alert(`Viewing details for ${record.name}`);
        }
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit3 size={16} />,
        variant: 'secondary',
        onClick: (record: { name: any; }) => {
          alert(`Editing ${record.name}`);
        }
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <FiX size={16} />,
        variant: 'danger',
        onClick: (record: { name: any; id: number; }) => {
          if (confirm(`Are you sure you want to delete ${record.name}?`)) {
            setData(data.filter(item => item.id !== record.id));
          }
        },
        disabled: (record: { status: boolean; }) => record.status === true // Can't delete active servers
      }
    ];
  
    // Handlers
    const handleRefresh = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        alert('Data refreshed!');
      }, 1000);
    };
  
    const handleExport = (exportData: string | any[]) => {
      console.log('Exporting data:', exportData);
      alert(`Exporting ${exportData.length} records`);
    };
  
    const handleRowSelect = (selectedRows: SetStateAction<never[]>) => {
      setSelectedRows(selectedRows);
      console.log('Selected rows:', selectedRows);
    };
  
    const handleCellEdit = (record: { id: number; name: any; }, column: { dataIndex: any; title: any; }, newValue: any) => {
      setData(prevData => 
        prevData.map(item => 
          item.id === record.id 
            ? { ...item, [column.dataIndex]: newValue }
            : item
        )
      );
      alert(`Updated ${column.title} for ${record.name} to: ${newValue}`);
    };
  
    const handlePagination = (page: SetStateAction<number>, size: SetStateAction<number>) => {
      setCurrentPage(page);
      setPageSize(size);
    };
  
    const totalItems = data.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pageSize);
  
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Advanced Data Table Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              A comprehensive, reusable table component with modern features and styling
            </p>
            
            {selectedRows.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                  {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
  
          {/* Features Overview */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <FiSearch className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Search & Filter</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Global search + column filters</p>
                </div>
              </div>
            </div>
  
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <FiEdit3 className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Inline Editing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click cells to edit values</p>
                </div>
              </div>
            </div>
  
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <FiEye className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Column Control</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show/hide columns</p>
                </div>
              </div>
            </div>
  
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <FiDownload className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Export Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CSV export functionality</p>
                </div>
              </div>
            </div>
          </div>
  
          {/* The Advanced Data Table */}
          <DataTable
            title="Systems Management"
            data={paginatedData}
            columns={columns}
            loading={loading}
            actions={actions}
            searchable={true}
            filterable={true}
            sortable={true}
            selectable={true}
            exportable={true}
            refreshable={true}
            density="default"
            bordered={true}
            striped={true}
            hoverable={true}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              onChange: handlePagination
            }}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onRowSelect={handleRowSelect}
            onCellEdit={handleCellEdit}
            emptyText="No systems found. Try adjusting your search or filters."
            customToolbar={
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm">
                  <FiPlus size={16} />
                  Add System
                </button>
              </div>
            }
          />
  
          {/* Usage Instructions */}
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🚀 Key Features & Usage
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Core Features:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>✅ Global search across all searchable columns</li>
                  <li>✅ Individual column filters with dropdown options</li>
                  <li>✅ Multi-column sorting with visual indicators</li>
                  <li>✅ Inline cell editing (click on editable cells)</li>
                  <li>✅ Row selection with bulk operations</li>
                  <li>✅ Column visibility control</li>
                  <li>✅ Pagination with customizable page sizes</li>
                  <li>✅ Data export (CSV format)</li>
                  <li>✅ Responsive design with mobile support</li>
                  <li>✅ Dark mode support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Try These Actions:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>🔍 Use the search box to find specific systems</li>
                  <li>🔽 Click "Filters" to filter by type or status</li>
                  <li>📊 Click column headers to sort data</li>
                  <li>✏️ Click on system names to edit them</li>
                  <li>☑️ Check boxes to select multiple rows</li>
                  <li>👁️ Use "Columns" button to show/hide columns</li>
                  <li>📥 Click "Export" to download data as CSV</li>
                  <li>🔄 Use the refresh button to reload data</li>
                  <li>👀 Try the action buttons (view, edit, delete)</li>
                </ul>
              </div>
            </div>
          </div>
  
          {/* Component Props Documentation */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              📝 Component Integration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This DataTable component is fully reusable and can be integrated into any React project. 
              It supports TypeScript, has comprehensive prop validation, and includes all modern table features you'd expect.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-xs text-gray-700 dark:text-gray-300">
              {`<DataTable
    data={yourData}
    columns={columnDefinitions}
    pagination={paginationConfig}
    actions={actionButtons}
    searchable={true}
    filterable={true}
    selectable={true}
    exportable={true}
    onRefresh={handleRefresh}
    onRowSelect={handleRowSelect}
    onCellEdit={handleCellEdit}
  />`}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default DataTableDemo;