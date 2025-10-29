// hooks/database/excel-queries/useDiaryExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import { UploadColumnMapping, UseExcelUploadOptions } from '@/hooks/database/queries-type-helpers';
import { EnhancedUploadResult, logRowProcessing, validateValue, ValidationError } from './excel-helpers';
import { Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { UserRole } from '@/types/user-roles';

export interface DiaryUploadOptions {
  file: File;
  columns: UploadColumnMapping<'diary_notes'>[];
  currentUserId: string;
  currentUserRole: UserRole | null;
}

const parseExcelFile = (file: File): Promise<unknown[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) throw new Error('File reading failed.');
        const buffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) throw new Error('No worksheet found.');
        const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(new Error(`FileReader error: ${error.type}`));
    reader.readAsArrayBuffer(file);
  });
};

export function useDiaryExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'diary_notes'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, DiaryUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns, currentUserId, currentUserRole } = uploadOptions;
      const isAdmin = currentUserRole === UserRole.ADMIN;

      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs: [], validationErrors: [], skippedRows: 0,
      };

      toast.info('Reading and parsing Excel file...');
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
        toast.warning('No data found in the Excel file.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
      });

      // For admins, the user_id column is required in the Excel file
      if (isAdmin && !headerMap['user_id']) {
          throw new Error('Upload failed: Excel file must contain a "user_id" column for admin uploads.');
      }

      const dataRows = jsonData.slice(1);
      const notesToUpsert: Diary_notesInsertSchema[] = [];

      toast.info(`Found ${dataRows.length} rows. Processing notes...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const excelRowNumber = i + 2;
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });

        if (row.every(cell => cell === null || String(cell).trim() === '')) {
            uploadResult.skippedRows++;
            continue;
        }

        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
            const colIndex = headerMap[mapping.excelHeader.toLowerCase()];
            const rawValue = colIndex !== undefined ? row[colIndex] : undefined;
            let finalValue = mapping.transform ? mapping.transform(rawValue) : rawValue;
            if (typeof finalValue === 'string') finalValue = finalValue.trim();
          
            const validationError = validateValue(finalValue, mapping.dbKey, mapping.required || false);
            if (validationError) {
                rowValidationErrors.push({ ...validationError, rowIndex: i, data: originalData });
            }
            processedData[mapping.dbKey] = finalValue === '' ? null : finalValue;
        }
        
        // Inject or validate user_id based on role
        if (isAdmin) {
            if (!processedData.user_id) {
                rowValidationErrors.push({ rowIndex: i, column: 'user_id', value: processedData.user_id, error: 'user_id is required for admin uploads.' });
            }
        } else {
            processedData.user_id = currentUserId; // Force user_id for non-admins
        }

        if (rowValidationErrors.length > 0) {
            uploadResult.errorCount++;
            uploadResult.errors.push({
                rowIndex: excelRowNumber,
                data: originalData,
                error: rowValidationErrors.map(e => e.error).join('; '),
            });
            continue;
        }
        
        notesToUpsert.push(processedData as Diary_notesInsertSchema);
      }

      uploadResult.totalRows = notesToUpsert.length;
      if (notesToUpsert.length > 0) {
        toast.info(`Upserting ${notesToUpsert.length} valid notes...`);
        const { error } = await supabase
          .from('diary_notes')
          .upsert(notesToUpsert, { onConflict: 'user_id,note_date' });

        if (error) {
          uploadResult.errorCount = notesToUpsert.length;
          throw error;
        }
        
        uploadResult.successCount = notesToUpsert.length;
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} notes saved, but ${uploadResult.errorCount} failed.`);
        } else if (uploadResult.successCount > 0) {
          toast.success(`Successfully upserted ${uploadResult.successCount} notes.`);
        } else {
          toast.info("No new notes were uploaded.");
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diary-notes', variables.currentUserId] });
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Import failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}