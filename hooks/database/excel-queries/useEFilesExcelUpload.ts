// hooks/database/excel-queries/useEFilesExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  EnhancedUploadResult,
  UploadColumnMapping,
} from '@/hooks/database/queries-type-helpers';
import { processExcelData } from './excel-helpers';

interface EFileUploadOptions {
  file: File;
}

// Define the column mapping configuration
const EFILE_COLUMNS: UploadColumnMapping<'v_e_files_extended'>[] = [
  { excelHeader: 'File Number', dbKey: 'file_number', required: true },
  { excelHeader: 'File No', dbKey: 'file_number' },
  { excelHeader: 'File No.', dbKey: 'file_number' },
  
  { excelHeader: 'Subject', dbKey: 'subject', required: true },
  { excelHeader: 'Subject / Description', dbKey: 'subject' },
  
  { excelHeader: 'Description', dbKey: 'description' },
  
  { excelHeader: 'Category', dbKey: 'category', required: true },
  { excelHeader: 'Priority', dbKey: 'priority' },
  { excelHeader: 'Remarks', dbKey: 'description' }, // Map 'Remarks' to description if desc is missing, or use custom logic later
  
  // RPC expects 'initiator_name' string for lookup
  { excelHeader: 'Initiator', dbKey: 'initiator_name', required: true },
  { excelHeader: 'Initiator Name', dbKey: 'initiator_name' },
  { excelHeader: 'Started By', dbKey: 'initiator_name' },
  
  // RPC expects 'current_holder_name' string for lookup
  { excelHeader: 'Current Holder', dbKey: 'current_holder_name' },
  { excelHeader: 'Currently With', dbKey: 'current_holder_name' },
  { excelHeader: 'Holder', dbKey: 'current_holder_name' },
  { excelHeader: 'Current Location', dbKey: 'current_holder_name' },
];

export function useEFilesExcelUpload() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, EFileUploadOptions>({
    mutationFn: async ({ file }) => {
      toast.info('Processing Excel file...');
      
      // 1. Use Generic Processor
      const { 
          validRecords, 
          validationErrors, 
          processingLogs, 
          skippedRows, 
          errorCount: initialErrorCount 
      } = await processExcelData(file, EFILE_COLUMNS);

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: initialErrorCount,
        totalRows: validRecords.length + initialErrorCount,
        errors: [],
        processingLogs,
        validationErrors,
        skippedRows,
      };

      if (validRecords.length === 0 && initialErrorCount === 0) {
        toast.warning('No valid data found in the Excel file.');
        return uploadResult;
      }

      if (validationErrors.length > 0) {
         validationErrors.forEach(err => {
             uploadResult.errors.push({
                 rowIndex: err.rowIndex,
                 data: err.data,
                 error: err.error
             });
         });
      }

      // 2. Prepare Payload for Bulk RPC
      // The RPC bulk_initiate_e_files accepts JSONB where keys match the RPC args
      // (file_number, subject, initiator_name, etc.)
      // validRecords already has the keys mapped via 'dbKey' in EFILE_COLUMNS.
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validPayloads = validRecords.map((r: any) => ({
          file_number: r.file_number,
          subject: r.subject,
          description: r.description,
          category: r.category,
          priority: r.priority,
          initiator_name: r.initiator_name,
          current_holder_name: r.current_holder_name,
          remarks: r.description ? 'Imported from Excel' : r.remarks // Basic remark
      }));

      uploadResult.totalRows = validPayloads.length + initialErrorCount;

      if (validPayloads.length > 0) {
        toast.info(`Uploading ${validPayloads.length} files...`);

        // 3. Call Bulk RPC
        const { data: result, error } = await supabase.rpc('bulk_initiate_e_files', {
          p_files: validPayloads,
        });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = result as any;
        uploadResult.successCount = res.success_count;
        uploadResult.errorCount += res.error_count;

        if (res.errors && res.errors.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.errors.forEach((err: any) => {
            uploadResult.errors.push({ 
                rowIndex: -1, 
                data: err.file_number || 'Unknown File', 
                error: err.error 
            });
          });
        }
      }

      if (uploadResult.errorCount > 0) {
        toast.warning(`${uploadResult.successCount} uploaded, ${uploadResult.errorCount} failed.`);
      } else {
        toast.success(`Successfully uploaded ${uploadResult.successCount} files.`);
      }

      return uploadResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      // Invalidate extended view caches
      queryClient.invalidateQueries({ queryKey: ['v_e_files_extended-data'] });
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });
}