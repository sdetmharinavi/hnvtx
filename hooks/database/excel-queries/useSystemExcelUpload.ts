// path: hooks/database/excel-queries/useSystemExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database, Json } from '@/types/supabase-types';
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
        toast.warning('No data found in the Excel file.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map((h) => String(h || '').trim());
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
        excelHeaders.forEach((header, idx) => {
          originalData[header] = row[idx];
        });

        if (row.every((cell) => cell === null || String(cell).trim() === '')) {
          uploadResult.skippedRows++;
          processingLogs.push(
            logRowProcessing(i, excelRowNumber, originalData, {}, [], true, 'Row is empty.')
          );
          continue;
        }

        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
          const colIndex = headerMap[mapping.excelHeader.toLowerCase()];
          const rawValue = colIndex !== undefined ? row[colIndex] : undefined;
          let finalValue = mapping.transform ? mapping.transform(rawValue) : rawValue;
          if (typeof finalValue === 'string') finalValue = finalValue.trim();

          const validationError = validateValue(
            finalValue,
            mapping.dbKey,
            mapping.required || false
          );
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
            error: rowValidationErrors.map((e) => e.error).join('; '),
          });
          processingLogs.push(
            logRowProcessing(
              i,
              excelRowNumber,
              originalData,
              processedData,
              rowValidationErrors,
              true,
              'Validation failed.'
            )
          );
          continue;
        }

        let ringAssociationsJson: Json | null = null;
        if (
          processedData.ring_associations &&
          typeof processedData.ring_associations === 'string'
        ) {
          try {
            ringAssociationsJson = JSON.parse(processedData.ring_associations);
          } catch (e) {
            console.log(e);
            const jsonError = {
              rowIndex: i,
              column: 'ring_associations',
              value: processedData.ring_associations,
              error: 'Invalid JSON format.',
            };
            allValidationErrors.push(jsonError);
            uploadResult.errorCount++;
            uploadResult.errors.push({
              rowIndex: excelRowNumber,
              data: originalData,
              error: 'Invalid JSON in ring_associations.',
            });
            processingLogs.push(
              logRowProcessing(
                i,
                excelRowNumber,
                originalData,
                processedData,
                [jsonError],
                true,
                'JSON parsing failed.'
              )
            );
            continue;
          }
        }

        // --- THIS IS THE DEFINITIVE FIX ---
        // Ensure required string fields are not null by providing a fallback.
        // Convert nulls for optional fields to undefined to match the RPC type.
        const rpcPayload: RpcPayload = {
          p_id: (processedData.id as string) || undefined,
          p_system_name: (processedData.system_name as string) ?? 'Unnamed System', // Fallback for required field
          p_system_type_id: (processedData.system_type_id as string) ?? '', // Fallback for required field
          p_node_id: (processedData.node_id as string) ?? '', // Fallback for required field
          p_status: (processedData.status as boolean) ?? true,
          p_is_hub: (processedData.is_hub as boolean) ?? false,
          p_maan_node_id: (processedData.maan_node_id as string | null) || undefined,
          p_ip_address: processedData.ip_address ? ((processedData.ip_address as string).split('/')[0] as string | null) || undefined : undefined,
          p_maintenance_terminal_id:
            (processedData.maintenance_terminal_id as string | null) || undefined,
          p_commissioned_on: (processedData.commissioned_on as string | null) || undefined,
          p_s_no: (processedData.s_no as string | null) || undefined,
          p_remark: (processedData.remark as string | null) || undefined,
          p_make: (processedData.make as string | null) || undefined,
          p_ring_associations: ringAssociationsJson,
          p_system_capacity_id: (processedData.system_capacity_id as string | null) || undefined,
        };
        // --- END FIX ---

        // Final check for required UUIDs after processing
        if (!rpcPayload.p_system_type_id || !rpcPayload.p_node_id) {
          const missingFields = [
            !rpcPayload.p_system_type_id && 'System Type ID',
            !rpcPayload.p_node_id && 'Node ID',
          ]
            .filter(Boolean)
            .join(', ');

          const validationError = {
            rowIndex: i,
            column: 'system_type_id/node_id',
            value: null,
            error: `Missing required fields: ${missingFields}.`,
          };
          allValidationErrors.push(validationError);
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: excelRowNumber,
            data: originalData,
            error: validationError.error,
          });
          processingLogs.push(
            logRowProcessing(
              i,
              excelRowNumber,
              originalData,
              processedData,
              [validationError],
              true,
              'Missing required IDs.'
            )
          );
          continue;
        }

        recordsToProcess.push(rpcPayload);
        processingLogs.push(
          logRowProcessing(i, excelRowNumber, originalData, processedData, [], false)
        );
      }

      uploadResult.totalRows = recordsToProcess.length;
      if (recordsToProcess.length === 0) {
        if (allValidationErrors.length > 0) {
          toast.error(
            `${allValidationErrors.length} rows had validation errors. See console for details.`
          );
          console.error('System Upload Validation Errors:', allValidationErrors);
        } else {
          toast.warning('No valid records to upload.');
        }
        return uploadResult;
      }

      toast.info(`Uploading ${recordsToProcess.length} valid system records...`);

      for (const record of recordsToProcess) {
        try {
          const { error } = await supabase.rpc('upsert_system_with_details', record);
          if (error) {
            throw new Error(error.message);
          }
          uploadResult.successCount++;
        } catch (error) {
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: -1,
            data: record,
            error: error instanceof Error ? error.message : 'Unknown RPC error',
          });
        }
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(
            `${uploadResult.successCount} systems saved, but ${uploadResult.errorCount} failed. Check console for details.`
          );
          console.error('System Upload Errors:', uploadResult.errors);
        } else {
          toast.success(
            `Successfully saved ${uploadResult.successCount} of ${uploadResult.totalRows} systems.`
          );
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['table', 'systems'] });
        queryClient.invalidateQueries({ queryKey: ['table', 'v_systems_complete'] });
        queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_systems_complete'] });
        queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    },
  });
}
