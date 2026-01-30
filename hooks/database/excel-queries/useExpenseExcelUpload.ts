// hooks/database/excel-queries/useExpenseExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { EnhancedUploadResult } from '@/hooks/database/queries-type-helpers';
import { parseExcelFile } from '@/utils/excel-parser';
import { toPgDate } from '@/config/helper-functions';

interface ExpenseUploadOptions {
  file: File;
  defaultReqNo?: string;
}

export function useExpenseExcelUpload(supabase: SupabaseClient<any>) {
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, ExpenseUploadOptions>({
    mutationFn: async ({ file, defaultReqNo }): Promise<EnhancedUploadResult> => {
      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs: [],
        validationErrors: [],
        skippedRows: 0,
      };

      toast.info('Parsing Expenses Excel...');
      const jsonData = await parseExcelFile(file);

      if (jsonData.length < 2) {
        toast.warning('No data found.');
        return uploadResult;
      }

      // 1. Fetch Employees for Name Resolution
      const { data: employees } = await supabase.from('employees').select('id, employee_name, employee_pers_no');
      const employeeMap = new Map<string, string>();
      
      if (employees) {
        employees.forEach(emp => {
            // Map Name -> ID
            if (emp.employee_name) employeeMap.set(emp.employee_name.toLowerCase().trim(), emp.id);
            // Map PersNo -> ID (as fallback)
            if (emp.employee_pers_no) employeeMap.set(emp.employee_pers_no.toLowerCase().trim(), emp.id);
        });
      }

      const headers = (jsonData[0] as string[]).map((h) => String(h).trim().toUpperCase());
      const dataRows = jsonData.slice(1);

      const records = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        const rowData: any = {};

        headers.forEach((header, idx) => {
             rowData[header] = row[idx];
        });

        // Skip empty rows
        if (!Object.values(rowData).some(v => v)) {
            uploadResult.skippedRows++;
            continue;
        }

        // Map columns
        const dateRaw = rowData['DATE'] || rowData['EXPENSE DATE'];
        const formattedDate = toPgDate(dateRaw);
        const reqNo = defaultReqNo || rowData['REQ NO'] || rowData['REQ_NO'] || rowData['ADVANCE REQ NO'];

        if (!reqNo) {
             uploadResult.errors.push({ rowIndex: i + 2, data: rowData, error: "Missing REQ NO" });
             uploadResult.errorCount++;
             continue;
        }

        // Resolve "Used By" / "Spent By"
        let spentById = null;
        const usedByName = rowData['USED BY'] || rowData['SPENT BY'] || rowData['EMPLOYEE'];
        
        if (usedByName) {
            const key = String(usedByName).toLowerCase().trim();
            spentById = employeeMap.get(key);
            if (!spentById) {
                 // Warning but not blocking - it will default to Advance Holder in View
                 console.warn(`Employee '${usedByName}' not found, will default to advance holder.`);
            }
        }

        records.push({
             p_advance_req_no: reqNo,
             p_expense_date: formattedDate,
             p_category: rowData['TYPE'] || rowData['CATEGORY'] || 'General',
             p_vendor: rowData['RIDE PROVIDER'] || rowData['VENDOR'],
             p_invoice_no: rowData['INVOICE NO'],
             p_amount: Number(rowData['AMOUNT IN RX'] || rowData['AMOUNT'] || 0),
             p_terminal: rowData['TERMINAL'] || rowData['LOCATION'],
             p_description: rowData['DESCRIPTION'],
             p_spent_by_employee_id: spentById // Pass resolved ID
        });
      }

      uploadResult.totalRows = records.length;

      toast.info(`Uploading ${records.length} expenses...`);

      for (const record of records) {
          try {
              // Call the new signature
              const { error } = await supabase.rpc('upsert_expense_record', record);
              if (error) throw error;
              uploadResult.successCount++;
          } catch (e: any) {
              console.error(e);
              uploadResult.errorCount++;
              uploadResult.errors.push({ rowIndex: -1, data: record, error: e.message });
          }
      }

      return uploadResult;
    },
    onSuccess: () => {
      toast.success("Upload complete");
      queryClient.invalidateQueries({ queryKey: ['v_expenses_complete-data'] });
      queryClient.invalidateQueries({ queryKey: ['v_advances_complete-data'] });
    }
  });
}