// hooks/database/excel-queries/useSystemExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database, Json } from '@/types/supabase-types';
import {
  EnhancedUploadResult,
  RpcFunctionArgs,
  UploadColumnMapping,
  UseExcelUploadOptions,
  ValidationError,
} from '@/hooks/database/queries-type-helpers';
import { logRowProcessing, validateValue } from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser';

export interface SystemUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_systems_complete'>[];
}

type RpcPayload = RpcFunctionArgs<'upsert_system_with_details'>;

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

      const getHeaderIndex = (name: string): number | undefined =>
        headerMap[String(name).trim().toLowerCase()];

      const dataRows = jsonData.slice(1);
      const recordsToProcess: RpcPayload[] = [];

      toast.info(`Found ${dataRows.length} rows. Validating...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const excelRowNumber = i + 2;
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => {
          originalData[header] = row[idx];
        });

        if (row.every((cell) => cell === null || String(cell).trim() === '')) {
          uploadResult.skippedRows++;
          continue;
        }

        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
          const colIndex = getHeaderIndex(mapping.excelHeader);
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
          continue;
        }

        // Handle JSON for rings
        let ringAssociationsJson: Json | null = null;
        if (
          processedData.ring_associations &&
          typeof processedData.ring_associations === 'string'
        ) {
          try {
            ringAssociationsJson = JSON.parse(processedData.ring_associations);
          } catch (e) {
            console.error(e);
            // Log error but maybe continue? No, validation fail.
            uploadResult.errorCount++;
            continue;
          }
        }

        const rpcPayload: RpcPayload = {
          p_id: (processedData.id as string) || undefined,
          p_system_name: (processedData.system_name as string) ?? 'Unnamed System',
          p_system_type_id: (processedData.system_type_id as string) ?? '',
          p_node_id: (processedData.node_id as string) ?? '',
          p_status: (processedData.status as boolean) ?? true,
          p_is_hub: (processedData.is_hub as boolean) ?? false,
          p_maan_node_id: (processedData.maan_node_id as string | null) || undefined,
          p_ip_address: processedData.ip_address
            ? ((processedData.ip_address as string).split('/')[0] as string | null) || undefined
            : undefined,
          p_maintenance_terminal_id:
            (processedData.maintenance_terminal_id as string | null) || undefined,
          p_commissioned_on: (processedData.commissioned_on as string | null) || undefined,
          p_s_no: (processedData.s_no as string | null) || undefined,
          p_asset_no: (processedData.asset_no as string | null) || undefined, // Added
          p_remark: (processedData.remark as string | null) || undefined,
          p_make: (processedData.make as string | null) || undefined,
          p_ring_associations: ringAssociationsJson,
          p_system_capacity_id: (processedData.system_capacity_id as string | null) || undefined,
        };

        if (!rpcPayload.p_system_type_id || !rpcPayload.p_node_id) {
          uploadResult.errorCount++;
          continue;
        }

        recordsToProcess.push(rpcPayload);
      }

      uploadResult.totalRows = recordsToProcess.length;

      if (recordsToProcess.length === 0) {
        if (allValidationErrors.length > 0) {
          toast.error(`${allValidationErrors.length} rows had validation errors. See console.`);
          console.error('System Upload Validation Errors:', allValidationErrors);
        } else {
          toast.warning('No valid records to upload.');
        }
        return uploadResult;
      }

      // Process with concurrency limit
      const CONCURRENCY_LIMIT = 5;
      toast.info(`Uploading ${recordsToProcess.length} systems in parallel...`);

      // Chunk the array
      for (let i = 0; i < recordsToProcess.length; i += CONCURRENCY_LIMIT) {
        const chunk = recordsToProcess.slice(i, i + CONCURRENCY_LIMIT);

        await Promise.all(
          chunk.map(async (record) => {
            try {
              const { error } = await supabase.rpc('upsert_system_with_details', record);
              if (error) throw error;
              uploadResult.successCount++;
            } catch (error) {
              uploadResult.errorCount++;
              uploadResult.errors.push({
                rowIndex: -1,
                data: record.p_system_name,
                error: error instanceof Error ? error.message : 'Unknown RPC error',
              });
            }
          })
        );

        // Optional: Update progress
        // const progress = Math.round(((i + chunk.length) / recordsToProcess.length) * 100);
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(
            `${uploadResult.successCount} systems saved, ${uploadResult.errorCount} failed.`
          );
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} systems.`);
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['table', 'systems'] });
        queryClient.invalidateQueries({ queryKey: ['table', 'v_systems_complete'] });
        queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_systems_complete'] });
        queryClient.invalidateQueries({ queryKey: ['table', 'ring_based_systems'] });
        queryClient.invalidateQueries({ queryKey: ['systems-data'] });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    },
  });
}