// components/diagrams/FileTable.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Eye, Download, Trash2, Search, Grid, List, X, RefreshCw } from 'lucide-react';
import { useFiles, useDeleteFile } from '@/hooks/database/file-queries';
import '../../app/customuppy.css';
import Image from 'next/image';
// import { toast } from "sonner"; // Removed unused import if we rely on hook toasts
import { Button } from '@/components/common/ui';
import { FancyEmptyState } from '../common/ui/FancyEmptyState';
import { ConfirmModal } from '@/components/common/ui';

interface FileType {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  uploaded_at: string;
  [key: string]: unknown;
}

interface FileTableProps {
  folders: Array<{ id: string; name: string }>;
  onFileDelete?: () => void;
  folderId?: string | null;
  onFolderSelect?: (id: string | null) => void;
  isLoading?: boolean;
  canDelete: boolean;
}

export function FileTable({
  folders,
  onFileDelete,
  folderId,
  onFolderSelect,
  canDelete,
}: FileTableProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId || null);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>('');
  const [fileSearchTerm, setFileSearchTerm] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Delete Modal State
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null);

  // Sync prop change to state
  useEffect(() => {
    if (folderId !== undefined) setSelectedFolder(folderId);
  }, [folderId]);

  const handleFolderClick = (id: string) => {
    setSelectedFolder(id);
    if (onFolderSelect) onFolderSelect(id);
  };

  const { data: files = [], isLoading, refetch } = useFiles(selectedFolder || undefined);
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();

  const filteredFolders = useMemo(
    () =>
      folders
        .filter((folder) => folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [folders, folderSearchTerm]
  );

  const handleView = (file: FileType) => {
    if (file.file_type === 'application/pdf') {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
        file.file_url
      )}&embedded=true`;
      window.open(googleViewerUrl, '_blank');
    } else {
      window.open(file.file_url, '_blank');
    }
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;

    deleteFile(
      { id: fileToDelete.id, folderId: selectedFolder },
      {
        onSuccess: () => {
          onFileDelete?.();
          refetch();
          setFileToDelete(null);
        },
        // Error handling is done in the hook via toast
      }
    );
  };

  const getDownloadUrl = (file: FileType) => {
    if (file.file_type === 'application/pdf') {
      return file.file_url.replace('/upload/', '/upload/fl_attachment/');
    }
    return file.file_url;
  };

  const getFileIcon = (fileType: string = '') => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📈';
    return '📎';
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown Date';
    }
  };

  const clearFolderSearch = useCallback(() => setFolderSearchTerm(''), []);
  const clearFileSearch = useCallback(() => setFileSearchTerm(''), []);

  const filteredAndSortedFiles = useMemo(() => {
    return (files as FileType[])
      .filter((file) => {
        const matchesSearch = file.file_name.toLowerCase().includes(fileSearchTerm.toLowerCase());
        const matchesType = fileTypeFilter === 'all' || file.file_type.startsWith(fileTypeFilter);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const aDate = new Date(a.uploaded_at || 0).getTime();
        const bDate = new Date(b.uploaded_at || 0).getTime();
        return bDate - aDate;
      });
  }, [files, fileSearchTerm, fileTypeFilter]);

  const getFileTypeOptions = () => {
    const types = [...new Set((files as FileType[]).map((file) => file.file_type.split('/')[0]))];
    return types.map((type) => ({
      value: type,
      label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            value={folderSearchTerm}
            onChange={(e) => setFolderSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded border text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {folderSearchTerm && (
            <button
              onClick={clearFolderSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* File List Section */}
      {selectedFolder && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3
              className={`text-lg font-medium dark:text-white text-black flex items-center gap-2`}
            >
              Files{' '}
              <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {filteredAndSortedFiles.length}
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <div className="flex rounded border overflow-hidden dark:border-gray-600 bg-white dark:bg-gray-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-gray-100 dark:bg-gray-700 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-gray-100 dark:bg-gray-700 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                title="Refresh Files"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={fileSearchTerm}
                onChange={(e) => setFileSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 rounded border text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fileSearchTerm && (
                <button
                  onClick={clearFileSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            {files.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    fileTypeFilter === 'all'
                      ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  All
                </button>
                {getFileTypeOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFileTypeFilter(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      fileTypeFilter === option.value
                        ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedFiles.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAndSortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 border-gray-200 bg-white hover:bg-gray-50`}
                  >
                    <div className="aspect-square mb-3 overflow-hidden rounded bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
                      {file.file_type.includes('image') ? (
                        <Image
                          src={file.file_url}
                          alt={file.file_name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                      ) : (
                        <span className="text-4xl">{getFileIcon(file.file_type)}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p
                        className={`truncate text-sm font-medium dark:text-white text-black`}
                        title={file.file_name}
                      >
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDisplayDate(file.uploaded_at)}</p>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleView(file)}
                        title="View"
                        className="bg-black/70 hover:bg-black rounded p-1.5 text-white backdrop-blur-sm"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <a
                        href={getDownloadUrl(file)}
                        download={file.file_name}
                        title="Download"
                        className="bg-black/70 hover:bg-black rounded p-1.5 text-white backdrop-blur-sm"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                      {canDelete && (
                        <button
                          onClick={() => setFileToDelete(file)}
                          title="Delete"
                          className="bg-red-600/90 hover:bg-red-700 rounded p-1.5 text-white backdrop-blur-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div
                  className={`dark:bg-gray-800 bg-gray-50 px-4 py-2 border-b border-gray-200 dark:border-gray-700`}
                >
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-3">Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>
                <div
                  className={`divide-y dark:divide-gray-700 divide-gray-200 bg-white dark:bg-gray-900`}
                >
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <span className="text-xl">{getFileIcon(file.file_type)}</span>
                          <span
                            className={`truncate text-sm dark:text-white text-black font-medium`}
                            title={file.file_name}
                          >
                            {file.file_name}
                          </span>
                        </div>
                        <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 uppercase truncate">
                          {file.file_type.split('/')[1] || 'Unknown'}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                          {formatDisplayDate(file.uploaded_at)}
                        </div>
                        <div className="col-span-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleView(file)}
                            title="View"
                            className={`p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={getDownloadUrl(file)}
                            download={file.file_name}
                            title="Download"
                            className={`p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => setFileToDelete(file)}
                              title="Delete"
                              className={`p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <FancyEmptyState
              title="No files found"
              description={
                fileSearchTerm ? 'Try adjusting your search criteria' : 'This folder is empty'
              }
            />
          )}
        </div>
      )}

      {/* Folder Grid */}
      {filteredFolders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredFolders.map((folder) => (
            <div key={folder.id} className="group relative">
              <button
                className={`w-full p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                  selectedFolder === folder.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 dark:border-blue-500/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                } dark:text-white text-black`}
                onClick={() => handleFolderClick(folder.id)}
                title={folder.name}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">📁</span>
                  <span className="font-medium text-sm leading-tight wrap-wrap-break-word line-clamp-2 min-w-0">
                    {folder.name}
                  </span>
                  {selectedFolder === folder.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 dark:text-gray-400 text-gray-500`}>
          {folderSearchTerm ? 'No folders found matching your search.' : 'No folders available.'}
        </div>
      )}

      <ConfirmModal
        isOpen={!!fileToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.file_name}"?`}
        confirmText="Delete"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
