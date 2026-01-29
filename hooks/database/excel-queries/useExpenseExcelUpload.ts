// hooks/database/excel-queries/useExpenseExcelUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { EnhancedUploadResult } from '@/hooks/database/queries-type-helpers';
import { parseExcelFile } from '@/utils/excel-parser';
import { toPgDate } from '@/config/helper-functions';

interface ExpenseUploadOptions {
  file: File;
  defaultReqNo?: string; // Optional: Force a Req No if uploading inside a detail view
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

      const headers = (jsonData[0] as string[]).map((h) => String(h).trim().toUpperCase());
      const dataRows = jsonData.slice(1);

      // Mapping Logic based on user prompt
      // "REQ NO" might be in the title or a column. The prompt image implies it's a header for the sheet.
      // We will look for columns. If REQ NO column missing, we rely on defaultReqNo.
      
      const records = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        // Basic map
        const rowData: any = {};
        
        headers.forEach((header, idx) => {
             rowData[header] = row[idx];
        });

        // Skip empty rows
        if (!Object.values(rowData).some(v => v)) {
            uploadResult.skippedRows++;
            continue;
        }

        // Map specific columns
        const dateRaw = rowData['DATE'];
        const formattedDate = toPgDate(dateRaw);
        
        const reqNo = defaultReqNo || rowData['REQ NO'] || rowData['REQ_NO'];
        
        if (!reqNo) {
             uploadResult.errors.push({ rowIndex: i + 2, data: rowData, error: "Missing REQ NO" });
             uploadResult.errorCount++;
             continue;
        }
        
        records.push({
             p_advance_req_no: reqNo,
             p_expense_date: formattedDate,
             p_category: rowData['TYPE'] || 'General',
             p_vendor: rowData['RIDE PROVIDER'] || rowData['VENDOR'],
             p_invoice_no: rowData['INVOICE NO'],
             p_amount: Number(rowData['AMOUNT IN RX'] || rowData['AMOUNT'] || 0),
             p_terminal: rowData['TERMINAL']
        });
      }

      uploadResult.totalRows = records.length;

      // Execute RPCs
      toast.info(`Uploading ${records.length} expenses...`);
      
      for (const record of records) {
          try {
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
      queryClient.invalidateQueries({ queryKey: ['v_advances_complete-data'] }); // Update totals
    }
  });
}