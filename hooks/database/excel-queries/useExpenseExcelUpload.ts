/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/database/excel-queries/useExpenseExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
  EnhancedUploadResult,
  UploadColumnMapping,
} from '@/hooks/database/queries-type-helpers';
import { processExcelData } from './excel-helpers';
import { toPgDate } from '@/config/helper-functions';
import type { Database } from '@/types/supabase-types';

type UpsertExpenseArgs = Database['public']['Functions']['upsert_expense_record']['Args'];

interface ExpenseUploadOptions {
  file: File;
  defaultReqNo?: string;
}

// Define mapping for the processor
// We map Excel headers to temporary keys or direct RPC arg names
const EXPENSE_COLUMNS: UploadColumnMapping<'v_expenses_complete'>[] = [
  { excelHeader: 'REQ NO', dbKey: 'advance_req_no' as any }, // 'as any' because view key might differ slightly
  { excelHeader: 'REQ_NO', dbKey: 'advance_req_no' as any },
  { excelHeader: 'ADVANCE REQ NO', dbKey: 'advance_req_no' as any },
  { excelHeader: 'DATE', dbKey: 'expense_date', transform: toPgDate, required: true },
  { excelHeader: 'EXPENSE DATE', dbKey: 'expense_date', transform: toPgDate },
  { excelHeader: 'TYPE', dbKey: 'category' },
  { excelHeader: 'CATEGORY', dbKey: 'category' },
  { excelHeader: 'RIDE PROVIDER', dbKey: 'vendor' },
  { excelHeader: 'VENDOR', dbKey: 'vendor' },
  { excelHeader: 'INVOICE NO', dbKey: 'invoice_no' },
  { excelHeader: 'AMOUNT IN RX', dbKey: 'amount', required: true },
  { excelHeader: 'AMOUNT', dbKey: 'amount' },
  { excelHeader: 'TERMINAL', dbKey: 'terminal_location' },
  { excelHeader: 'LOCATION', dbKey: 'terminal_location' },
  { excelHeader: 'DESCRIPTION', dbKey: 'description' },
  { excelHeader: 'USED BY', dbKey: 'used_by' as any }, // Temporary key for lookup
  { excelHeader: 'SPENT BY', dbKey: 'used_by' as any },
  { excelHeader: 'EMPLOYEE', dbKey: 'used_by' as any },
];

export function useExpenseExcelUpload(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, ExpenseUploadOptions>({
    mutationFn: async ({ file, defaultReqNo }): Promise<EnhancedUploadResult> => {
      toast.info('Fetching employee data for linking...');
      
      // 1. Fetch Employees for Name Resolution
      const { data: employees } = await supabase
        .from('employees')
        .select('id, employee_name, employee_pers_no');
        
      const employeeMap = new Map<string, string>();
      if (employees) {
        employees.forEach((emp) => {
          if (emp.employee_name) employeeMap.set(emp.employee_name.toLowerCase().trim(), emp.id);
          if (emp.employee_pers_no) employeeMap.set(emp.employee_pers_no.toLowerCase().trim(), emp.id);
        });
      }

      // 2. Process File
      toast.info('Processing Excel file...');
      
      // We pass the config. processExcelData will handle parsing and basic validation.
      const { validRecords, validationErrors, processingLogs, skippedRows, errorCount: initialErrorCount } = 
        await processExcelData(file, EXPENSE_COLUMNS);

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: initialErrorCount,
        totalRows: validRecords.length + initialErrorCount,
        errors: [],
        processingLogs,
        validationErrors,
        skippedRows,
      };

      if (validRecords.length === 0 && initialErrorCount === 0) {
        toast.warning("No valid data found in file.");
        return uploadResult;
      }

      if (validationErrors.length > 0) {
         // Map generic validation errors to result format
         validationErrors.forEach(err => {
             uploadResult.errors.push({
                 rowIndex: err.rowIndex,
                 data: err.data,
                 error: err.error
             });
         });
         // Stop if we have structural errors, or continue? 
         // processExcelData filters out invalid rows, so validRecords are technically safe to try.
      }

      const recordsToProcess: UpsertExpenseArgs[] = [];

      // 3. Transform and Resolve Relationships
      for (let i = 0; i < validRecords.length; i++) {
        const row = validRecords[i] as any;
        const excelRowIndex = i + 2; // Approx

        const reqNo = row.advance_req_no || defaultReqNo;
        
        if (!reqNo) {
            uploadResult.errorCount++;
            uploadResult.errors.push({ rowIndex: excelRowIndex, data: row, error: "Missing REQ NO" });
            continue;
        }

        // Resolve "Used By"
        let spentById: string | undefined = undefined;
        const usedByName = row.used_by;
        
        if (usedByName && typeof usedByName === 'string') {
          const key = usedByName.toLowerCase().trim();
          spentById = employeeMap.get(key);
        }

        recordsToProcess.push({
          p_advance_req_no: String(reqNo),
          p_expense_date: row.expense_date,
          p_category: String(row.category || 'General'),
          p_vendor: String(row.vendor || ''),
          p_invoice_no: String(row.invoice_no || ''),
          p_amount: Number(row.amount || 0),
          p_terminal: String(row.terminal_location || 'HNV TM'),
          p_description: row.description ? String(row.description) : undefined,
          p_spent_by_employee_id: spentById,
        });
      }

      if (recordsToProcess.length === 0) {
          return uploadResult;
      }

      // 4. Execute RPCs
      toast.info(`Uploading ${recordsToProcess.length} expenses...`);

      // Use a concurrency limit to avoid overwhelming the database
      const CONCURRENCY = 5;
      for (let i = 0; i < recordsToProcess.length; i += CONCURRENCY) {
        const batch = recordsToProcess.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async (record) => {
            try {
                const { error } = await supabase.rpc('upsert_expense_record', record);
                if (error) throw error;
                uploadResult.successCount++;
            } catch (error) {
                uploadResult.errorCount++;
                uploadResult.errors.push({
                    rowIndex: -1,
                    data: record,
                    error: error instanceof Error ? error.message : 'RPC Error'
                });
            }
        }));
      }

      return uploadResult;
    },
    onSuccess: () => {
      toast.success('Upload complete');
      queryClient.invalidateQueries({ queryKey: ['v_expenses_complete-data'] });
      queryClient.invalidateQueries({ queryKey: ['v_advances_complete-data'] });
    },
    onError: (error) => {
        toast.error(`Upload failed: ${error.message}`);
    }
  });
}