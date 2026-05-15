// hooks/database/excel-queries/useOfcCableExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Database } from '@/types/supabase-types';
import {
  EnhancedUploadResult,
  UploadColumnMapping,
  UseExcelUploadOptions,
  ValidationError,
} from '@/hooks/database/queries-type-helpers';
import { processExcelData } from './excel-helpers';
import { Ofc_cablesInsertSchema } from '@/schemas/zod-schemas';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance'; // ADDED

export interface OfcCableUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_ofc_cables_complete'>[];
}

export function useOfcCableExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'v_ofc_cables_complete'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, OfcCableUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns } = uploadOptions;

      toast.info('Processing Excel file & fetching references...');

      // 1. Process Data using Generic Helper
      const { validRecords, validationErrors, processingLogs, skippedRows, errorCount } =
        await processExcelData(file, columns);

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: errorCount,
        totalRows: validRecords.length + errorCount,
        errors:[],
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
          toast.error(`${validationErrors.length} validation errors found. Check report.`);
          return uploadResult;
        }
      }

      // 2. Fetch Reference Dictionaries (Nodes, Lookups, Areas)
      const[
        { data: nodes },
        { data: lookups },
        { data: areas }
      ] = await Promise.all([
        supabase.from('nodes').select('id, name'),
        supabase.from('lookup_types').select('id, name, category'),
        supabase.from('maintenance_areas').select('id, name')
      ]);

      const nodeMap = new Map<string, string>();
      nodes?.forEach(n => n.name && nodeMap.set(n.name.trim().toLowerCase(), n.id));

      const typeMap = new Map<string, string>();
      const ownerMap = new Map<string, string>();
      lookups?.forEach(l => {
        if (!l.name) return;
        const key = l.name.trim().toLowerCase();
        if (l.category === 'OFC_TYPES') typeMap.set(key, l.id);
        if (l.category === 'OFC_OWNER') ownerMap.set(key, l.id);
      });

      const areaMap = new Map<string, string>();
      areas?.forEach(a => a.name && areaMap.set(a.name.trim().toLowerCase(), a.id));

      // 3. Map Data to DB Schema
      const recordsToProcess: Ofc_cablesInsertSchema[] =[];

      for (let i = 0; i < validRecords.length; i++) {
        const record = validRecords[i];
        const rowValidationErrors: ValidationError[] =[];

        // Name Resolution
        const snId = record.sn_id || (typeof record.sn_name === 'string' ? nodeMap.get(record.sn_name.trim().toLowerCase()) : undefined);
        const enId = record.en_id || (typeof record.en_name === 'string' ? nodeMap.get(record.en_name.trim().toLowerCase()) : undefined);
        const typeId = record.ofc_type_id || (typeof record.ofc_type_name === 'string' ? typeMap.get(record.ofc_type_name.trim().toLowerCase()) : undefined);
        const ownerId = record.ofc_owner_id || (typeof record.ofc_owner_name === 'string' ? ownerMap.get(record.ofc_owner_name.trim().toLowerCase()) : undefined);
        const areaId = record.maintenance_terminal_id || (typeof record.maintenance_area_name === 'string' ? areaMap.get(record.maintenance_area_name.trim().toLowerCase()) : undefined);

        if (!snId) rowValidationErrors.push({ rowIndex: i + 2, column: 'sn_name', value: record.sn_name, error: 'Start Node not found in database' });
        if (!enId) rowValidationErrors.push({ rowIndex: i + 2, column: 'en_name', value: record.en_name, error: 'End Node not found in database' });
        if (!typeId) rowValidationErrors.push({ rowIndex: i + 2, column: 'ofc_type_name', value: record.ofc_type_name, error: 'OFC Type not found in database' });
        if (!ownerId) rowValidationErrors.push({ rowIndex: i + 2, column: 'ofc_owner_name', value: record.ofc_owner_name, error: 'Owner not found in database' });

        if (rowValidationErrors.length > 0) {
          uploadResult.errorCount++;
          uploadResult.errors.push({
            rowIndex: i + 2,
            data: record,
            error: rowValidationErrors.map((e) => e.error).join('; ')
          });
          continue;
        }

        recordsToProcess.push({
          id: (record.id as string) || undefined,
          route_name: record.route_name as string,
          sn_id: snId!,
          en_id: enId!,
          ofc_type_id: typeId!,
          capacity: Number(record.capacity),
          ofc_owner_id: ownerId!,
          current_rkm: record.current_rkm ? Number(record.current_rkm) : null,
          transnet_id: (record.transnet_id as string) || null,
          transnet_rkm: record.transnet_rkm ? Number(record.transnet_rkm) : null,
          asset_no: (record.asset_no as string) || null,
          maintenance_terminal_id: areaId || null,
          commissioned_on: (record.commissioned_on as string) || null,
          remark: (record.remark as string) || null,
          status: record.status !== undefined ? Boolean(record.status) : true,
        });
      }

      if (recordsToProcess.length === 0) {
        toast.warning('No valid records to upload after relation checking.');
        return uploadResult;
      }

      // 4. Upload Concurrently
      const BATCH_SIZE = 500;
      toast.info(`Uploading ${recordsToProcess.length} cables...`);

      for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
        const chunk = recordsToProcess.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('ofc_cables').upsert(chunk);

        if (error) {
          uploadResult.errorCount += chunk.length;
          uploadResult.errors.push({
            rowIndex: -1,
            data: `${chunk.length} records in batch`,
            error: error.message,
          });
        } else {
          uploadResult.successCount += chunk.length;
        }
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} saved, ${uploadResult.errorCount} failed.`);
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} cables.`);
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      // THE FIX: Master invalidator used here
      if (result.successCount > 0) {
        invalidateRelatedCaches(queryClient, 'ofc_cables');
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    },
  });
}