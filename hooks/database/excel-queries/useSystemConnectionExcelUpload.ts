// hooks/database/excel-queries/useSystemConnectionExcelUpload.ts
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

// A stricter type for the options to ensure parentSystemId is always provided.
export interface SystemConnectionUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_system_connections_complete'>[];
  parentSystemId: string; // The ID of the system these connections belong to.
}

type RpcPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

/**
 * Parses an Excel file and returns its content as a 2D array.
 * @param file The File object to read.
 * @returns A Promise resolving to a 2D array of the sheet data.
 */
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
 * A specialized React hook for uploading System Connections from an Excel file to Supabase.
 * This hook calls the `upsert_system_connection_with_details` RPC for each row, ensuring
 * that data is correctly inserted/updated across `system_connections`, `ports_management`,
 * and `sdh_connections` tables in a single transaction.
 */
export function useSystemConnectionExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'v_system_connections_complete'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, SystemConnectionUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns, parentSystemId } = uploadOptions;

      // THE FIX: Create a helper to robustly convert empty values to undefined for optional RPC args.
      const toUndefined = (val: unknown): string | undefined => {
        if (val === null || val === undefined || String(val).trim() === '') {
          return undefined;
        }
        return String(val);
      };

      const processingLogs: ReturnType<typeof logRowProcessing>[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs,
        validationErrors: allValidationErrors,
        skippedRows: 0,
      };

      toast.info('Reading and parsing Excel file...');
      const jsonData = await parseExcelFile(file);

      if (!jsonData || jsonData.length < 2) {
        toast.warning('No data found in the Excel file (header and at least one data row required).');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
      });
      
      const reinforcedColumns = columns.map(c => 
        c.dbKey === 'media_type_id' ? { ...c, required: true } : c
      );

      const allDataRows = jsonData.slice(1);
      
      const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
        return reinforcedColumns.every(mapping => {
          const colIndex = headerMap[mapping.excelHeader.toLowerCase()];
          const cellValue = colIndex !== undefined ? row[colIndex] : undefined;
          return cellValue === null || cellValue === undefined || String(cellValue).trim() === '';
        });
      };

      const dataRows = allDataRows.filter(row => !isRowEffectivelyEmpty(row));
      uploadResult.skippedRows = allDataRows.length - dataRows.length;

      const recordsToProcess: RpcPayload[] = [];
      
      toast.info(`Found ${dataRows.length} rows. Processing data for upload...`);

      // --- ENHANCED LOGGING ---
      console.log("--- Starting Excel Upload Process ---");
      console.log("Header Map:", headerMap);
      console.log("Column Mapping Config:", reinforcedColumns);
      // --- END LOGGING ---

      // Preload LINK_TYPES for name->id resolution (used by connected_link_type_name)
      const linkTypesResp = await supabase
        .from('lookup_types')
        .select('id, name')
        .eq('category', 'LINK_TYPES');
      const linkTypeNameToId = new Map<string, string>();
      if (!linkTypesResp.error && linkTypesResp.data) {
        for (const lt of linkTypesResp.data) {
          if (lt.name && lt.id) linkTypeNameToId.set(String(lt.name).trim().toLowerCase(), lt.id);
        }
      }

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const excelRowNumber = i + 2;
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });

        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};
        
        for (const mapping of reinforcedColumns) {
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

        if (i < 3) { // Log details for the first 3 rows
          console.log(`--- Processing Row ${excelRowNumber} ---`);
          console.log("Raw Data:", originalData);
          console.log("Processed Data:", processedData);
          console.log("Validation Errors for this row:", rowValidationErrors);
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

        // Derive connected_link_type_id from connected_link_type_name if provided
        let resolvedLinkTypeId: string | undefined = undefined;
        const linkTypeNameRaw = processedData.connected_link_type_name as unknown;
        if (typeof linkTypeNameRaw === 'string' && linkTypeNameRaw.trim() !== '') {
          const key = linkTypeNameRaw.trim().toLowerCase();
          const foundId = linkTypeNameToId.get(key);
          if (!foundId) {
            // If a name was provided but not found, treat as a validation error for this row
            const err: ValidationError = {
              rowIndex: i,
              column: 'connected_link_type_name',
              value: linkTypeNameRaw,
              error: `Unknown link type: ${linkTypeNameRaw}`,
              data: originalData,
            };
            rowValidationErrors.push(err);
          } else {
            resolvedLinkTypeId = foundId;
          }
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

        const rpcPayload: RpcPayload = {
          p_id: toUndefined(processedData.id),
          p_system_id: parentSystemId,
          p_media_type_id: processedData.media_type_id as string,
          p_status: (processedData.status as boolean) ?? true,
          p_sn_id: toUndefined(processedData.sn_id),
          p_en_id: toUndefined(processedData.en_id),
          p_sn_ip: processedData.sn_ip || undefined,
          p_sn_interface: toUndefined(processedData.sn_interface),
          p_en_ip: processedData.en_ip || undefined,
          p_en_interface: toUndefined(processedData.en_interface),
          p_bandwidth: (processedData.bandwidth as string) || undefined,
          p_vlan: toUndefined(processedData.vlan),
          p_commissioned_on: toUndefined(processedData.commissioned_on),
          p_remark: toUndefined(processedData.remark),
          p_customer_name: toUndefined(processedData.customer_name),
          p_bandwidth_allocated: (processedData.bandwidth_allocated as string) || undefined,
          p_working_fiber_in_id: toUndefined(processedData.working_fiber_in_id),
          p_working_fiber_out_id: toUndefined(processedData.working_fiber_out_id),
          p_protection_fiber_in_id: toUndefined(processedData.protection_fiber_in_id),
          p_protection_fiber_out_id: toUndefined(processedData.protection_fiber_out_id),
          p_system_working_interface: toUndefined(processedData.system_working_interface),
          p_system_protection_interface: toUndefined(processedData.system_protection_interface),
          p_connected_link_type_id: resolvedLinkTypeId,
          p_stm_no: toUndefined(processedData.sdh_stm_no),
          p_carrier: toUndefined(processedData.sdh_carrier),
          p_a_slot: toUndefined(processedData.sdh_a_slot),
          p_a_customer: toUndefined(processedData.sdh_a_customer),
          p_b_slot: toUndefined(processedData.sdh_b_slot),
          p_b_customer: toUndefined(processedData.sdh_b_customer),
        };
        
        if (i < 3) {
            console.log(`Final RPC Payload for Row ${excelRowNumber}:`, rpcPayload);
        }
        
        recordsToProcess.push(rpcPayload);
        processingLogs.push(logRowProcessing(i, excelRowNumber, originalData, processedData, [], false));
      }

      uploadResult.totalRows = recordsToProcess.length;

      if (recordsToProcess.length === 0) {
        toast.warning("No valid records found to upload after processing.");
        console.error("All rows failed validation. Final Errors:", allValidationErrors);
        return uploadResult;
      }

      toast.info(`Uploading ${recordsToProcess.length} valid records...`);

      for (let i = 0; i < recordsToProcess.length; i++) {
        const record = recordsToProcess[i];
        try {
          const { error } = await supabase.rpc('upsert_system_connection_with_details', record);
          if (error) {
            throw new Error(error.message);
          }
          uploadResult.successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: processingLogs.find(p => p.processedData === record)?.excelRowNumber || i + 2,
            data: processingLogs.find(p => p.processedData === record)?.originalData || record,
            error: errorMessage,
          });
        }
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} connections saved, but ${uploadResult.errorCount} failed. Check console for details.`);
          console.error("System Connection Upload Errors:", uploadResult.errors);
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} of ${uploadResult.totalRows} connections.`);
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['table', 'system_connections'] });
        queryClient.invalidateQueries({ queryKey: ['table', 'v_system_connections_complete'] });
        queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_system_connections_complete'] });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) {
        toast.error(`Upload failed: ${error.message}`);
      }
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}