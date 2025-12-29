// hooks/database/excel-queries/useRingExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database, Json } from '@/types/supabase-types';
import { RingsInsertSchema } from '@/schemas/zod-schemas';
import { toPgBoolean } from '@/config/helper-functions';
import { EnhancedUploadResult, ValidationError } from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser';

interface RingUploadOptions {
  file: File;
}

type Association = {
  system?: string;
  order?: number;
  is_hub?: boolean;
};

type RingToUpsert = RingsInsertSchema & { associated_systems_json?: Association[] };

export function useRingExcelUpload(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, RingUploadOptions>({
    mutationFn: async ({ file }): Promise<EnhancedUploadResult> => {
      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs: [],
        validationErrors: [],
        skippedRows: 0,
      };

      toast.info('Fetching lookup data for validation...');

      // CHANGED: Use RPC for systems fetching
      const { data: systemsData, error: systemsError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_systems_complete',
        p_limit: 10000,
        p_offset: 0,
      });

      const [
        { data: ringTypes, error: ringTypesError },
        { data: maintenanceAreas, error: maintenanceAreasError },
      ] = await Promise.all([
        supabase.from('lookup_types').select('id, name').eq('category', 'RING_TYPES'),
        supabase.from('maintenance_areas').select('id, name'),
      ]);

      if (ringTypesError) throw new Error(`Failed to fetch ring types: ${ringTypesError.message}`);
      if (maintenanceAreasError)
        throw new Error(`Failed to fetch maintenance areas: ${maintenanceAreasError.message}`);
      if (systemsError) throw new Error(`Failed to fetch systems: ${systemsError.message}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systems = (systemsData as any)?.data || [];

      const ringTypeMap = new Map(
        ringTypes.map((item) => [item.name.toLowerCase().trim(), item.id])
      );
      const maintenanceAreaMap = new Map(
        maintenanceAreas.map((item) => [item.name.toLowerCase().trim(), item.id])
      );
      const systemNameMap = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        systems.map((item: any) => [item.system_name?.toLowerCase().trim(), item.id])
      );
      const nodeNameMap = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        systems.map((item: any) => [item.node_name?.toLowerCase().trim(), item.id])
      );

      toast.info('Reading and parsing Excel file...');

      const jsonData = await parseExcelFile(file);

      // ... (Rest of parsing logic remains identical) ...
      // I will include the rest of the parsing logic to ensure the file is complete.

      if (!jsonData || jsonData.length < 2) {
        toast.warning('No data found in the Excel file.');
        return uploadResult;
      }

      const excelHeaders: string[] = (jsonData[0] as string[]).map((h) => String(h || '').trim());
      const headerMap = new Map(excelHeaders.map((h, i) => [h.toLowerCase(), i]));
      const dataRows = jsonData.slice(1);
      const ringsToUpsert: RingToUpsert[] = [];
      const allValidationErrors: ValidationError[] = [];

      toast.info(`Found ${dataRows.length} rows. Validating data...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[];
        const rowValidationErrors: ValidationError[] = [];

        if (row.every((cell) => cell === null || String(cell).trim() === '')) {
          uploadResult.skippedRows++;
          continue;
        }

        const ringTypeNameRaw = row[headerMap.get('ring_type_name') ?? -1];
        const maintenanceAreaNameRaw = row[headerMap.get('maintenance_area_name') ?? -1];
        const associatedSystemsRaw = row[headerMap.get('associated_systems') ?? -1];
        const topologyConfigRaw = row[headerMap.get('topology_config') ?? -1]; // ADDED
        const statusValue = row[headerMap.get('status') ?? -1];

        const ringTypeName = String(ringTypeNameRaw || '')
          .toLowerCase()
          .trim();
        const maintenanceAreaName = String(maintenanceAreaNameRaw || '')
          .toLowerCase()
          .trim();

        const ringTypeId = ringTypeMap.get(ringTypeName);
        const maintenanceTerminalId = maintenanceAreaMap.get(maintenanceAreaName);

        if (!ringTypeId && ringTypeName) {
          rowValidationErrors.push({
            rowIndex: i,
            column: 'ring_type_name',
            value: ringTypeNameRaw,
            error: `Ring Type "${ringTypeNameRaw}" not found.`,
          });
        }
        if (!maintenanceTerminalId && maintenanceAreaName) {
          rowValidationErrors.push({
            rowIndex: i,
            column: 'maintenance_area_name',
            value: maintenanceAreaNameRaw,
            error: `Maintenance Area "${maintenanceAreaNameRaw}" not found.`,
          });
        }

        let associatedSystemsJson: Association[] = [];
        if (associatedSystemsRaw && typeof associatedSystemsRaw === 'string') {
          try {
            associatedSystemsJson = JSON.parse(associatedSystemsRaw);
            if (!Array.isArray(associatedSystemsJson)) throw new Error('JSON is not an array.');

            for (const sys of associatedSystemsJson) {
              const sysName = sys.system?.toLowerCase().trim();
              if (!sysName || (!systemNameMap.has(sysName) && !nodeNameMap.has(sysName))) {
                rowValidationErrors.push({
                  rowIndex: i,
                  column: 'associated_systems',
                  value: sys.system,
                  error: `System or Node "${sys.system}" not found.`,
                });
              }
            }
          } catch (e) {
            console.error(e);
            rowValidationErrors.push({
              rowIndex: i,
              column: 'associated_systems',
              value: associatedSystemsRaw,
              error: 'Invalid JSON format.',
            });
          }
        }

        // ADDED: Parse Topology Config
        let topologyConfigJson: Json | null = null;
        if (
          topologyConfigRaw &&
          typeof topologyConfigRaw === 'string' &&
          topologyConfigRaw.trim() !== ''
        ) {
          try {
            topologyConfigJson = JSON.parse(topologyConfigRaw);
          } catch (e) {
            console.error('Topology Config JSON Error:', e);
            // Non-blocking error, but log it
            rowValidationErrors.push({
              rowIndex: i,
              column: 'topology_config',
              value: topologyConfigRaw,
              error: 'Invalid JSON format for topology config.',
            });
          }
        }

        if (rowValidationErrors.length > 0) {
          allValidationErrors.push(...rowValidationErrors);
          uploadResult.errorCount++;
          continue;
        }

        const record: RingToUpsert = {
          id: (row[headerMap.get('id') ?? -1] as string) || undefined,
          name: row[headerMap.get('name') ?? -1] as string,
          description: (row[headerMap.get('description') ?? -1] as string) || null,
          total_nodes: Number(row[headerMap.get('total_nodes') ?? -1]) || 0,
          status: toPgBoolean(statusValue),
          ring_type_id: ringTypeId,
          maintenance_terminal_id: maintenanceTerminalId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          associated_systems_json: associatedSystemsJson as any,
          topology_config: topologyConfigJson,
        };

        ringsToUpsert.push(record);
      }

      if (ringsToUpsert.length === 0) {
        if (uploadResult.errorCount > 0) {
          toast.error(`${uploadResult.errorCount} rows had validation errors.`);
          console.error('Ring Upload Validation Errors:', allValidationErrors);
        } else {
          toast.warning('No valid records to upload.');
        }
        return uploadResult;
      }

      toast.info(`Upserting ${ringsToUpsert.length} ring records...`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ringsPayload = ringsToUpsert.map(({ associated_systems_json, ...rest }) => rest);

      const { data: upsertedRings, error: upsertError } = await supabase
        .from('rings')
        .upsert(ringsPayload, { onConflict: 'id' })
        .select('id, name');

      if (upsertError) {
        toast.error(`Ring Upload Failed: ${upsertError.message}`);
        throw upsertError;
      }

      toast.info(`Updating system associations for ${upsertedRings.length} rings...`);
      for (const ring of upsertedRings) {
        const originalRecord = ringsToUpsert.find((r) => r.id === ring.id || r.name === ring.name);
        if (originalRecord && originalRecord.associated_systems_json) {
          const { error: assocError } = await supabase.rpc('upsert_ring_associations_from_json', {
            p_ring_id: ring.id,
            p_associations: originalRecord.associated_systems_json as unknown as Json,
          });
          if (assocError) {
            toast.warning(
              `Failed to update associations for ring "${ring.name}": ${assocError.message}`
            );
            uploadResult.errorCount++;
          }
        }
      }

      uploadResult.successCount = ringsToUpsert.length - uploadResult.errorCount;
      uploadResult.totalRows = dataRows.length;
      return uploadResult;
    },
    onSuccess: (result) => {
      if (result.successCount > 0) {
        toast.success(
          `Successfully processed ${result.successCount} of ${result.totalRows} ring records.`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['rings-manager-data'] });
      queryClient.invalidateQueries({ queryKey: ['systems-data'] });
    },
    onError: (error) => {
      toast.error(`An unexpected error occurred during upload: ${error.message}`);
    },
  });
}
