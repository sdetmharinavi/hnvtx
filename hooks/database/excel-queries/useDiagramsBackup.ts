// hooks/database/excel-queries/useDiagramsBackup.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";

// --- EXPORT HOOK ---
export function useExportDiagramsBackup() {
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async () => {
      const ExcelJS = (await import('exceljs')).default;
      
      // 1. Fetch Data
      const { data, error } = await supabase.rpc('get_diagrams_backup');
      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const backup = data as any; // { folders: [], files: [] }
      
      if ((!backup.folders || backup.folders.length === 0) && (!backup.files || backup.files.length === 0)) {
        throw new Error("No data found to export.");
      }

      // 2. Create Workbook
      const workbook = new ExcelJS.Workbook();
      
      // SHEET 1: FOLDERS
      const folderSheet = workbook.addWorksheet('Folders');
      folderSheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Created At', key: 'created_at', width: 20 },
        { header: 'Owner Email (Admin)', key: 'owner_email', width: 30 },
      ];
      folderSheet.addRows(backup.folders);

      // SHEET 2: FILES
      const fileSheet = workbook.addWorksheet('Files');
      fileSheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'File Name', key: 'file_name', width: 40 },
        { header: 'Folder Name', key: 'folder_name', width: 30 }, // Friendly Link
        { header: 'Folder ID', key: 'folder_id', width: 36 },     // Precise Link
        { header: 'Type', key: 'file_type', width: 20 },
        { header: 'Size', key: 'file_size', width: 15 },
        { header: 'URL', key: 'file_url', width: 50 },
        { header: 'Route/Public ID', key: 'file_route', width: 30 },
        { header: 'Uploaded At', key: 'uploaded_at', width: 20 },
      ];
      fileSheet.addRows(backup.files);

      // 3. Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Diagrams_Backup_${formatDate(new Date(), { format: 'dd-mm-yyyy' })}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onSuccess: () => toast.success("Diagrams backup downloaded successfully!"),
    onError: (err) => toast.error(`Export failed: ${err.message}`)
  });
}

// --- IMPORT HOOK ---
export function useImportDiagramsBackup() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const ExcelJS = (await import('exceljs')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // 1. Read Folders
      const folderSheet = workbook.getWorksheet('Folders');
      const folders: Record<string, unknown>[] = [];
      
      if (folderSheet) {
        folderSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = {
                id: row.getCell(1).text || undefined,
                name: row.getCell(2).text,
                created_at: row.getCell(3).text,
            };
            if(rowData.name) folders.push(rowData);
        });
      }

      // 2. Read Files
      const fileSheet = workbook.getWorksheet('Files');
      const files: Record<string, unknown>[] = [];
      
      if (fileSheet) {
          fileSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = {
               id: row.getCell(1).text || undefined,
               file_name: row.getCell(2).text,
               folder_name: row.getCell(3).text,
               folder_id: row.getCell(4).text,
               file_type: row.getCell(5).text,
               file_size: row.getCell(6).text,
               file_url: row.getCell(7).text,
               file_route: row.getCell(8).text,
               uploaded_at: row.getCell(9).text,
            };
            if(rowData.file_name) files.push(rowData);
          });
      }

      if (folders.length === 0 && files.length === 0) {
          throw new Error("No valid data found in the Excel file.");
      }

      // 3. Send to RPC
      toast.info(`Restoring ${folders.length} folders and ${files.length} files...`);
      
      const { data, error } = await supabase.rpc('restore_diagrams_backup', {
          p_folders: folders,
          p_files: files
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = data as any;
      toast.success(`Restore Complete: ${res.folders_processed} folders, ${res.files_processed} files.`);
      
      if (res.errors && res.errors.length > 0) {
          toast.warning(`${res.errors.length} items failed. Check console.`);
          console.warn("Restore Errors:", res.errors);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err) => toast.error(`Restore failed: ${err.message}`)
  });
}