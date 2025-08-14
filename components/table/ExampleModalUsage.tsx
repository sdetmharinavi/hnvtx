import { HiOutlineDocumentText } from "react-icons/hi";
import ExcelDownloadModal from "./ExcelDownloadModal";
import { useState } from "react";
import { Column, DownloadOptions } from "./excelDownload";

// Example usage component
const ExampleUsage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
  
    // Mock data - replace with your actual data
    const mockColumns: Column[] = [
      { key: 'id', title: 'ID', dataIndex: 'id', excelFormat: 'number' },
      { key: 'name', title: 'Name', dataIndex: 'name', excelFormat: 'text' },
      { key: 'email', title: 'Email', dataIndex: 'email', excelFormat: 'text' },
      { key: 'salary', title: 'Salary', dataIndex: 'salary', excelFormat: 'currency', align: 'right' },
      { key: 'hire_date', title: 'Hire Date', dataIndex: 'hire_date', excelFormat: 'date' },
      { key: 'completion', title: 'Completion Rate', dataIndex: 'completion_rate', excelFormat: 'percentage' }
    ];
  
    const mockFilters = {
      department: 'Engineering',
      status: 'Active'
    };
  
    const handleDownload = async (options: DownloadOptions): Promise<void> => {
      setIsDownloading(true);
      try {
        // Simulate download process
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Download options:', options);
        alert('Download completed! Check console for options.');
      } catch (error) {
        console.error('Download failed:', error);
      } finally {
        setIsDownloading(false);
      }
    };
  
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-gray-900 p-8 transition-colors">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Excel Download Modal Demo</h1>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-colors"
            >
              <HiOutlineDocumentText className="w-5 h-5" />
              Configure & Download Excel
            </button>
  
            <ExcelDownloadModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onDownload={handleDownload}
              availableColumns={mockColumns}
              currentFilters={mockFilters}
              isDownloading={isDownloading}
              tableName="employees"
            />
          </div>
        </div>
      </div>
    );
  };
  
  export default ExampleUsage;