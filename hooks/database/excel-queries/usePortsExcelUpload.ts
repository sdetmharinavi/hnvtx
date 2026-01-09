// hooks/database/excel-queries/usePortsExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import { EnhancedUploadResult, UploadColumnMapping, UseExcelUploadOptions, ValidationError } from '@/hooks/database/queries-type-helpers';
import { generateUUID, validateValue} from './excel-helpers';
import { Ports_managementInsertSchema } from '@/schemas/zod-schemas';
import { parseExcelFile } from '@/utils/excel-parser'; // THE FIX

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

      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs: [], validationErrors: [], skippedRows: 0,
      };

      toast.info('Reading and parsing Excel file...');
      
      // THE FIX: Use off-thread parser
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recordsToUpsert: any[] = [];
      const allValidationErrors: ValidationError[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });

        if (row.every(cell => cell === null || String(cell).trim() === '')) {
            uploadResult.skippedRows++;
            continue;
        }

        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
            if (mapping.dbKey === 'system_id') continue;

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
            continue;
        }

        const recordToUpsert = {
          id: (processedData.id && typeof processedData.id === 'string' && processedData.id.trim() !== '') ? processedData.id : generateUUID(),
          system_id: systemId,
          port: processedData.port as string | null,
          port_type_id: processedData.port_type_id as string | null,
          port_capacity: processedData.port_capacity as string | null,
          sfp_serial_no: processedData.sfp_serial_no as string | null,
          port_utilization: processedData.port_utilization !== undefined ? Boolean(processedData.port_utilization) : false,
          port_admin_status: processedData.port_admin_status !== undefined ? Boolean(processedData.port_admin_status) : false,
          services_count: parseNumber(processedData.services_count),
        };

        recordsToUpsert.push(recordToUpsert);
      }

      uploadResult.totalRows = recordsToUpsert.length;
      if (recordsToUpsert.length > 0) {
        toast.info(`Upserting ${recordsToUpsert.length} port records...`);
        const { error } = await supabase
          .from('ports_management')
          .upsert(recordsToUpsert as Ports_managementInsertSchema[], { onConflict: 'system_id,port' });

        if (error) {
          uploadResult.errorCount = recordsToUpsert.length;
          toast.error(`Import failed: ${error.message}`);
          throw error;
        }

        uploadResult.successCount = recordsToUpsert.length;
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} ports saved, but ${uploadResult.errorCount} failed.`);
        } else if (uploadResult.successCount > 0) {
          toast.success(`Successfully upserted ${uploadResult.successCount} ports.`);
        } else {
          toast.info("No new valid ports were uploaded.");
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['paged-data', 'v_ports_management_complete', { filters: { system_id: variables.systemId } }] });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}