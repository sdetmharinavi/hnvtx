// hooks/database/excel-queries/useEFilesExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { logRowProcessing } from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser'; // THE FIX
import { EnhancedUploadResult, ProcessingLog, ValidationError } from '@/hooks/database/queries-type-helpers';

interface EFileUploadOptions {
  file: File;
}

export function useEFilesExcelUpload() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, EFileUploadOptions>({
    mutationFn: async ({ file }) => {
      const processingLogs: ProcessingLog[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs, validationErrors: allValidationErrors, skippedRows: 0,
      };

      toast.info('Parsing Excel file...');
      // THE FIX: Use off-thread parser
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
          toast.warning('No data found.');
          return uploadResult;
      }

      const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
      const dataRows = jsonData.slice(1);

      const columnMap: Record<string, string> = {
          'file number': 'file_number',
          'file no': 'file_number',
          'file no.': 'file_number',
          'subject': 'subject',
          'description': 'description',
          'subject / description': 'subject',
          'category': 'category',
          'priority': 'priority',
          'remarks': 'remarks',
          'initiator': 'initiator_name',
          'initiator name': 'initiator_name',
          'started by': 'initiator_name',
          'current holder': 'current_holder_name',
          'currently with': 'current_holder_name',
          'holder': 'current_holder_name',
          'current location': 'current_holder_name',
          'current holder name': 'current_holder_name'
      };

      const validPayloads = [];

      for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as unknown[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowData: any = {};
          const rowErrors: ValidationError[] = [];
          let isEmpty = true;

          headers.forEach((header, idx) => {
              if(row[idx]) isEmpty = false;
              const key = columnMap[header] || header;
              if (['file_number', 'subject', 'description', 'category', 'priority', 'remarks', 'initiator_name', 'current_holder_name'].includes(key)) {
                  rowData[key] = row[idx];
              }
          });

          if (isEmpty) {
              uploadResult.skippedRows++;
              continue;
          }

          if (!rowData.file_number) rowErrors.push({ rowIndex: i, column: 'file_number', value: '', error: 'Required' });
          if (!rowData.subject) rowErrors.push({ rowIndex: i, column: 'subject', value: '', error: 'Required' });
          if (!rowData.category) rowErrors.push({ rowIndex: i, column: 'category', value: '', error: 'Required' });
          if (!rowData.initiator_name) rowErrors.push({ rowIndex: i, column: 'initiator_name', value: '', error: 'Required' });

          if (rowErrors.length > 0) {
              allValidationErrors.push(...rowErrors);
              uploadResult.errorCount++;
              uploadResult.errors.push({ rowIndex: i + 2, data: rowData, error: rowErrors.map(e => e.error).join(', ') });
              processingLogs.push(logRowProcessing(i, i+2, rowData, {}, rowErrors, true));
          } else {
              validPayloads.push(rowData);
          }
      }

      uploadResult.totalRows = validPayloads.length;

      if (validPayloads.length > 0) {
          toast.info(`Uploading ${validPayloads.length} files...`);

          const { data: result, error } = await supabase.rpc('bulk_initiate_e_files', {
              p_files: validPayloads
          });

          if (error) throw error;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = result as any;
          uploadResult.successCount = res.success_count;
          uploadResult.errorCount += res.error_count;

          if (res.errors && res.errors.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              res.errors.forEach((err: any) => {
                  uploadResult.errors.push({ rowIndex: -1, data: err.file_number, error: err.error });
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
    },
    onError: (err) => {
        toast.error(`Upload failed: ${err.message}`);
    }
  });
}