// path: hooks/database/excel-queries/usePortsExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import { UploadColumnMapping, UseExcelUploadOptions } from '@/hooks/database/queries-type-helpers';
import { EnhancedUploadResult, generateUUID, validateValue, ValidationError } from './excel-helpers';
import { Ports_managementInsertSchema } from '@/schemas/zod-schemas';

export interface PortsUploadOptions {
  file: File;
  columns: UploadColumnMapping<'ports_management'>[];
  systemId: string;
}

// Helper to parse numeric fields safely
const parseNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const parseExcelFile = (file: File): Promise<unknown[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) throw new Error('File reading failed.');
        const buffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
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
      // Use any here temporarily until Zod schema is regenerated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recordsToUpsert: any[] = [];
      const allValidationErrors: ValidationError[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        // const excelRowNumber = i + 2;
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
        
        // --- CONSTRUCT RECORD WITH NEW FIELDS ---
        const recordToUpsert = {
          // If the ID from the Excel sheet is valid, use it. Otherwise, generate a new one.
          id: (processedData.id && typeof processedData.id === 'string' && processedData.id.trim() !== '') ? processedData.id : generateUUID(),
          system_id: systemId,
          port: processedData.port as string | null,
          port_type_id: processedData.port_type_id as string | null,
          port_capacity: processedData.port_capacity as string | null,
          sfp_serial_no: processedData.sfp_serial_no as string | null,
          // Map new fields. Note: toPgBoolean is handled by mapping.transform if config is correct,
          // but we ensure defaults here.
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
      // The error is already toasted inside the mutationFn for more specific messages
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}