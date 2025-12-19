// hooks/database/excel-queries/useOfcConnectionsExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import {
  UploadColumnMapping,
  UseExcelUploadOptions,
  TableInsert
} from '@/hooks/database/queries-type-helpers';
import {
  EnhancedUploadResult,
  validateValue,
  ValidationError,
} from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser';

export interface OfcConnectionsUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_ofc_connections_complete'>[];
}

// THE FIX: Define payload based on the table structure, not a missing RPC
type ConnectionPayload = TableInsert<'ofc_connections'>;

export function useOfcConnectionsExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'v_ofc_connections_complete'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, OfcConnectionsUploadOptions>({
    ...mutationOptions,
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns } = uploadOptions;
      const uploadResult: EnhancedUploadResult = { successCount: 0, errorCount: 0, totalRows: 0, errors: [], processingLogs: [], validationErrors: [], skippedRows: 0 };
      
      if (showToasts) toast.info('Reading Excel...');
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
        if (showToasts) toast.warning('No data found.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => { headerMap[header.toLowerCase()] = index; });

      const dataRows = jsonData.slice(1);
      
      // 1. Fetch Cable Routes for resolution (Name -> ID)
      const cablesResp = await supabase.from('ofc_cables').select('id, route_name');
      const cableNameToId = new Map<string, string>();
      if (cablesResp.data) {
          cablesResp.data.forEach(c => cableNameToId.set(c.route_name.trim().toLowerCase(), c.id));
      }

      const recordsToUpdate: ConnectionPayload[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        if (row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
            uploadResult.skippedRows++;
            continue;
        }

        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });
        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
           const colIndex = headerMap[mapping.excelHeader.toLowerCase()];
           const rawValue = colIndex !== undefined ? row[colIndex] : undefined;
           let finalValue = mapping.transform ? mapping.transform(rawValue) : rawValue;
           if (typeof finalValue === 'string') finalValue = finalValue.trim();

           // Basic validation
           if (mapping.required) {
               const err = validateValue(finalValue, mapping.dbKey, true);
               if(err) rowValidationErrors.push({ ...err, rowIndex: i, data: originalData });
           }
           
           processedData[mapping.dbKey] = finalValue === '' ? null : finalValue;
        }

        // Resolve Cable ID
        let cableId = processedData.ofc_id as string;
        if (!cableId && processedData.ofc_route_name) {
            cableId = cableNameToId.get(String(processedData.ofc_route_name).trim().toLowerCase()) || '';
        }

        if (!cableId) {
             rowValidationErrors.push({ rowIndex: i, column: 'ofc_route_name', value: processedData.ofc_route_name, error: 'Cable Route not found' });
        }
        
        if (!processedData.fiber_no_sn) {
             rowValidationErrors.push({ rowIndex: i, column: 'fiber_no_sn', value: '', error: 'Fiber Number is required' });
        }

        if (rowValidationErrors.length > 0) {
           uploadResult.errorCount++;
           uploadResult.errors.push({ rowIndex: i+2, data: originalData, error: rowValidationErrors.map(e => e.error).join(', ') });
           continue;
        }

        const record: ConnectionPayload = {
            ofc_id: cableId,
            fiber_no_sn: Number(processedData.fiber_no_sn),
            // The connection logic assumes fiber_no_en matches sn if not explicitly provided differently in physical context
            fiber_no_en: processedData.fiber_no_en ? Number(processedData.fiber_no_en) : Number(processedData.fiber_no_sn),
            
            otdr_distance_sn_km: processedData.otdr_distance_sn_km ? Number(processedData.otdr_distance_sn_km) : null,
            sn_power_dbm: processedData.sn_power_dbm ? Number(processedData.sn_power_dbm) : null,
            otdr_distance_en_km: processedData.otdr_distance_en_km ? Number(processedData.otdr_distance_en_km) : null,
            en_power_dbm: processedData.en_power_dbm ? Number(processedData.en_power_dbm) : null,
            route_loss_db: processedData.route_loss_db ? Number(processedData.route_loss_db) : null,
            remark: processedData.remark as string | null,
            updated_at: new Date().toISOString()
        };
        
        recordsToUpdate.push(record);
      }
      
      uploadResult.totalRows = recordsToUpdate.length;

      if (recordsToUpdate.length > 0) {
          if (showToasts) toast.info(`Updating ${recordsToUpdate.length} fibers...`);
          
          // Use Upsert on the table, matching the unique constraint/index
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await supabase.from('ofc_connections').upsert(recordsToUpdate as any, { 
              onConflict: 'ofc_id, fiber_no_sn', 
              ignoreDuplicates: false 
          });

          if (error) {
              uploadResult.errorCount = recordsToUpdate.length;
              uploadResult.successCount = 0;
              if (showToasts) toast.error("Batch update failed: " + error.message);
          } else {
              uploadResult.successCount = recordsToUpdate.length;
              if (showToasts) toast.success(`Successfully updated ${recordsToUpdate.length} fibers.`);
          }
      }

      return uploadResult;
    },
    onSuccess: (result) => {
        if(result.successCount > 0) {
            queryClient.invalidateQueries({ queryKey: ['all-ofc-connections'] });
            queryClient.invalidateQueries({ queryKey: ['ofc_connections-data'] });
        }
    }
  });
}