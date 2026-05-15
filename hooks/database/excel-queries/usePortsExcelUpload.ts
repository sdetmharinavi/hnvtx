// hooks/database/excel-queries/usePortsExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import {
  EnhancedUploadResult,
  UploadColumnMapping,
  UseExcelUploadOptions,
} from '@/hooks/database/queries-type-helpers';
import { generateUUID, processExcelData } from './excel-helpers';
import { Ports_managementInsertSchema } from '@/schemas/zod-schemas';

export interface PortsUploadOptions {
  file: File;
  columns: UploadColumnMapping<'ports_management'>[];
  systemId: string;
}

const parseNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export function usePortsExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'ports_management'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, PortsUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns, systemId } = uploadOptions;

      toast.info('Processing Excel file...');

      // 1. Process Data
      const { validRecords, validationErrors, processingLogs, skippedRows, errorCount } =
        await processExcelData(file, columns, { system_id: systemId });

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: errorCount,
        totalRows: validRecords.length + errorCount,
        errors: [],
        processingLogs,
        validationErrors,
        skippedRows,
      };

      if (validationErrors.length > 0) {
        validationErrors.forEach((err) => {
          uploadResult.errors.push({
            rowIndex: err.rowIndex,
            data: err.data,
            error: err.error,
          });
        });
        if (validRecords.length === 0) {
           toast.error('Validation errors found. Check report.');
           return uploadResult;
        }
      }

      // 2. Prepare Payload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recordsToUpsert = validRecords.map((processedData: any) => ({
        id:
          processedData.id &&
          typeof processedData.id === 'string' &&
          processedData.id.trim() !== ''
            ? processedData.id
            : generateUUID(),
        system_id: systemId,
        port: processedData.port as string | null,
        port_type_id: processedData.port_type_id as string | null,
        port_capacity: processedData.port_capacity as string | null,
        sfp_serial_no: processedData.sfp_serial_no as string | null,
        port_utilization:
          processedData.port_utilization !== undefined
            ? Boolean(processedData.port_utilization)
            : false,
        port_admin_status:
          processedData.port_admin_status !== undefined
            ? Boolean(processedData.port_admin_status)
            : false,
        services_count: parseNumber(processedData.services_count),
      }));

      // 3. Upsert
      if (recordsToUpsert.length > 0) {
        toast.info(`Upserting ${recordsToUpsert.length} port records...`);
        const { error } = await supabase
          .from('ports_management')
          .upsert(recordsToUpsert as Ports_managementInsertSchema[], {
            onConflict: 'system_id,port',
          });

        if (error) {
          uploadResult.errorCount = recordsToUpsert.length;
          uploadResult.errors.push({ rowIndex: -1, data: 'Batch Error', error: error.message });
          toast.error(`Import failed: ${error.message}`);
          throw error;
        }

        uploadResult.successCount = recordsToUpsert.length;
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(
            `${uploadResult.successCount} ports saved, but ${uploadResult.errorCount} failed.`
          );
        } else if (uploadResult.successCount > 0) {
          toast.success(`Successfully upserted ${uploadResult.successCount} ports.`);
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({
          queryKey: [
            'paged-data',
            'v_ports_management_complete',
            { filters: { system_id: variables.systemId } },
          ],
        });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    },
  });
}