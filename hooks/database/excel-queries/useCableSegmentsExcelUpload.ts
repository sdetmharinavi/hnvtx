// hooks/database/excel-queries/useCableSegmentsExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import { UploadColumnMapping, UseExcelUploadOptions } from '@/hooks/database/queries-type-helpers';
import { EnhancedUploadResult, logRowProcessing, validateValue, ValidationError } from './excel-helpers';
import { Cable_segmentsInsertSchema } from '@/schemas/zod-schemas';

export interface CableSegmentsUploadOptions {
  file: File;
  columns: UploadColumnMapping<'cable_segments'>[];
  original_cable_id: string;
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

export function useCableSegmentsExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'cable_segments'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, CableSegmentsUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns, original_cable_id } = uploadOptions;

      const processingLogs: ReturnType<typeof logRowProcessing>[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs, validationErrors: allValidationErrors, skippedRows: 0,
      };

      toast.info('Reading and parsing Excel file for segments...');
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

      const dataRows = jsonData.slice(1);
      const recordsToUpsert: Cable_segmentsInsertSchema[] = [];

      toast.info(`Found ${dataRows.length} rows. Processing segments...`);

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
        const processedData: Record<string, unknown> = { original_cable_id }; // Inject the parent cable ID

        for (const mapping of columns) {
            if (mapping.dbKey === 'original_cable_id') continue; // Skip this, as we're injecting it

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

        if (rowValidationErrors.length > 0) {
            allValidationErrors.push(...rowValidationErrors);
            uploadResult.errorCount++;
            uploadResult.errors.push({
                rowIndex: excelRowNumber,
                data: originalData,
                error: rowValidationErrors.map(e => e.error).join('; '),
            });
            continue;
        }

        recordsToUpsert.push(processedData as Cable_segmentsInsertSchema);
      }

      uploadResult.totalRows = recordsToUpsert.length;

      if (recordsToUpsert.length > 0) {
        toast.info(`Upserting ${recordsToUpsert.length} valid segments...`);
        const { error } = await supabase
          .from('cable_segments')
          .upsert(recordsToUpsert, { onConflict: 'original_cable_id, segment_order' });

        if (error) {
          uploadResult.errorCount = recordsToUpsert.length;
          uploadResult.errors.push({ rowIndex: 0, data: recordsToUpsert, error: error.message });
          throw error;
        }
        
        uploadResult.successCount = recordsToUpsert.length;
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} segments saved, but ${uploadResult.errorCount} failed.`);
        } else if (uploadResult.successCount > 0) {
          toast.success(`Successfully upserted ${uploadResult.successCount} segments.`);
        } else {
          toast.info("No new segments were uploaded.");
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['route-details', variables.original_cable_id] });
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}