import {
  TableInsert,
  PublicTableName,
  UploadOptions,
  UseExcelUploadOptions,
} from '@/hooks/database/queries-type-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EnhancedUploadResult,
  generateUUID,
  logColumnTransformation,
  logRowProcessing,
  ProcessingLog,
  validateValue,
  ValidationError,
} from '@/hooks/database/excel-queries/excel-helpers';
import { toast } from 'sonner';

//================================================================================
// UPLOAD FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = async (file: File): Promise<unknown[][]> => {
  // THE FIX: Dynamic Import
  const XLSX = await import('xlsx');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
          throw new Error('File reading failed.');
        }
        const buffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) {
          throw new Error('No worksheet found in the file.');
        }
        const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: '',
        });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`FileReader error: ${error.type}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

//================================================================================
// MAIN ENHANCED UPLOAD HOOK
//================================================================================

/**
 * Enhanced React hook for uploading data from an Excel file to a Supabase table using 'xlsx'.
 * Includes comprehensive logging and error tracking.
 */
export function useExcelUpload<T extends PublicTableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseExcelUploadOptions<T>
) {
  const { showToasts = true, batchSize = 500, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
    mutationFn: async (uploadOptions: UploadOptions<T>): Promise<EnhancedUploadResult> => {
      const { file, columns, uploadType = 'upsert', conflictColumn } = uploadOptions;

      if (uploadType === 'upsert' && !conflictColumn) {
        throw new Error("A 'conflictColumn' must be specified for 'upsert' operations.");
      }

      const processingLogs: ProcessingLog[] = [];
      const allValidationErrors: ValidationError[] = [];

      toast.info('Reading and parsing Excel file...');

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

      const isFirstColumnId = String(excelHeaders?.[0] ?? '').toLowerCase() === 'id';

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

      const upsertOne = async (row: TableInsert<T>, onConflict: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return supabase.from(tableName).upsert(row as any, { onConflict });
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
              if (
                isFirstColumnId &&
                (rawValue === null || rawValue === undefined || String(rawValue).trim() === '')
              ) {
                rawValue = generateUUID();
              }
              if (colIndex === undefined) {
                rawValue = generateUUID();
              }
            }

            let finalValue: unknown;
            if (mapping.transform) {
              try {
                finalValue = mapping.transform(rawValue);
              } catch (transformError) {
                const errorMsg =
                  transformError instanceof Error
                    ? transformError.message
                    : 'Transform function failed';

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
              columnError instanceof Error
                ? columnError.message
                : 'Unknown column processing error';

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
              if (!conflictCols.includes('id')) {
                delete (rec as Record<string, unknown>).id;
              }
              deduped.push(rec);
              continue;
            }

            const normalized = values.map((v) =>
              typeof v === 'string' ? v.trim().toLowerCase() : v
            );
            const key = JSON.stringify(normalized);

            if (!seen.has(key)) {
              seen.add(key);
              if (!conflictCols.includes('id')) {
                delete (rec as Record<string, unknown>).id;
              }
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

        const isCompositeConflict =
          uploadType === 'upsert' && conflictColumn && String(conflictColumn).split(',').length > 1;

        if (isCompositeConflict) {
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];

            try {
              const { error } = await upsertOne(row as TableInsert<T>, conflictColumn as string);

              if (error) {
                uploadResult.errorCount += 1;
                uploadResult.errors.push({
                  rowIndex: i + j,
                  data: row as Record<string, unknown>,
                  error: error.message,
                });
                if (showToasts) {
                  toast.error(`Error at record ${i + j + 1}: ${error.message}`);
                }
              } else {
                uploadResult.successCount += 1;
              }
            } catch (unexpectedError) {
              const errorMsg =
                unexpectedError instanceof Error
                  ? unexpectedError.message
                  : 'Unexpected error during individual upsert';
              uploadResult.errorCount += 1;
              uploadResult.errors.push({
                rowIndex: i + j,
                data: row as Record<string, unknown>,
                error: errorMsg,
              });
            }
          }
          continue;
        }

        try {
          let query;
          if (uploadType === 'insert') {
            query = insertBatch(batch as TableInsert<T>[]);
          } else {
            query = upsertBatch(batch as TableInsert<T>[], conflictColumn as string);
          }

          const { error } = await query;

          if (error) {
            // Error handling logic... (Keep existing error handling logic from your previous file)
            if (error.code === '23503' && error.message.includes('ofc_cables_sn_id_fkey')) {
              type RecordWithSnId = { sn_id?: unknown };
              const getSnId = (record: unknown): string | undefined => {
                if (record && typeof record === 'object' && 'sn_id' in record) {
                  const value = (record as RecordWithSnId).sn_id;
                  return value !== null && value !== undefined ? String(value) : undefined;
                }
                return undefined;
              };

              const invalidSnIds = [
                ...new Set(
                  batch.map((record) => getSnId(record)).filter((id): id is string => Boolean(id))
                ),
              ];

              batch.forEach((record, index) => {
                const snId = getSnId(record);
                if (snId) {
                  uploadResult.validationErrors.push({
                    rowIndex: i + index,
                    column: 'sn_id',
                    value: snId,
                    error: `Foreign key violation: sn_id '${snId}' does not exist in the nodes table`,
                    data: { column: 'sn_id', value: snId, constraint: 'ofc_cables_sn_id_fkey' },
                  });
                }
              });

              const errorMessage =
                `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found in batch. ` +
                `Invalid values: ${invalidSnIds.join(', ')}`;
              uploadResult.errorCount += batch.length;
              uploadResult.errors.push({
                rowIndex: i,
                data: batch,
                error: errorMessage,
              });

              if (showToasts) {
                toast.error(
                  `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found. ` +
                    'Check the console for details.',
                  { duration: 10000 }
                );
              }
            } else {
              const errorDetails: Record<string, unknown> = {};
              if (error.code === '23503') {
                errorDetails.constraint = error.message.match(/constraint "(.*?)"/)?.[1];
                errorDetails.detail = error.message;
              }
              uploadResult.errorCount += batch.length;
              uploadResult.errors.push({
                rowIndex: i,
                data: batch,
                error: error.message,
                ...(Object.keys(errorDetails).length > 0 ? { details: errorDetails } : {}),
              });

              if (showToasts) {
                toast.error(`Error in batch starting at record ${i + 1}: ${error.message}`);
              }
            }
          } else {
            uploadResult.successCount += batch.length;
          }
        } catch (unexpectedError) {
          const errorMsg =
            unexpectedError instanceof Error
              ? unexpectedError.message
              : 'Unexpected error during batch operation';
          uploadResult.errorCount += batch.length;
          uploadResult.errors.push({
            rowIndex: i,
            data: batch,
            error: errorMsg,
          });
        }
      }

      if (uploadResult.errorCount > 0) {
        if (showToasts) {
          toast.warning(
            `${uploadResult.successCount} rows uploaded successfully, but ${uploadResult.errorCount} failed. Check console for details.`
          );
        }
      } else {
        if (showToasts) {
          toast.success(
            `Successfully uploaded ${uploadResult.successCount} of ${uploadResult.totalRows} records.`
          );
        }

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
          await queryClient.refetchQueries({
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
            type: 'active',
          });
        } catch (err) {
          console.log(err);

          // Query invalidation failed silently
        }
      }

      return uploadResult;
    },
    ...mutationOptions,
  });
}
