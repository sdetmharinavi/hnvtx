// hooks/database/excel-queries/useSystemConnectionExcelUpload.ts
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
  validateValue,
  ValidationError,
} from './excel-helpers';

export interface SystemConnectionUploadOptions {
  file: File;
  columns: UploadColumnMapping<'v_system_connections_complete'>[];
  parentSystemId: string;
}

type RpcPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

const parseExcelFile = async (file: File): Promise<unknown[][]> => {
  const XLSX = await import('xlsx');

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

export function useSystemConnectionExcelUpload(
  supabase: SupabaseClient<Database>,
  options?: UseExcelUploadOptions<'v_system_connections_complete'>
) {
  const { showToasts = true, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, SystemConnectionUploadOptions>({
    mutationFn: async (uploadOptions): Promise<EnhancedUploadResult> => {
      const { file, columns, parentSystemId } = uploadOptions;

      const toUndefined = (val: unknown): string | undefined => {
        if (val === null || val === undefined) return undefined;
        const str = String(val).trim();
        return str === '' ? undefined : str;
      };

      const toUuidArray = (val: unknown): string[] | undefined => {
        if (!val || typeof val !== 'string') return undefined;
        const arr = val.split(',').map(s => s.trim()).filter(Boolean);
        return arr.length > 0 ? arr : undefined;
      };

      const uploadResult: EnhancedUploadResult = { successCount: 0, errorCount: 0, totalRows: 0, errors: [], processingLogs: [], validationErrors: [], skippedRows: 0 };
      const jsonData = await parseExcelFile(file);
      if (jsonData.length < 2) {
        toast.warning('No data found.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap: Record<string, number> = {};
      excelHeaders.forEach((header, index) => { headerMap[header.toLowerCase()] = index; });
      const dataRows = jsonData.slice(1);
      const recordsToProcess: RpcPayload[] = [];
      const allValidationErrors: ValidationError[] = [];
      
      // 1. Fetch Link Types for resolution
      const linkTypesResp = await supabase.from('lookup_types').select('id, name').eq('category', 'LINK_TYPES');
      const linkTypeNameToId = new Map<string, string>();
      if (!linkTypesResp.error && linkTypesResp.data) {
        for (const lt of linkTypesResp.data) { if (lt.name && lt.id) linkTypeNameToId.set(String(lt.name).trim().toLowerCase(), lt.id); }
      }

      // 2. Fetch Systems for Name -> ID resolution
      const systemsResp = await supabase.from('systems').select('id, system_name');
      const systemNameToId = new Map<string, string>();
      if (!systemsResp.error && systemsResp.data) {
        for (const s of systemsResp.data) {
           if (s.system_name) systemNameToId.set(s.system_name.trim().toLowerCase(), s.id);
        }
      }

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

          // Don't validate ID fields strictly here as we might resolve them later
          if (!mapping.dbKey.endsWith('_id')) {
             const validationError = validateValue(finalValue, mapping.dbKey, mapping.required || false);
             if (validationError) { rowValidationErrors.push({ ...validationError, rowIndex: i, data: originalData }); }
          }
          
          processedData[mapping.dbKey] = finalValue === '' ? null : finalValue;
        }
        
        // Resolve Link Type
        let resolvedLinkTypeId: string | undefined = undefined;
        const linkTypeNameRaw = processedData.connected_link_type_name as unknown;
        if (typeof linkTypeNameRaw === 'string' && linkTypeNameRaw.trim() !== '') {
          const key = linkTypeNameRaw.trim().toLowerCase();
          const foundId = linkTypeNameToId.get(key);
          if (foundId) resolvedLinkTypeId = foundId;
        }

        // Resolve Destination System ID (en_id)
        if (!processedData.en_id && processedData.connected_system_name) {
             const key = String(processedData.connected_system_name).trim().toLowerCase();
             const foundId = systemNameToId.get(key);
             if (foundId) processedData.en_id = foundId;
        }

        // Resolve Source System ID (sn_id)
        if (!processedData.sn_id && processedData.sn_name) {
             const key = String(processedData.sn_name).trim().toLowerCase();
             const foundId = systemNameToId.get(key);
             if (foundId) processedData.sn_id = foundId;
        }

        if (rowValidationErrors.length > 0) {
          allValidationErrors.push(...rowValidationErrors);
          uploadResult.errorCount++;
          continue;
        }

        const rpcPayload: RpcPayload = {
          p_id: toUndefined(processedData.id),
          p_system_id: parentSystemId,
          p_media_type_id: processedData.media_type_id as string,
          p_status: (processedData.status as boolean) ?? true,
          
          p_service_name: toUndefined(processedData.service_name) || toUndefined(processedData.customer_name),
          p_link_type_id: resolvedLinkTypeId || toUndefined(processedData.link_type_id),
          p_bandwidth_allocated: (processedData.bandwidth_allocated as string) || undefined,
          p_vlan: toUndefined(processedData.vlan),
          p_lc_id: toUndefined(processedData.lc_id),
          p_unique_id: toUndefined(processedData.unique_id),
          p_service_node_id: toUndefined(processedData.service_node_id), // Use provided service node if exists
          
          p_sn_id: toUndefined(processedData.sn_id),
          p_en_id: toUndefined(processedData.en_id),
          p_sn_ip: processedData.sn_ip || undefined,
          p_sn_interface: toUndefined(processedData.sn_interface),
          p_en_ip: processedData.en_ip || undefined,
          p_en_interface: toUndefined(processedData.en_interface),
          p_bandwidth: (processedData.bandwidth as string) || undefined,
          p_commissioned_on: toUndefined(processedData.commissioned_on),
          p_remark: toUndefined(processedData.remark),
          
          p_working_fiber_in_ids: toUuidArray(processedData.working_fiber_in_ids),
          p_working_fiber_out_ids: toUuidArray(processedData.working_fiber_out_ids),
          p_protection_fiber_in_ids: toUuidArray(processedData.protection_fiber_in_ids),
          p_protection_fiber_out_ids: toUuidArray(processedData.protection_fiber_out_ids),
          
          p_system_working_interface: toUndefined(processedData.system_working_interface),
          p_system_protection_interface: toUndefined(processedData.system_protection_interface),
          
          p_stm_no: toUndefined(processedData.sdh_stm_no),
          p_carrier: toUndefined(processedData.sdh_carrier),
          p_a_slot: toUndefined(processedData.sdh_a_slot),
          p_a_customer: toUndefined(processedData.sdh_a_customer),
          p_b_slot: toUndefined(processedData.sdh_b_slot),
          p_b_customer: toUndefined(processedData.sdh_b_customer),
        };

        recordsToProcess.push(rpcPayload);
      }

      uploadResult.totalRows = recordsToProcess.length;
      if (recordsToProcess.length === 0) {
        if (allValidationErrors.length > 0) {
          toast.error(`${allValidationErrors.length} rows had validation errors.`);
        } else {
          toast.warning('No valid records to upload.');
        }
        return uploadResult;
      }

      toast.info(`Uploading ${recordsToProcess.length} valid records...`);
      for (const record of recordsToProcess) {
        try {
          const { error } = await supabase.rpc('upsert_system_connection_with_details', record);
          if (error) throw new Error(error.message);
          uploadResult.successCount++;
        } catch (error) {
          uploadResult.errorCount++;
          uploadResult.errors.push({ rowIndex: -1, data: record, error: error instanceof Error ? error.message : 'Unknown RPC error' });
        }
      }

      if (showToasts) {
        if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} saved, ${uploadResult.errorCount} failed.`);
        } else {
          toast.success(`Successfully saved ${uploadResult.successCount} connections.`);
        }
      }

      return uploadResult;
    },
    onSuccess: (result, variables) => {
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['system_connections-data'] }); 
        queryClient.invalidateQueries({ queryKey: ['ports_management-data'] });
      }
      mutationOptions.onSuccess?.(result, { ...variables, uploadType: 'upsert' });
    },
    onError: (error, variables) => {
      if (showToasts) toast.error(`Upload failed: ${error.message}`);
      mutationOptions.onError?.(error, { ...variables, uploadType: 'upsert' });
    }
  });
}