// hooks/database/excel-queries/useEFileSystemBackup.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatters';

// --- EXPORT HOOK ---
export function useExportEFileSystem() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const ExcelJS = (await import('exceljs')).default;

      // 1. Fetch Data from RPC
      const { data, error } = await supabase.rpc('get_efile_system_backup');
      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const backup = data as any; // { files: [], movements: [] }

      if (!backup.files || backup.files.length === 0) {
        throw new Error('No data found to export.');
      }

      // 2. Create Workbook
      const workbook = new ExcelJS.Workbook();

      // SHEET 1: FILES
      const fileSheet = workbook.addWorksheet('Files');
      fileSheet.columns = [
        { header: 'File Number', key: 'file_number', width: 20 },
        { header: 'Subject', key: 'subject', width: 40 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Initiator Pers No', key: 'initiator_pers_no', width: 15 },
        { header: 'Holder Pers No', key: 'holder_pers_no', width: 15 },
        { header: 'Created At', key: 'created_at', width: 20 },
        { header: 'Updated At', key: 'updated_at', width: 20 },
      ];
      fileSheet.addRows(backup.files);

      // SHEET 2: MOVEMENTS
      const moveSheet = workbook.addWorksheet('Movements');
      moveSheet.columns = [
        { header: 'File Number', key: 'file_number', width: 20 }, // Link
        { header: 'Action', key: 'action_type', width: 15 },
        { header: 'From Pers No', key: 'from_pers_no', width: 15 },
        { header: 'To Pers No', key: 'to_pers_no', width: 15 },
        { header: 'Remarks', key: 'remarks', width: 40 },
        { header: 'Performed By (Email)', key: 'performed_by_email', width: 25 },
        { header: 'Date', key: 'created_at', width: 20 },
      ];
      moveSheet.addRows(backup.movements);

      // 3. Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${formatDate(new Date(), {
        format: 'dd-mm-yyyy',
      })}_E-Files_Full_Backup.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onSuccess: () => toast.success('System backup downloaded successfully!'),
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });
}

// --- IMPORT HOOK ---
export function useImportEFileSystem() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const ExcelJS = (await import('exceljs')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // 1. Read Files Sheet
      const fileSheet = workbook.getWorksheet('Files');
      if (!fileSheet) throw new Error("Invalid Backup File: Missing 'Files' sheet.");

      const files: Record<string, unknown>[] = [];
      fileSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const rowData = {
          file_number: row.getCell(1).text,
          subject: row.getCell(2).text,
          description: row.getCell(3).text,
          category: row.getCell(4).text,
          priority: row.getCell(5).text,
          status: row.getCell(6).text,
          initiator_pers_no: row.getCell(7).text,
          holder_pers_no: row.getCell(8).text,
          created_at: row.getCell(9).text,
          updated_at: row.getCell(10).text,
        };
        if (rowData.file_number) files.push(rowData);
      });

      // 2. Read Movements Sheet
      const moveSheet = workbook.getWorksheet('Movements');
      const movements: Record<string, unknown>[] = [];

      if (moveSheet) {
        moveSheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          const rowData = {
            file_number: row.getCell(1).text,
            action_type: row.getCell(2).text,
            from_pers_no: row.getCell(3).text === '' ? null : row.getCell(3).text,
            to_pers_no: row.getCell(4).text,
            remarks: row.getCell(5).text,
            performed_by_email: row.getCell(6).text,
            created_at: row.getCell(7).text,
          };
          if (rowData.file_number) movements.push(rowData);
        });
      }

      // 3. Send to RPC
      toast.info(`Restoring ${files.length} files and ${movements.length} history records...`);

      const { data, error } = await supabase.rpc('restore_efile_system_backup', {
        p_files: files,
        p_movements: movements,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = data as any;
      toast.success(
        `Restore Complete: Processed ${res.files_processed} files and ${res.movements_processed} movements.`
      );
      if (res.errors && res.errors.length > 0) {
        toast.warning(`${res.errors.length} items failed. Check console.`);
        console.warn('Restore Errors:', res.errors);
      }
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
    },
    onError: (err) => toast.error(`Restore failed: ${err.message}`),
  });
}
