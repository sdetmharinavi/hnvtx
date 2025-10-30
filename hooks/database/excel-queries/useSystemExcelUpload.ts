// hooks/database/excel-queries/useSystemExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import {
  UploadColumnMapping,
  UseExcelUploadOptions,
} from '@/hooks/database/queries-type-helpers';
import {
  EnhancedUploadResult,
  logRowProcessing,
  validateValue,
  ValidationError,
} from './excel-helpers';
import { Ring_based_systemsInsertSchema, SystemsInsertSchema } from '@/schemas/zod-schemas';

// Options specific to this upload hook.
export interface SystemUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_systems_complete'>[];
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

/**
 * A specialized React hook for uploading Systems from an Excel file to Supabase.
 * This hook now uses efficient batch upserts instead of row-by-row RPC calls.
 */
export function useSystemExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'v_systems_complete'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, SystemUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns } = uploadOptions;

      const processingLogs: ReturnType<typeof logRowProcessing>[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs, validationErrors: allValidationErrors, skippedRows: 0,
      };

      toast.info('Reading and parsing Excel file...');
      const jsonData = await parseExcelFile(file);

      if (!jsonData || jsonData.length < 2) {
        toast.warning('No data found in the Excel file.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
      });

      const dataRows = jsonData.slice(1);
      const systemsToUpsert: SystemsInsertSchema[] = [];
      const ringDataToUpsert: Ring_based_systemsInsertSchema[] = [];

      toast.info(`Found ${dataRows.length} rows. Processing data...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const excelRowNumber = i + 2;
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });

        if (row.every(cell => cell === null || String(cell).trim() === '')) {
          uploadResult.skippedRows++;
          processingLogs.push(logRowProcessing(i, excelRowNumber, originalData, {}, [], true, 'Row is empty.'));
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

        if (rowValidationErrors.length > 0) {
          allValidationErrors.push(...rowValidationErrors);
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: excelRowNumber,
            data: originalData,
            error: rowValidationErrors.map(e => e.error).join('; '),
          });
          processingLogs.push(logRowProcessing(i, excelRowNumber, originalData, processedData, rowValidationErrors, true, 'Validation failed.'));
          continue;
        }

        // Separate data for the two tables
        const systemRecord: SystemsInsertSchema = {
          id: processedData.id as string,
          system_name: processedData.system_name as string,
          system_type_id: processedData.system_type_id as string,
          node_id: processedData.node_id as string,
          status: processedData.status as boolean,
          is_hub: processedData.is_hub as boolean, // Correctly include is_hub
          maan_node_id: processedData.maan_node_id as string | null,
          ip_address: processedData.ip_address as string | null,
          maintenance_terminal_id: processedData.maintenance_terminal_id as string | null,
          commissioned_on: processedData.commissioned_on as string | null,
          s_no: processedData.s_no as string | null,
          remark: processedData.remark as string | null,
          make: processedData.make as string | null,
        };
        systemsToUpsert.push(systemRecord);

        if (processedData.ring_id) {
            const ringRecord: Ring_based_systemsInsertSchema = {
                system_id: processedData.id as string,
                ring_id: processedData.ring_id as string,
                order_in_ring: processedData.order_in_ring as number | null,
            };
            ringDataToUpsert.push(ringRecord);
        }
        
        processingLogs.push(logRowProcessing(i, excelRowNumber, originalData, processedData, [], false));
      }

      uploadResult.totalRows = systemsToUpsert.length;
      if (systemsToUpsert.length === 0) {
        toast.warning("No valid records to upload.");
        return uploadResult;
      }

      toast.info(`Uploading ${systemsToUpsert.length} valid system records...`);

      // Batch Upsert for Systems table
      const { error: systemError } = await supabase.from('systems').upsert(systemsToUpsert, { onConflict: 'id' });
      if (systemError) {
        toast.error(`System Upload Failed: ${systemError.message}`);
        throw systemError;
      }

      // Batch Upsert for Ring-based Systems table
      if (ringDataToUpsert.length > 0) {
        toast.info(`Updating ${ringDataToUpsert.length} ring associations...`);
        const { error: ringError } = await supabase.from('ring_based_systems').upsert(ringDataToUpsert, { onConflict: 'system_id' });
        if (ringError) {
          toast.warning(`Ring association update failed: ${ringError.message}. Systems were saved.`);
          // We don't throw here, as the main data was saved.
        }
      }

      uploadResult.successCount = systemsToUpsert.length;

      if (showToasts) {
        toast.success(`Successfully saved ${uploadResult.successCount} of ${uploadResult.totalRows} systems.`);
      }

      console.log(uploadResult);
      

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', 'systems'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'v_systems_complete'] });
      queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_systems_complete'] });
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}