"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Eye, Download, Trash2, Search, Grid, List, X, RefreshCw, FileSpreadsheet, Folder } from "lucide-react";
import { useFiles, useDeleteFile } from "@/hooks/database/file-queries";
import "../../app/customuppy.css"; 
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";
import { buildColumnConfig } from "@/constants/table-column-keys";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { Row, TableOrViewName } from "@/hooks/database";
import { Button } from "@/components/common/ui";

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

export function FileTable({ folders, onFileDelete, folderId }: FileTableProps) {
  const supabase = createClient();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId || null);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>("");
  const [fileSearchTerm, setFileSearchTerm] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    if (folderId !== undefined) setSelectedFolder(folderId);
  }, [folderId]);

  const { data: files = [], isLoading, refetch } = useFiles(selectedFolder || undefined);
  const loading = isLoading;
  const { mutate: deleteFile } = useDeleteFile();

  // Configure Excel Download for Files
  const { mutate: exportFiles, isPending: isExportingFiles } = useTableExcelDownload(supabase, "files");
  
  // ADDED: Configure Excel Download for Folders
  const { mutate: exportFolders, isPending: isExportingFolders } = useTableExcelDownload(supabase, "folders");

  const handleExportFiles = () => {
    const selectedFolderName = folders.find(f => f.id === selectedFolder)?.name || "all_files";
    const fileName = `diagrams_${selectedFolderName}_${formatDate(new Date().toISOString(), { format: "dd-mm-yyyy" })}.xlsx`;
    const columns = buildColumnConfig("files") as Column<Row<TableOrViewName>>[];

    exportFiles({
      fileName,
      sheetName: "Diagrams",
      columns,
      filters: selectedFolder ? { folder_id: selectedFolder } : {},
    });
  };

  // ADDED: Export Folders Handler
  const handleExportFolders = () => {
    const fileName = `folders_structure_${formatDate(new Date().toISOString(), { format: "dd-mm-yyyy" })}.xlsx`;
    const columns = buildColumnConfig("folders") as Column<Row<TableOrViewName>>[];
    
    exportFolders({
      fileName,
      sheetName: "Folders",
      columns,
    });
  };

  const filteredFolders = useMemo(() => 
    folders
      .filter(folder =>
        folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [folders, folderSearchTerm]
  );

  useEffect(() => {
    if (selectedFolder && folderSearchTerm) {
      const isFolderVisible = filteredFolders.some(folder => folder.id === selectedFolder);
      if (!isFolderVisible) {
        setSelectedFolder(null);
      }
    }
  }, [selectedFolder, folderSearchTerm, filteredFolders]);

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
          toast.success("File deleted successfully");
          onFileDelete?.();
          refetch();
        },
        onError: (error) => {
          console.error("Delete error:", error);
          toast.error("Failed to delete file");
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

  const formatDisplayDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFolderSearch = useCallback(() => {
    setFolderSearchTerm("");
  }, []);

  const clearFileSearch = useCallback(() => {
    setFileSearchTerm("");
  }, []);

  const filteredAndSortedFiles = useMemo(() => {
    return (files as FileType[])
      .filter((file) => {
        const matchesSearch = file.file_name.toLowerCase().includes(fileSearchTerm.toLowerCase());
        const matchesType = fileTypeFilter === "all" || file.file_type.startsWith(fileTypeFilter);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const aDate = new Date(a.uploaded_at || 0).getTime();
        const bDate = new Date(b.uploaded_at || 0).getTime();
        return bDate - aDate;
      });
  }, [files, fileSearchTerm, fileTypeFilter]);

  const getFileTypeOptions = () => {
    const types = [...new Set((files as FileType[]).map(file => file.file_type.split("/")[0]))];
    return types.map(type => ({
      value: type,
      label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown',
    }));
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold dark:text-white text-black`}>
          UPLOADED DIAGRAMS
        </h2>
        {/* ADDED: Export Folders Button */}
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportFolders}
            disabled={isExportingFolders}
            leftIcon={<Folder className="w-4 h-4" />}
        >
            {isExportingFolders ? "Exporting..." : "Export Folders"}
        </Button>
      </div>
      
      {selectedFolder && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className={`text-lg font-medium dark:text-white text-black`}>
              Files ({filteredAndSortedFiles.length})
            </h3>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={loading}
                leftIcon={<RefreshCw className={loading ? "animate-spin" : ""} />}
              >
                Refresh
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportFiles}
                disabled={isExportingFiles || loading || filteredAndSortedFiles.length === 0}
                leftIcon={<FileSpreadsheet />}
              >
                {isExportingFiles ? "Exporting..." : "Export Files"}
              </Button>
            </div>
          </div>

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

                    <div className="space-y-1">
                      <p
                        className={`truncate text-sm font-medium dark:text-white text-black`}
                        title={file.file_name}
                      >
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDisplayDate(file.uploaded_at)}
                      </p>
                    </div>

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
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`dark:bg-gray-700 bg-gray-50 px-4 py-2 border-b border-gray-200 dark:border-gray-600`}>
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className={`divide-y dark:divide-gray-600 divide-gray-200`}>
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center gap-3">
                          <span className="text-lg">{getFileIcon(file.file_type)}</span>
                          <span
                            className={`truncate text-sm dark:text-white text-black font-medium`}
                            title={file.file_name}
                          >
                            {file.file_name}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 uppercase">
                          {file.file_type.split("/")[1] || "Unknown"}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                          {formatDisplayDate(file.uploaded_at)}
                        </div>
                        <div className="col-span-3 flex gap-2 justify-end">
                          <button
                            onClick={() => handleView(file)}
                            title="View"
                            className={`p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={getDownloadUrl(file)}
                            download={file.file_name}
                            title="Download"
                            className={`p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingFile === file.id}
                            title="Delete"
                            className={`p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50`}
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
            <div className={`text-center py-12 dark:text-gray-400 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg`}>
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
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex rounded border overflow-hidden dark:border-gray-600">
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
                  title={folder.name}
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">📁</span>
                      <span className="font-medium text-sm leading-tight wrap-break-words line-clamp-2 min-w-0">
                        {folder.name}
                      </span>
                    </div>
                    {selectedFolder === folder.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded shrink-0 ml-2">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
                
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