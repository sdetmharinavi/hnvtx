// hooks/database/excel-queries/useInventoryExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { EnhancedUploadResult, ProcessingLog, ValidationError } from './excel-helpers';

interface InventoryUploadOptions {
  file: File;
}

const parseExcelFile = async (file: File): Promise<unknown[][]> => {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

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
      const jsonData = await parseExcelFile(file);
      
      if (jsonData.length < 2) {
          toast.warning('No data found.');
          return uploadResult;
      }

      const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
      const dataRows = jsonData.slice(1);
      
      // Enhanced Column Mapping
      const columnMap: Record<string, string> = {
          // Item Details
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
          
          // Transaction Details
          'quantity': 'quantity',
          'qty': 'quantity',
          'vendor': 'vendor',
          'cost': 'cost',
          'unit cost': 'cost',
          'purchase date': 'purchase_date',
          
          // NEW: Action Columns
          'action': 'transaction_type',
          'transaction type': 'transaction_type', // ADD, ISSUE, SET
          'type': 'transaction_type',
          'issued to': 'issued_to', // For ISSUE
          'party': 'issued_to',
          'reason': 'issue_reason', // For ISSUE/RESTOCK
          'remarks': 'issue_reason',
          'transaction date': 'transaction_date' // Override date
      };

      const validPayloads = [];

      for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as unknown[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowData: any = {};
          let isEmpty = true;

          headers.forEach((header, idx) => {
              if(row[idx]) isEmpty = false;
              // Clean header
              const cleanHeader = header.replace(/\(read only history\)/g, '').trim();
              const key = columnMap[cleanHeader] || columnMap[header]; 
              
              if (key) {
                  let val = row[idx];
                  // Date formatting
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

          // --- VALIDATION LOGIC ---
          const rowErrors: ValidationError[] = [];
          if (!rowData.name) rowErrors.push({ rowIndex: i, column: 'name', value: '', error: 'Item Name is required' });
          
          // Action Validation
          const action = (rowData.transaction_type || 'ADD').toUpperCase();
          if (action === 'ISSUE') {
              if (!rowData.issued_to) rowErrors.push({ rowIndex: i, column: 'issued_to', value: '', error: 'Issued To is required for ISSUE action' });
          }

          if (rowErrors.length > 0) {
              allValidationErrors.push(...rowErrors);
              uploadResult.errorCount++;
              uploadResult.errors.push({ rowIndex: i + 2, data: rowData, error: rowErrors.map(e => e.error).join(', ') });
          } else {
              // Normalize payload
              validPayloads.push({
                  ...rowData,
                  transaction_type: action
              });
          }
      }

      uploadResult.totalRows = validPayloads.length;

      if (validPayloads.length > 0) {
          toast.info(`Processing ${validPayloads.length} inventory actions...`);
          
          // Call the SMART RPC
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
        // Invalidate both inventory list and history logs
        queryClient.invalidateQueries({ queryKey: ['inventory_items-data'] });
        queryClient.invalidateQueries({ queryKey: ['v_inventory_items'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-history'] });
    },
    onError: (err) => {
        toast.error(`Import failed: ${err.message}`);
    }
  });
}