// app/dashboard/kml-manager/page.tsx
'use client';

import { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
  FiMap,
  FiUpload,
  FiTrash2,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiWifiOff,
} from 'react-icons/fi';
import { useKmlManager, BlobFile } from '@/hooks/useKmlManager';
import dynamic from 'next/dynamic';
import { PageSpinner, ConfirmModal } from '@/components/common/ui';
import { formatFileSize, formatDate } from '@/utils/formatters';
import { useUser } from '@/providers/UserProvider';
import { PERMISSIONS } from '@/config/permissions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

// Dynamically import the map to avoid SSR issues with Leaflet
const KmlMap = dynamic(() => import('@/components/kml/KmlMap'), {
  ssr: false,
  loading: () => (
    <div className='h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-lg'>
      <PageSpinner text='Loading Map Engine...' />
    </div>
  ),
});

type SortOrder = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

export default function KmlManagerPage() {
  const { kmlFiles, isLoading, uploadKml, isUploading, deleteKml, isDeleting, refetch } =
    useKmlManager();
  const [selectedKml, setSelectedKml] = useState<BlobFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<BlobFile | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc'); // Sorting state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  // Permission Logic
  const { canAccess } = useUser();
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);
  const canUpload = canAccess(PERMISSIONS.canUploadData);

  // Sorting Logic
  const sortedKmlFiles = useMemo(() => {
    return [...kmlFiles].sort((a, b) => {
      if (sortOrder === 'date-desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortOrder === 'date-asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }

      const nameA = a.pathname.toLowerCase();
      const nameB = b.pathname.toLowerCase();

      if (sortOrder === 'alpha-asc') {
        return nameA.localeCompare(nameB);
      }
      if (sortOrder === 'alpha-desc') {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });
  }, [kmlFiles, sortOrder]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) {
      toast.error('Cannot upload files while offline.', { icon: <FiWifiOff /> });
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.kml') && !name.endsWith('.kmz')) {
        alert('Please upload a valid .kml or .kmz file');
        return;
      }
      uploadKml(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (url: string, filename: string) => {
    if (!isOnline) {
      toast.error('Cannot download files while offline.', { icon: <FiWifiOff /> });
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // THE FIX: Use fixed dynamic viewport height to prevent collapse and overflow issues on mobile
    <div className='p-4 md:p-6 h-[calc(100dvh-70px)] md:h-[calc(100vh-64px)] flex flex-col space-y-4 overflow-hidden'>
      {/* Header needs to shrink-0 so it doesn't get crushed */}
      <div className='shrink-0'>
        <PageHeader
          title='KML Manager'
          description='Upload, manage, and visualize Google Earth KML network routes.'
          icon={<FiMap />}
          actions={[
            {
              label: 'Refresh',
              onClick: () => {
                if (isOnline) {
                  refetch();
                  toast.success('File list refreshed.');
                } else {
                  toast.warning('Cannot refresh list while offline.');
                }
              },
              variant: 'outline',
              leftIcon: <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />,
              disabled: isLoading,
            },
            // Conditionally render Upload button
            ...(canUpload
              ? [
                  {
                    label: isUploading ? 'Uploading...' : 'Upload KML',
                    leftIcon: <FiUpload />,
                    onClick: () => fileInputRef.current?.click(),
                    variant: 'primary' as const,
                    disabled: isUploading,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Hidden Input */}
      <input
        type='file'
        ref={fileInputRef}
        className='hidden'
        accept='.kml,.kmz'
        onChange={handleFileChange}
      />

      {/* Main Content Area */}
      <div className='flex flex-col lg:flex-row gap-4 flex-1 min-h-0'>
        {/* LEFT: File List */}
        {/* THE FIX: Restrict mobile height to 35vh so map always has space, allow full stretch on desktop */}
        <div className='w-full lg:w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm flex flex-col overflow-hidden shrink-0 max-h-[35vh] lg:max-h-none'>
          <div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-between items-center shrink-0'>
            <h3 className='font-semibold text-gray-700 dark:text-gray-200'>Saved Files</h3>
            <div className='flex items-center gap-2'>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className='text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500'>
                <option value='date-desc'>Newest First</option>
                <option value='date-asc'>Oldest First</option>
                <option value='alpha-asc'>A to Z</option>
                <option value='alpha-desc'>Z to A</option>
              </select>
              <span className='text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300'>
                {sortedKmlFiles.length}
              </span>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar'>
            {isLoading ? (
              <div className='flex justify-center py-10'>
                <PageSpinner text='Loading list...' />
              </div>
            ) : sortedKmlFiles.length === 0 ? (
              <div className='text-center py-12 px-4'>
                <div className='mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3'>
                  <FiFileText className='text-gray-400' size={24} />
                </div>
                <p className='text-gray-500 dark:text-gray-400 text-sm'>No KML files found.</p>
                {canUpload && (
                  <p className='text-xs text-gray-400 mt-1'>Upload a file to get started.</p>
                )}
              </div>
            ) : (
              sortedKmlFiles.map((file) => {
                const fileName = file.pathname.replace('kml-files/', '');
                const isSelected = selectedKml?.url === file.url;

                return (
                  <div
                    key={file.url}
                    onClick={() => setSelectedKml(file)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all group relative
                      ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/50 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }
                    `}>
                    <div className='flex items-start gap-3 pr-16'>
                      <div
                        className={`p-2 rounded-md shrink-0 ${
                          isSelected
                            ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                        <FiFileText size={18} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p
                          className='font-medium text-sm text-gray-900 dark:text-gray-100 truncate'
                          title={fileName}>
                          {fileName}
                        </p>
                        <div className='flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400'>
                          <span className='shrink-0'>{formatFileSize(file.size)}</span>
                          <span className='w-1 h-1 bg-gray-300 rounded-full shrink-0'></span>
                          <span className='truncate'>{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      className={`
                        absolute right-2 top-2 flex gap-1 bg-white/90 dark:bg-gray-800/90 p-1 rounded-md shadow-sm backdrop-blur-sm border border-gray-100 dark:border-gray-700 transition-opacity duration-200
                        ${
                          isSelected
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100 lg:opacity-0'
                        }
                    `}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.downloadUrl, fileName);
                        }}
                        className='p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors'
                        title='Download'>
                        <FiDownload size={14} />
                      </button>

                      {/* Conditionally render Delete button based on permissions */}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(file);
                          }}
                          className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors'
                          title='Delete (Super Admin)'>
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Map Preview */}
        <div className='flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-1 relative flex flex-col min-h-[300px]'>
          {!selectedKml ? (
            <div className='flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 m-4'>
              <div className='p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4'>
                <FiMap className='w-12 h-12 text-gray-300 dark:text-gray-600' />
              </div>
              <p className='text-lg font-medium text-gray-600 dark:text-gray-300'>
                Select a file to preview
              </p>
              <p className='text-sm text-gray-400'>Click on a KML file from the list on the left</p>
            </div>
          ) : (
            // THE FIX: Outer wrapper with flex-1 forces the map to fill the flex container, solving the collapse issue
            <div className='flex-1 relative w-full h-full rounded-lg overflow-hidden'>
              <div className='absolute top-4 left-14 z-400 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-md shadow-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[60vw]'>
                Previewing: {selectedKml.pathname.replace('kml-files/', '')}
              </div>
              <KmlMap kmlUrl={selectedKml.downloadUrl} />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title='Delete KML File'
        message={`Are you sure you want to delete "${fileToDelete?.pathname.replace(
          'kml-files/',
          '',
        )}"? This action cannot be undone.`}
        onConfirm={() => {
          if (fileToDelete) {
            deleteKml(fileToDelete.url);
            if (selectedKml?.url === fileToDelete.url) setSelectedKml(null);
            setFileToDelete(null);
          }
        }}
        onCancel={() => setFileToDelete(null)}
        type='danger'
        loading={isDeleting}
      />
    </div>
  );
}
