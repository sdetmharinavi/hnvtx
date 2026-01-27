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
} from '@/hooks/database/queries-type-helpers';
import { processExcelData } from './excel-helpers';

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

      toast.info('Processing Excel file...');

      // 1. Process Data using Generic Helper
      const { validRecords, validationErrors, processingLogs, skippedRows, errorCount } =
        await processExcelData(file, columns);

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: errorCount,
        totalRows: validRecords.length + errorCount, // Total non-skipped rows
        errors: [],
        processingLogs,
        validationErrors,
        skippedRows,
      };

      if (validationErrors.length > 0) {
        // Map validation errors to uploadResult.errors
        validationErrors.forEach((err) => {
          uploadResult.errors.push({
            rowIndex: err.rowIndex,
            data: err.data,
            error: err.error,
          });
        });

        if (validRecords.length === 0) {
          toast.error(`${validationErrors.length} validation errors found. Check report.`);
          return uploadResult;
        }
      }

      // 2. Prepare RPC Payload
      const recordsToProcess: RpcPayload[] = [];

      for (const processedData of validRecords) {
        // Handle JSON for rings
        let ringAssociationsJson: Json | null = null;
        if (
          processedData.ring_associations &&
          typeof processedData.ring_associations === 'string'
        ) {
          try {
            ringAssociationsJson = JSON.parse(processedData.ring_associations);
          } catch {
            // If JSON fails, skip this row or log error
            uploadResult.errorCount++;
            uploadResult.errors.push({
              rowIndex: -1,
              data: processedData,
              error: 'Invalid JSON for ring_associations',
            });
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
          p_asset_no: (processedData.asset_no as string | null) || undefined,
          p_remark: (processedData.remark as string | null) || undefined,
          p_make: (processedData.make as string | null) || undefined,
          p_ring_associations: ringAssociationsJson,
          p_system_capacity_id: (processedData.system_capacity_id as string | null) || undefined,
        };

        if (!rpcPayload.p_system_type_id || !rpcPayload.p_node_id) {
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: -1,
            data: processedData,
            error: 'Missing required system_type_id or node_id after mapping',
          });
          continue;
        }

        recordsToProcess.push(rpcPayload);
      }

      if (recordsToProcess.length === 0) {
        toast.warning('No valid records to upload.');
        return uploadResult;
      }

      // 3. Upload Concurrently
      const CONCURRENCY_LIMIT = 5;
      toast.info(`Uploading ${recordsToProcess.length} systems...`);

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
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(
            `${uploadResult.successCount} saved, ${uploadResult.errorCount} failed.`
          );
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} systems.`);
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