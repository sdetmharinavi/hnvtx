// hooks/database/excel-queries/useOfcConnectionsExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import {
  UploadColumnMapping,
  UseExcelUploadOptions,
  TableInsert,
  EnhancedUploadResult,
  ValidationError,
} from '@/hooks/database/queries-type-helpers';
import { validateValue } from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser';

export interface OfcConnectionsUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_ofc_connections_complete'>[];
}

type ConnectionPayload = TableInsert<'ofc_connections'>;

// Helper: Convert JS Date back to Excel Serial Number (Integers only)
// Excel Base Date: Dec 30, 1899
const excelDateToNumber = (date: Date): number => {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const excelBase = Date.UTC(1899, 11, 30);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((utcDate - excelBase) / msPerDay);

  // Safety check: Return diff if it's a plausible fiber number (1 to ~10,000)
  if (diff > 0 && diff < 10000) return diff;
  return 0;
};

/**
 * Robustly parses Excel cell values into integers.
 * Handles: "1900-02-01" -> 32, "1900-01-04" -> 4, numbers, strings.
 */
const parseExcelInt = (val: unknown, fieldName?: string): number => {
  if (val === null || val === undefined || val === '') return 0;

  // 1. Already a number
  if (typeof val === 'number') return Math.round(val);

  // 2. Date Object (from xlsx)
  if (val instanceof Date) {
    return excelDateToNumber(val);
  }

  // 3. String Parsing
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return 0;

    // Check if it looks like a date string (YYYY-MM-DD) starting with 1899 or 1900
    // This catches "1900-02-01", "1899-12-31", etc.
    if (trimmed.match(/^(1899|190\d)-\d{2}-\d{2}/)) {
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        const num = excelDateToNumber(dateObj);
        // console.log(`[ParseInt] Converted DateString '${trimmed}' to ${num}`);
        return num;
      }
    }

    const num = Number(trimmed);
    if (!isNaN(num)) return Math.round(num);
  }

  if (fieldName) console.warn(`[ParseInt] Failed to parse '${fieldName}':`, val);
  return 0;
};

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
      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs: [],
        validationErrors: [],
        skippedRows: 0,
      };

      if (showToasts) toast.info('Reading Excel...');
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
        if (showToasts) toast.warning('No data found.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map((h) => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
      });

      const dataRows = jsonData.slice(1);

      // 1. Fetch Reference Data
      const cablesResp = await supabase.from('ofc_cables').select('id, route_name');
      const cableNameToId = new Map<string, string>();
      if (cablesResp.data) {
        cablesResp.data.forEach((c) => cableNameToId.set(c.route_name.trim().toLowerCase(), c.id));
      }

      const systemsResp = await supabase.from('systems').select('id, system_name');
      const systemNameToId = new Map<string, string>();
      if (systemsResp.data) {
        systemsResp.data.forEach((s) => {
          if (s.system_name) systemNameToId.set(s.system_name.trim().toLowerCase(), s.id);
        });
      }

      const recordsToUpdate: ConnectionPayload[] = [];

      // Step 1: Parsing
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        if (
          row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')
        ) {
          uploadResult.skippedRows++;
          continue;
        }

        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => {
          originalData[header] = row[idx];
        });
        const rowValidationErrors: ValidationError[] = [];
        const processedData: Record<string, unknown> = {};

        for (const mapping of columns) {
          const colIndex = headerMap[mapping.excelHeader.toLowerCase()];
          const rawValue = colIndex !== undefined ? row[colIndex] : undefined;
          let finalValue = mapping.transform ? mapping.transform(rawValue) : rawValue;
          if (typeof finalValue === 'string') finalValue = finalValue.trim();

          if (mapping.required) {
            const err = validateValue(finalValue, mapping.dbKey, true);
            if (err) rowValidationErrors.push({ ...err, rowIndex: i, data: originalData });
          }
          processedData[mapping.dbKey] = finalValue === '' ? null : finalValue;
        }

        // IDs Resolution
        let cableId = processedData.ofc_id as string;
        if (!cableId && processedData.ofc_route_name) {
          cableId =
            cableNameToId.get(String(processedData.ofc_route_name).trim().toLowerCase()) || '';
        }

        let systemId = processedData.system_id as string;
        if (!systemId && processedData.system_name) {
          systemId =
            systemNameToId.get(String(processedData.system_name).trim().toLowerCase()) || '';
        }

        if (!cableId) {
          rowValidationErrors.push({
            rowIndex: i,
            column: 'ofc_route_name',
            value: processedData.ofc_route_name,
            error: 'Cable Route not found',
          });
        }

        // Int Parsing (With updated date fix)
        const fiberSn = parseExcelInt(processedData.fiber_no_sn, 'fiber_no_sn');

        if (!fiberSn || fiberSn <= 0) {
          rowValidationErrors.push({
            rowIndex: i,
            column: 'fiber_no_sn',
            value: processedData.fiber_no_sn,
            error: 'Invalid Fiber No',
          });
        }

        const fiberEn = processedData.fiber_no_en
          ? parseExcelInt(processedData.fiber_no_en)
          : fiberSn;
        const updatedFiberSn = processedData.updated_fiber_no_sn
          ? parseExcelInt(processedData.updated_fiber_no_sn)
          : fiberSn;
        const updatedFiberEn = processedData.updated_fiber_no_en
          ? parseExcelInt(processedData.updated_fiber_no_en)
          : fiberEn;

        // Only parse segment order if present
        const pathSegmentOrder = processedData.path_segment_order
          ? parseExcelInt(processedData.path_segment_order)
          : null;

        if (rowValidationErrors.length > 0) {
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: i + 2,
            data: originalData,
            error: rowValidationErrors.map((e) => e.error).join(', '),
          });
          continue;
        }

        const record: ConnectionPayload = {
          ofc_id: cableId,
          fiber_no_sn: fiberSn,
          fiber_no_en: fiberEn,
          updated_fiber_no_sn: updatedFiberSn,
          updated_fiber_no_en: updatedFiberEn,
          updated_sn_id: (processedData.updated_sn_id as string) || null,
          updated_en_id: (processedData.updated_en_id as string) || null,
          otdr_distance_sn_km: processedData.otdr_distance_sn_km
            ? Number(processedData.otdr_distance_sn_km)
            : null,
          sn_power_dbm: processedData.sn_power_dbm ? Number(processedData.sn_power_dbm) : null,
          otdr_distance_en_km: processedData.otdr_distance_en_km
            ? Number(processedData.otdr_distance_en_km)
            : null,
          en_power_dbm: processedData.en_power_dbm ? Number(processedData.en_power_dbm) : null,
          route_loss_db: processedData.route_loss_db ? Number(processedData.route_loss_db) : null,
          system_id: systemId || null,
          connection_type: (processedData.connection_type as string) || 'straight',
          connection_category: (processedData.connection_category as string) || 'SPLICE_TYPES',
          fiber_role: (processedData.fiber_role as 'working' | 'protection') || null,
          path_segment_order: pathSegmentOrder,
          remark: processedData.remark as string | null,
          updated_at: new Date().toISOString(),
        };

        recordsToUpdate.push(record);
      }

      // --- Step 2 & 3: Fetch Existing UUIDs & Merge ---
      if (recordsToUpdate.length > 0) {
        const uniqueCableIds = Array.from(new Set(recordsToUpdate.map((r) => r.ofc_id)));

        if (showToasts) toast.info(`Resolving IDs for ${recordsToUpdate.length} fibers...`);

        const { data: existingFibers, error: fetchError } = await supabase
          .from('ofc_connections')
          .select('id, ofc_id, fiber_no_sn')
          .in('ofc_id', uniqueCableIds);

        if (fetchError) {
          console.error('Error fetching existing fibers:', fetchError);
          throw new Error('Failed to validate existing records');
        }

        // Create lookup map: "cableId_fiberSn" -> "uuid"
        const fiberIdMap = new Map<string, string>();
        existingFibers?.forEach((f) => {
          fiberIdMap.set(`${f.ofc_id}_${f.fiber_no_sn}`, f.id);
        });

        // Attach UUIDs to payload
        recordsToUpdate.forEach((rec) => {
          const key = `${rec.ofc_id}_${rec.fiber_no_sn}`;
          const existingId = fiberIdMap.get(key);
          if (existingId) {
            rec.id = existingId;
          }
          // If no ID found, it's a new insert (which is fine, upsert handles it if we didn't rely on ID)
          // But since we rely on ID for conflict resolution now, we handle inserts vs updates.
        });
      }

      uploadResult.totalRows = recordsToUpdate.length;

      // --- Step 4: Execute Upsert using ID conflict ---
      if (recordsToUpdate.length > 0) {
        if (showToasts) toast.info(`Committing changes...`);

        // Split into updates (have ID) and inserts (no ID)
        const updates = recordsToUpdate.filter((r) => r.id);
        const inserts = recordsToUpdate.filter((r) => !r.id);

        // 4a. Perform Updates
        if (updates.length > 0) {
          const { error: updateError } = await supabase
          .from('ofc_connections')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert(updates as any, {
              onConflict: 'id', // Safe conflict target
              ignoreDuplicates: false,
            });
          if (updateError) {
            console.error('Update Error:', updateError);
            uploadResult.errorCount += updates.length;
            if (showToasts) toast.error('Update failed: ' + updateError.message);
          } else {
            uploadResult.successCount += updates.length;
          }
        }

        // 4b. Perform Inserts
        // Note: Inserts might fail if (ofc_id, fiber_no_sn) exists but we somehow missed fetching it above.
        // Since we don't have a unique constraint, 'insert' will just create duplicates if data is bad.
        // Ideally you should add the constraint to the DB.
        if (inserts.length > 0) {
          const { error: insertError } = await supabase
          .from('ofc_connections')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(inserts as any);
          if (insertError) {
            console.error('Insert Error:', insertError);
            uploadResult.errorCount += inserts.length;
          } else {
            uploadResult.successCount += inserts.length;
          }
        }
      }
      // --- CRITICAL FIX END ---

      if (uploadResult.successCount > 0) {
        if (showToasts)
          toast.success(`Successfully processed ${uploadResult.successCount} fibers.`);
      }

      return uploadResult;
    },
    onSuccess: (result) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['all-ofc-connections'] });
        queryClient.invalidateQueries({ queryKey: ['ofc_connections-data'] });
      }
    },
  });
}
