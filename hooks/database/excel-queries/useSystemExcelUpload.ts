// hooks/database/excel-queries/useSystemExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import {
  RpcFunctionArgs,
  UploadColumnMapping,
  UseExcelUploadOptions,
} from '@/hooks/database/queries-type-helpers';
import {
  EnhancedUploadResult,
  logRowProcessing,
  validateValue,
  ValidationError,
} from './excel-helpers';

// Options specific to this upload hook.
export interface SystemUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_systems_complete'>[];
}

type RpcPayload = RpcFunctionArgs<'upsert_system_with_details'>;

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
 * This hook calls the `upsert_system_with_details` RPC for each row, ensuring
 * that data is correctly inserted/updated across both the `systems` and `ring_based_systems` tables.
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
      const recordsToProcess: RpcPayload[] = [];

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

        // Map the processed data to the specific payload format of the RPC function
        const rpcPayload: RpcPayload = {
          p_id: processedData.id as string | undefined,
          p_system_name: processedData.system_name as string,
          p_system_type_id: processedData.system_type_id as string,
          p_node_id: processedData.node_id as string,
          p_status: processedData.status as boolean,
          p_ip_address: processedData.ip_address as string | undefined,
          p_maintenance_terminal_id: processedData.maintenance_terminal_id as string | undefined,
          p_commissioned_on: processedData.commissioned_on as string | undefined,
          p_s_no: processedData.s_no as string | undefined,
          p_remark: processedData.remark as string | undefined,
          p_make: processedData.make as string | undefined,
          p_ring_id: processedData.ring_id as string | undefined,
          p_order_in_ring: processedData.order_in_ring as number | undefined,
        };
        
        recordsToProcess.push(rpcPayload);
        processingLogs.push(logRowProcessing(i, excelRowNumber, originalData, processedData, [], false));
      }

      uploadResult.totalRows = recordsToProcess.length;
      if (recordsToProcess.length === 0) {
        toast.warning("No valid records to upload.");
        return uploadResult;
      }

      toast.info(`Uploading ${recordsToProcess.length} valid records...`);
      for (let i = 0; i < recordsToProcess.length; i++) {
        const record = recordsToProcess[i];
        try {
          const { error } = await supabase.rpc('upsert_system_with_details', record);
          if (error) throw new Error(error.message);
          uploadResult.successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: processingLogs.find(p => JSON.stringify(p.processedData) === JSON.stringify(record))?.excelRowNumber || i + 2,
            data: processingLogs.find(p => JSON.stringify(p.processedData) === JSON.stringify(record))?.originalData || record,
            error: errorMessage,
          });
        }
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} systems saved, but ${uploadResult.errorCount} failed.`);
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} systems.`);
        }
      }

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
