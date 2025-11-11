// hooks/database/excel-queries/useRingExcelUpload.ts
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import { RingsInsertSchema } from '@/schemas/zod-schemas';
import { toPgBoolean } from '@/config/helper-functions';
import {
  EnhancedUploadResult,
  logRowProcessing,
  ValidationError,
} from './excel-helpers';

interface RingUploadOptions {
  file: File;
}

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

export function useRingExcelUpload(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, RingUploadOptions>({
    mutationFn: async ({ file }): Promise<EnhancedUploadResult> => {
      const processingLogs: ReturnType<typeof logRowProcessing>[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs, validationErrors: allValidationErrors, skippedRows: 0,
      };

      // --- THE FIX: Fetch lookup data INSIDE the mutation function ---
      toast.info('Fetching lookup data for validation...');
      const { data: ringTypes, error: ringTypesError } = await supabase.from('lookup_types').select('id, name').eq('category', 'RING_TYPES');
      if (ringTypesError) throw new Error(`Failed to fetch ring types: ${ringTypesError.message}`);

      const { data: maintenanceAreas, error: maintenanceAreasError } = await supabase.from('maintenance_areas').select('id, name');
      if (maintenanceAreasError) throw new Error(`Failed to fetch maintenance areas: ${maintenanceAreasError.message}`);
      
      // Create the maps from the fetched data
      const ringTypeMap = new Map(ringTypes.map(item => [item.name.toLowerCase().trim(), item.id]));
      const maintenanceAreaMap = new Map(maintenanceAreas.map(item => [item.name.toLowerCase().trim(), item.id]));
      // --- END FIX ---

      toast.info('Reading and parsing Excel file...');
      const jsonData = await parseExcelFile(file);

      if (!jsonData || jsonData.length < 2) {
        toast.warning('No data found in the Excel file.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map(h => String(h || '').trim());
      const headerMap = new Map(excelHeaders.map((h, i) => [h.toLowerCase(), i]));

      const dataRows = jsonData.slice(1);
      const ringsToUpsert: RingsInsertSchema[] = [];

      toast.info(`Found ${dataRows.length} rows. Validating and transforming data...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const excelRowNumber = i + 2;
        const originalData: Record<string, unknown> = {};
        excelHeaders.forEach((header, idx) => { originalData[header] = row[idx]; });

        if (row.every(cell => cell === null || String(cell).trim() === '')) {
            uploadResult.skippedRows++;
            continue;
        }

        const ringTypeName = String(row[headerMap.get('ring type name') ?? -1] || '').toLowerCase().trim();
        const maintenanceAreaName = String(row[headerMap.get('maintenance area name') ?? -1] || '').toLowerCase().trim();
        const statusValue = row[headerMap.get('status') ?? -1];
        
        const ringTypeId = ringTypeMap.get(ringTypeName);
        const maintenanceTerminalId = maintenanceAreaMap.get(maintenanceAreaName);

        const rowValidationErrors: ValidationError[] = [];
        if (!ringTypeId) {
            rowValidationErrors.push({ rowIndex: i, column: 'ring_type_name', value: ringTypeName, error: `Ring Type "${row[headerMap.get('ring type name') ?? -1]}" not found.` });
        }
        if (!maintenanceTerminalId) {
            rowValidationErrors.push({ rowIndex: i, column: 'maintenance_area_name', value: maintenanceAreaName, error: `Maintenance Area "${row[headerMap.get('maintenance area name') ?? -1]}" not found.` });
        }

        if (rowValidationErrors.length > 0) {
            allValidationErrors.push(...rowValidationErrors);
            uploadResult.errorCount++;
            continue;
        }

        const record: RingsInsertSchema = {
            id: row[headerMap.get('id') ?? -1] as string || undefined,
            name: row[headerMap.get('name') ?? -1] as string,
            description: row[headerMap.get('description') ?? -1] as string || null,
            total_nodes: Number(row[headerMap.get('total nodes') ?? -1]) || 0,
            status: toPgBoolean(statusValue),
            ring_type_id: ringTypeId,
            maintenance_terminal_id: maintenanceTerminalId,
        };
        
        ringsToUpsert.push(record);
      }
      
      uploadResult.totalRows = ringsToUpsert.length;

      if (ringsToUpsert.length === 0) {
        if(uploadResult.errorCount > 0) {
            toast.error(`${uploadResult.errorCount} rows had validation errors. Please check the console for details.`);
            console.error("Ring Upload Validation Errors:", allValidationErrors);
        } else {
            toast.warning("No valid records to upload.");
        }
        return uploadResult;
      }
      
      toast.info(`Uploading ${ringsToUpsert.length} valid records...`);
      const { error } = await supabase.from('rings').upsert(ringsToUpsert, { onConflict: 'id' });

      if (error) {
        toast.error(`Upload Failed: ${error.message}`);
        throw error;
      }
      
      uploadResult.successCount = ringsToUpsert.length;
      return uploadResult;
    },
    onSuccess: (result) => {
      if (result.successCount > 0) {
        toast.success(`Successfully uploaded ${result.successCount} ring(s).`);
        queryClient.invalidateQueries({ queryKey: ['rings-manager-data'] });
      }
    },
    onError: (error) => {
        toast.error(`An unexpected error occurred: ${error.message}`);
    }
  });
}