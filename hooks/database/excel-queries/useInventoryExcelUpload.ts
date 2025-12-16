// hooks/database/excel-queries/useInventoryExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { EnhancedUploadResult, ProcessingLog, ValidationError } from './excel-helpers';
import { parseExcelFile } from '@/utils/excel-parser'; // THE FIX

interface InventoryUploadOptions {
  file: File;
}

export function useInventoryExcelUpload() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, InventoryUploadOptions>({
    mutationFn: async ({ file }) => {
      const processingLogs: ProcessingLog[] = [];
      const allValidationErrors: ValidationError[] = [];
      const uploadResult: EnhancedUploadResult = {
        successCount: 0, errorCount: 0, totalRows: 0, errors: [],
        processingLogs, validationErrors: allValidationErrors, skippedRows: 0,
      };

      toast.info('Parsing Excel file...');
      
      // THE FIX: Use off-thread parser
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
          toast.warning('No data found.');
          return uploadResult;
      }

      const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
      const dataRows = jsonData.slice(1);

      // Enhanced Column Mapping
      const columnMap: Record<string, string> = {
          'asset no': 'asset_no',
          'asset number': 'asset_no',
          'name': 'name',
          'item name': 'name',
          'description': 'description',
          'category': 'category',
          'status': 'status',
          'location': 'location',
          'store location': 'location',
          'functional location': 'functional_location',
          'quantity': 'quantity',
          'qty': 'quantity',
          'vendor': 'vendor',
          'cost': 'cost',
          'unit cost': 'cost',
          'purchase date': 'purchase_date',
          'action': 'transaction_type',
          'transaction type': 'transaction_type',
          'type': 'transaction_type',
          'issued to': 'issued_to',
          'party': 'issued_to',
          'reason': 'issue_reason',
          'remarks': 'issue_reason',
          'transaction date': 'transaction_date'
      };

      const validPayloads = [];

      for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as unknown[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowData: any = {};
          let isEmpty = true;

          headers.forEach((header, idx) => {
              if(row[idx]) isEmpty = false;
              const cleanHeader = header.replace(/\(read only history\)/g, '').trim();
              const key = columnMap[cleanHeader] || columnMap[header];

              if (key) {
                  let val = row[idx];
                  if ((key === 'purchase_date' || key === 'transaction_date') && val instanceof Date) {
                      val = val.toISOString().split('T')[0];
                  }
                  rowData[key] = val;
              }
          });

          if (isEmpty) {
              uploadResult.skippedRows++;
              continue;
          }

          const rowErrors: ValidationError[] = [];
          if (!rowData.name) rowErrors.push({ rowIndex: i, column: 'name', value: '', error: 'Item Name is required' });

          const action = (rowData.transaction_type || 'ADD').toUpperCase();
          if (action === 'ISSUE') {
              if (!rowData.issued_to) rowErrors.push({ rowIndex: i, column: 'issued_to', value: '', error: 'Issued To is required for ISSUE action' });
          }

          if (rowErrors.length > 0) {
              allValidationErrors.push(...rowErrors);
              uploadResult.errorCount++;
              uploadResult.errors.push({ rowIndex: i + 2, data: rowData, error: rowErrors.map(e => e.error).join(', ') });
          } else {
              validPayloads.push({
                  ...rowData,
                  transaction_type: action
              });
          }
      }

      uploadResult.totalRows = validPayloads.length;

      if (validPayloads.length > 0) {
          toast.info(`Processing ${validPayloads.length} inventory actions...`);

          const { data: result, error } = await supabase.rpc('bulk_import_inventory_smart', {
              p_items: validPayloads
          });

          if (error) throw error;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = result as any;
          uploadResult.successCount = res.success_count;
          uploadResult.errorCount += res.error_count;

          if (res.errors && res.errors.length > 0) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
              res.errors.forEach((err: any) => {
                  uploadResult.errors.push({ rowIndex: -1, data: err.asset || err.name, error: err.error });
              });
          }
      }

      if (uploadResult.errorCount > 0) {
          toast.warning(`${uploadResult.successCount} processed, ${uploadResult.errorCount} failed.`);
      } else {
          toast.success(`Successfully processed ${uploadResult.successCount} items.`);
      }

      return uploadResult;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory_items-data'] });
        queryClient.invalidateQueries({ queryKey: ['v_inventory_items'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-history'] });
    },
    onError: (err) => {
        toast.error(`Import failed: ${err.message}`);
    }
  });
}