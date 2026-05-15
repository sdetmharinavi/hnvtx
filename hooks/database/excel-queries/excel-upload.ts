import {
  TableInsert,
  PublicTableName,
  UploadOptions,
  UseExcelUploadOptions,
  EnhancedUploadResult,
  ProcessingLog,
  ValidationError,
} from '@/hooks/database/queries-type-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateUUID,
  logColumnTransformation,
  logRowProcessing,
  validateValue,
} from '@/hooks/database/excel-queries/excel-helpers';
import { toast } from 'sonner';
import { parseExcelFile } from '@/utils/excel-parser'; // THE FIX

//================================================================================
// MAIN ENHANCED UPLOAD HOOK
//================================================================================

export function useExcelUpload<T extends PublicTableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseExcelUploadOptions<T>
) {
  const { showToasts = true, batchSize = 500, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
    mutationFn: async (uploadOptions: UploadOptions<T>): Promise<EnhancedUploadResult> => {
      const { file, columns, uploadType = 'upsert', conflictColumn, staticData } = uploadOptions;

      if (uploadType === 'upsert' && !conflictColumn) {
        throw new Error("A 'conflictColumn' must be specified for 'upsert' operations.");
      }

      const processingLogs: ProcessingLog[] = [];
      const allValidationErrors: ValidationError[] = [];

      toast.info('Reading and parsing Excel file...');

      // THE FIX: Use off-thread parser
      const jsonData = await parseExcelFile(file);

      if (!jsonData || jsonData.length < 2) {
        toast.warning(
          'No data found in the Excel file. (A header row and at least one data row are required).'
        );
        return {
          successCount: 0,
          errorCount: 0,
          totalRows: 0,
          errors: [],
          processingLogs,
          validationErrors: allValidationErrors,
          skippedRows: 0,
        };
      }

      const excelHeaders: string[] = jsonData[0] as string[];
      const headerMap: Record<string, number> = {};

      excelHeaders.forEach((header, index) => {
        const cleanHeader = String(header).trim().toLowerCase();
        headerMap[cleanHeader] = index;
      });

      const getHeaderIndex = (name: string): number | undefined =>
        headerMap[String(name).trim().toLowerCase()];

      toast.info(`Found ${jsonData.length - 1} rows. Preparing data for upload...`);

      const dataRows = jsonData.slice(1);

      const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
        for (const mapping of columns) {
          if (mapping.dbKey === 'id') continue;
          const idx = getHeaderIndex(mapping.excelHeader);
          const v = idx !== undefined ? row[idx] : undefined;
          if (v !== undefined && String(v).trim() !== '') {
            return false;
          }
        }
        return true;
      };

      const filteredRows = dataRows
        .map((row, idx) => ({ row: row as unknown[], idx }))
        .filter(({ row }) => !isRowEffectivelyEmpty(row));

      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs,
        validationErrors: allValidationErrors,
        skippedRows: 0,
      };

      let recordsToProcess: TableInsert<T>[] = [];

      const insertBatch = async (rows: TableInsert<T>[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return supabase.from(tableName).insert(rows as any);
      };

      const upsertBatch = async (rows: TableInsert<T>[], onConflict: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return supabase.from(tableName).upsert(rows as any, { onConflict });
      };

      for (let i = 0; i < filteredRows.length; i++) {
        const { row, idx } = filteredRows[i];
        const excelRowNumber = idx + 2;

        const originalData: Record<string, unknown> = {};
        const processedData: Record<string, unknown> = {};
        const rowValidationErrors: ValidationError[] = [];
        let isSkipped = false;
        let skipReason: string | undefined;

        excelHeaders.forEach((header, headerIdx) => {
          originalData[header] = row[headerIdx];
        });

        const rowHasContent = columns.some((mapping) => {
          if (mapping.dbKey === 'id') return false;
          const idx = getHeaderIndex(mapping.excelHeader);
          const v = idx !== undefined ? row[idx] : undefined;
          return v !== undefined && String(v).trim() !== '';
        });

        if (!rowHasContent) {
          isSkipped = true;
          skipReason = 'Row is empty across all non-id columns';
          uploadResult.skippedRows++;

          const log = logRowProcessing(
            i,
            excelRowNumber,
            originalData,
            processedData,
            rowValidationErrors,
            isSkipped,
            skipReason
          );
          processingLogs.push(log);
          continue;
        }

        for (const mapping of columns) {
          const colIndex = getHeaderIndex(mapping.excelHeader);
          let rawValue = colIndex !== undefined ? row[colIndex] : undefined;

          try {
            if (
              (mapping.dbKey === 'id' ||
                mapping.dbKey.endsWith('_id') ||
                mapping.dbKey === 'parent_id') &&
              (rawValue === '' || rawValue === undefined)
            ) {
              rawValue = null;
            }

            {
              const key = String(mapping.dbKey || '').toLowerCase();
              const isIPField =
                key === 'ip_address' || key.endsWith('_ip') || key.includes('ipaddr');
              if (isIPField && typeof rawValue === 'string') {
                const trimmed = rawValue.trim();
                rawValue = trimmed === '' ? null : trimmed;
              }
            }

            if (mapping.dbKey === 'id' && rowHasContent) {
              if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
                rawValue = generateUUID();
              }
            }

            let finalValue: unknown;
            if (mapping.transform) {
              try {
                finalValue = mapping.transform(rawValue);
              } catch (transformError) {
                const errorMsg =
                  transformError instanceof Error ? transformError.message : 'Transform failed';
                const validationError: ValidationError = {
                  rowIndex: i,
                  column: mapping.dbKey,
                  value: rawValue,
                  error: `Transform failed for "${mapping.dbKey}": ${errorMsg}`,
                };
                rowValidationErrors.push(validationError);
                allValidationErrors.push(validationError);
                finalValue = rawValue;
              }
            } else {
              finalValue = rawValue;
            }

            const validationError = validateValue(
              finalValue,
              mapping.dbKey,
              mapping.required || false
            );

            if (validationError) {
              validationError.rowIndex = i;
              rowValidationErrors.push(validationError);
              allValidationErrors.push(validationError);
            }

            let assignValue =
              finalValue !== undefined ? finalValue : rawValue !== undefined ? rawValue : null;

            if (typeof assignValue === 'string' && assignValue.trim() === '') {
              assignValue = null;
            }

            processedData[mapping.dbKey] = assignValue;

            logColumnTransformation(i, mapping.dbKey, rawValue, assignValue);
          } catch (columnError) {
            const errorMsg =
              columnError instanceof Error ? columnError.message : 'Unknown column error';
            const validationError: ValidationError = {
              rowIndex: i,
              column: mapping.dbKey,
              value: rawValue,
              error: `Column processing failed: ${errorMsg}`,
            };
            rowValidationErrors.push(validationError);
            allValidationErrors.push(validationError);
          }
        }

        if (staticData) {
          Object.assign(processedData, staticData);
        }

        const hasRequiredFieldErrors = rowValidationErrors.some(
          (err) => err.error.includes('Required field') || err.error.includes('Missing required')
        );

        if (hasRequiredFieldErrors) {
          isSkipped = true;
          skipReason = `Validation failed: ${rowValidationErrors.map((e) => e.error).join('; ')}`;
          uploadResult.errorCount += 1;
          uploadResult.skippedRows++;

          uploadResult.errors.push({
            rowIndex: excelRowNumber,
            data: processedData as Record<string, unknown>,
            error: skipReason,
          });
        } else {
          recordsToProcess.push(processedData as TableInsert<T>);
        }

        const log = logRowProcessing(
          i,
          excelRowNumber,
          originalData,
          processedData,
          rowValidationErrors,
          isSkipped,
          skipReason
        );
        processingLogs.push(log);
      }

      if (uploadType === 'upsert' && conflictColumn) {
        const conflictCols = String(conflictColumn)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (conflictCols.length > 0) {
          const seen = new Set<string>();
          const deduped: TableInsert<T>[] = [];

          for (const rec of recordsToProcess) {
            const values = conflictCols.map((c) => (rec as Record<string, unknown>)[c]);
            const allPresent = values.every(
              (v) => v !== undefined && v !== null && !(typeof v === 'string' && v === '')
            );

            if (!allPresent) {
              if (!conflictCols.includes('id')) delete (rec as Record<string, unknown>).id;
              deduped.push(rec);
              continue;
            }

            const normalized = values.map((v) =>
              typeof v === 'string' ? v.trim().toLowerCase() : v
            );
            const key = JSON.stringify(normalized);

            if (!seen.has(key)) {
              seen.add(key);
              if (!conflictCols.includes('id')) delete (rec as Record<string, unknown>).id;
              deduped.push(rec);
            }
          }
          recordsToProcess = deduped;
        }
      }

      uploadResult.totalRows = recordsToProcess.length;

      if (recordsToProcess.length === 0) {
        toast.warning('No valid records found to upload after processing.');
        return uploadResult;
      }

      for (let i = 0; i < recordsToProcess.length; i += batchSize) {
        const batch = recordsToProcess.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / recordsToProcess.length) * 100);
        toast.info(`Uploading batch ${Math.floor(i / batchSize) + 1}... (${progress}%)`);

        try {
          let query;
          if (uploadType === 'insert') {
            query = insertBatch(batch as TableInsert<T>[]);
          } else {
            query = upsertBatch(batch as TableInsert<T>[], conflictColumn as string);
          }

          const { error } = await query;

          if (error) {
            uploadResult.errorCount += batch.length;
            uploadResult.errors.push({
              rowIndex: i,
              data: batch,
              error: error.message,
            });

            if (showToasts) {
              toast.error(`Error in batch: ${error.message}`);
            }
          } else {
            uploadResult.successCount += batch.length;
          }
        } catch (unexpectedError) {
          const errorMsg =
            unexpectedError instanceof Error ? unexpectedError.message : 'Unexpected error';
          uploadResult.errorCount += batch.length;
          uploadResult.errors.push({
            rowIndex: i,
            data: batch,
            error: errorMsg,
          });
        }
      }

      if (uploadResult.errorCount > 0) {
        if (showToasts)
          toast.warning(`${uploadResult.successCount} saved, ${uploadResult.errorCount} failed.`);
      } else {
        if (showToasts)
          toast.success(`Successfully uploaded ${uploadResult.successCount} records.`);

        try {
          await queryClient.invalidateQueries({
            predicate: (q) => {
              const key = q.queryKey as unknown[];
              if (!Array.isArray(key)) return false;
              return key.some((seg) => {
                if (seg === tableName) return true;
                if (
                  typeof seg === 'string' &&
                  seg.toLowerCase().includes(String(tableName).toLowerCase())
                )
                  return true;
                return false;
              });
            },
          });
        } catch (err) {
          console.log(err);
        }
      }

      return uploadResult;
    },
    ...mutationOptions,
  });
}
