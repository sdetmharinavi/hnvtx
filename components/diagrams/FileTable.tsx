"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Eye, Download, Trash2, Search, Filter, Grid, List, X } from "lucide-react";
import { useFiles, useDeleteFile } from "@/hooks/database/file-queries";
import "../../app/customuppy.css"; // Custom styles for Uppy
import Image from "next/image";

// Define file type for better type safety
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
}

export function FileTable({ folders, onFileDelete }: FileTableProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>("");
  const [fileSearchTerm, setFileSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Use React Query to fetch files
  const { data: files = [], isLoading, refetch } = useFiles(selectedFolder || undefined);
  const loading = isLoading; // Use loading state from React Query
  const { mutate: deleteFile } = useDeleteFile();

  // Filter folders based on folder search term and sort alphabetically in ascending order
  const filteredFolders = useMemo(() => 
    folders
      .filter(folder =>
        folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [folders, folderSearchTerm]
  );

  // Reset selected folder when it's not in filtered results
  useEffect(() => {
    if (selectedFolder && folderSearchTerm) {
      const isFolderVisible = filteredFolders.some(folder => folder.id === selectedFolder);
      if (!isFolderVisible) {
        setSelectedFolder(null);
      }
    }
  }, [selectedFolder, folderSearchTerm, filteredFolders]);


  // Sort and filter files based on user preferences
  const processedFiles = useMemo(() => {
    return (files as FileType[])
      .filter((file) => {
        const matchesSearch = file.file_name.toLowerCase().includes(fileSearchTerm.toLowerCase());
        const matchesType = fileTypeFilter === "all" || file.file_type?.includes(fileTypeFilter);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === "name") {
          comparison = a.file_name.localeCompare(b.file_name);
        } else if (sortBy === "type") {
          comparison = (a.file_type || "").localeCompare(b.file_type || "");
        } else {
          // Sort by date
          const dateA = new Date(a.uploaded_at || 0).getTime();
          const dateB = new Date(b.uploaded_at || 0).getTime();
          comparison = dateA - dateB;
        }
        
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [files, fileSearchTerm, fileTypeFilter, sortBy, sortOrder]);

  const handleView = (file: FileType) => {
    if (file.file_type === "application/pdf") {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.file_url)}&embedded=true`;
      window.open(googleViewerUrl, '_blank');
    } else {
      window.open(file.file_url, '_blank');
    }
  };

  const handleDelete = (file: FileType) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    setDeletingFile(file.id);
    deleteFile(
      { id: file.id, folderId: selectedFolder },
      {
        onSuccess: () => {
          onFileDelete?.();
          refetch();
        },
        onError: (error) => {
          console.error("Delete error:", error);
          alert("Failed to delete file");
        },
        onSettled: () => {
          setDeletingFile(null);
        }
      }
    );
  };

  const getDownloadUrl = (file: FileType) => {
    if (file.file_type === "application/pdf") {
      return file.file_url.replace("/upload/", "/upload/fl_attachment/");
    }
    return file.file_url;
  };

  const getFileIcon = (fileType: string = '') => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("document") || fileType.includes("word")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📈";
    return "📎";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to truncate folder names with ellipsis
  const truncateFolderName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Clear search functions
  const clearFolderSearch = useCallback(() => {
    setFolderSearchTerm("");
  }, []);

  const clearFileSearch = useCallback(() => {
    setFileSearchTerm("");
  }, []);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    return (files as FileType[])
      .filter((file) => {
        const matchesSearch = file.file_name.toLowerCase().includes(fileSearchTerm.toLowerCase());
        const matchesType = fileTypeFilter === "all" || file.file_type.startsWith(fileTypeFilter);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let aValue: string | Date;
        let bValue: string | Date;
        
        switch (sortBy) {
          case "name":
            aValue = a.file_name.toLowerCase();
            bValue = b.file_name.toLowerCase();
            break;
          case "type":
            aValue = a.file_type || '';
            bValue = b.file_type || '';
            break;
          case "date":
          default:
            aValue = new Date(a.uploaded_at || 0);
            bValue = new Date(b.uploaded_at || 0);
            break;
        }
        
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [files, fileSearchTerm, fileTypeFilter, sortBy, sortOrder]);

  const getFileTypeOptions = () => {
    const types = [...new Set((files as FileType[]).map(file => file.file_type.split("/")[0]))];
    return types.map(type => ({
      value: type,
      label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown',
    }));
  };

  return (
    <div className="mt-8 space-y-6">
      <h2
        className={`text-xl font-semibold dark:text-white text-black`}
      >
        UPLOADED DIAGRAMS
      </h2>
      {/* Files Display */}
      {selectedFolder && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium dark:text-white text-black`}>
              Files ({filteredAndSortedFiles.length})
            </h3>
            {loading && (
              <div className="text-sm text-gray-500">Loading files...</div>
            )}
          </div>

          {/* File Search */}
          <div className="relative max-w-md">
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedFiles.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-lg dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 bg-white hover:bg-gray-50`}
                  >
                    {/* File Preview */}
                    <div className="aspect-square mb-3 overflow-hidden rounded">
                      {file.file_type.includes("image") ? (
                        <Image
                          src={file.file_url}
                          alt={file.file_name}
                          width={200}
                          height={200}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center dark:bg-gray-600 bg-gray-100`}>
                          <div className="text-center">
                            <div className="mb-2 text-3xl">{getFileIcon(file.file_type)}</div>
                            <p className="text-xs text-gray-500 uppercase">
                              {file.file_type.split("/")[1] || "FILE"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="space-y-1">
                      <p
                        className={`truncate text-sm font-medium dark:text-white text-black`}
                        title={file.file_name}
                      >
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(file.uploaded_at)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleView(file)}
                        title="View"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-black p-1.5 text-white transition-all"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <a
                        href={getDownloadUrl(file)}
                        download={file.file_name}
                        title="Download"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-black p-1.5 text-white transition-all"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingFile === file.id}
                        title="Delete"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-red-600 p-1.5 text-white transition-all disabled:opacity-50"
                      >
                        {deletingFile === file.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className={`dark:bg-gray-700 bg-gray-50 px-4 py-2 border-b`}>
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
                <div className={`divide-y dark:divide-gray-600 divide-gray-200`}>
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group px-4 py-3 transition-colors hover:bg-gray-50`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center gap-3">
                          <span className="text-lg">{getFileIcon(file.file_type)}</span>
                          <span
                            className={`truncate text-sm dark:text-white text-black`}
                            title={file.file_name}
                          >
                            {file.file_name}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 uppercase">
                          {file.file_type.split("/")[1] || "Unknown"}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500">
                          {formatDate(file.uploaded_at)}
                        </div>
                        <div className="col-span-1 flex gap-1">
                          <button
                            onClick={() => handleView(file)}
                            title="View"
                            className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={getDownloadUrl(file)}
                            download={file.file_name}
                            title="Download"
                            className={`p-1 text-gray-400 hover:text-green-500 transition-colors`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingFile === file.id}
                            title="Delete"
                            className={`p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50`}
                          >
                            {deletingFile === file.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className={`text-center py-12 dark:text-gray-400 text-gray-500`}>
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-medium">No files found</p>
              <p className="text-sm">
                {fileSearchTerm || fileTypeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload some files to get started."}
              </p>
            </div>
          )}
        </div>
      )}
      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Folder Search */}
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
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded border overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode("grid"); }}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              viewMode === "grid"
                ? "dark:bg-blue-700 dark:text-white bg-blue-600 text-white"
                : "dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Grid className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode("list"); }}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              viewMode === "list"
                ? "dark:bg-blue-700 dark:text-white bg-blue-600 text-white"
                : "dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <List className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* File Type Filter */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFileTypeFilter("all")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              fileTypeFilter === "all"
                ? "dark:bg-blue-700 dark:text-white bg-blue-600 text-white"
                : "dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Files ({files.length})
          </button>
          {getFileTypeOptions().map((option) => {
            const count = files.filter(file => file.file_type.startsWith(option.value)).length;
            // console.log(`File type: ${option.value}, Count: ${count}`, "label:", option.label);
            
            return (
              <button
                key={option.value}
                onClick={() => setFileTypeFilter(option.value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  fileTypeFilter === option.value
                    ? "dark:bg-blue-700 dark:text-white bg-blue-600 text-white"
                    : "dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.label === "Application" ? "Pdf" : option.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Folder Selection */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium dark:text-white text-black`}>
          Select Folder to View Files
        </h3>
        
        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredFolders.map((folder) => (
              <div key={folder.id} className="group relative">
                <button
                  className={`w-full p-4 rounded border text-left transition-all hover:shadow-md ${
                    selectedFolder === folder.id
                      ? "dark:border-blue-500 dark:bg-blue-900 shadow-lg"
                      : "dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 bg-white hover:bg-gray-50"
                  } dark:text-white text-black`}
                  onClick={() => setSelectedFolder(folder.id)}
                  title={folder.name} // Show full name on hover
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">📁</span>
                      <span className="font-medium text-sm leading-tight break-words line-clamp-2 min-w-0">
                        {folder.name}
                      </span>
                    </div>
                    {selectedFolder === folder.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded flex-shrink-0 ml-2">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Tooltip for long folder names */}
                {folder.name.length > 25 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
                    {folder.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 dark:text-gray-400 text-gray-500`}>
            {folderSearchTerm ? "No folders found matching your search." : "No folders available."}
          </div>
        )}
      </div>


    </div>
  );
}