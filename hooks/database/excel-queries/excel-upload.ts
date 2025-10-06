import * as XLSX from "xlsx";
import { TableInsert, PublicTableName, UploadOptions, UseExcelUploadOptions } from "@/hooks/database/queries-type-helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EnhancedUploadResult, generateUUID, logColumnTransformation, logRowProcessing, ProcessingLog, validateValue, ValidationError } from "@/hooks/database/excel-queries/excel-helpers";
import { toast } from "sonner";

//================================================================================
// UPLOAD FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = (file: File): Promise<unknown[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          if (!event.target?.result) {
            throw new Error("File reading failed.");
          }
          const buffer = event.target.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: "array" });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          if (!worksheet) {
            throw new Error("No worksheet found in the file.");
          }
          // header: 1 tells sheet_to_json to return an array of arrays
          // defval: '' preserves empty cells so column indices stay aligned
          const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: "",
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
    const {
      showToasts = true,
      batchSize = 500,
      ...mutationOptions
    } = options || {};
    const queryClient = useQueryClient();
  
    return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
      mutationFn: async (
        uploadOptions: UploadOptions<T>
      ): Promise<EnhancedUploadResult> => {
        const {
          file,
          columns,
          uploadType = "upsert",
          conflictColumn,
        } = uploadOptions;
  
        // console.group("🚀 Excel Upload Process Started");
        // console.log("📁 File:", file.name, `(${file.size} bytes)`);
        // console.log("🎯 Table:", tableName);
        // console.log("📋 Upload Type:", uploadType);
        // console.log("🔑 Conflict Column:", conflictColumn);
        // console.log("📊 Column Mappings:", columns);
  
        if (uploadType === "upsert" && !conflictColumn) {
          throw new Error(
            "A 'conflictColumn' must be specified for 'upsert' operations."
          );
        }
  
        const processingLogs: ProcessingLog[] = [];
        const allValidationErrors: ValidationError[] = [];
  
        toast.info("Reading and parsing Excel file...");
  
        // 1. Parse the Excel file using our xlsx utility function
        const jsonData = await parseExcelFile(file);
  
        // console.log("📊 Raw Excel Data:", {
        //   totalRows: jsonData.length,
        //   headers: jsonData[0],
        //   sampleData: jsonData.slice(1, 4), // Show first 3 data rows
        // });
  
        if (!jsonData || jsonData.length < 2) {
          toast.warning(
            "No data found in the Excel file. (A header row and at least one data row are required)."
          );
          console.groupEnd();
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
  
        // 2. Map Excel headers to their column index for efficient lookup
        const excelHeaders: string[] = jsonData[0] as string[];
        const headerMap: Record<string, number> = {};
        // console.log("📝 Excel Headers:", excelHeaders);
        
        excelHeaders.forEach((header, index) => {
          const cleanHeader = String(header).trim().toLowerCase();
          headerMap[cleanHeader] = index;
          // console.log(`   [${index}]: "${header}" -> "${cleanHeader}"`);
        });
        
        const isFirstColumnId =
          String(excelHeaders?.[0] ?? "").toLowerCase() === "id";
        // console.log("🆔 First column is ID:", isFirstColumnId);
  
        // 3. Validate that all required columns from the mapping exist in the file
        const getHeaderIndex = (name: string): number | undefined =>
          headerMap[String(name).trim().toLowerCase()];
  
        // console.group("🔍 Column Mapping Validation");
        // for (const mapping of columns) {
        //   const idx = getHeaderIndex(mapping.excelHeader);
        //   console.log(`📍 "${mapping.excelHeader}" -> "${mapping.dbKey}":`, 
        //     idx !== undefined ? `Column ${idx}` : "❌ NOT FOUND");
          
        //   // Allow missing 'id' header so we can auto-generate UUIDs during processing
        //   if (idx === undefined && mapping.dbKey !== "id") {
        //     console.error(`❌ Required column "${mapping.excelHeader}" not found in Excel file`);
        //     throw new Error(
        //       `Required column "${mapping.excelHeader}" not found in the Excel file.`
        //     );
        //   }
        // }
        // console.groupEnd();
  
        toast.info(
          `Found ${jsonData.length - 1} rows. Preparing data for upload...`
        );
  
        // 4. Process rows and transform data into the format for Supabase
        const dataRows = jsonData.slice(1);
  
        // Helper: determine if a row is effectively empty (ignoring 'id')
        const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
          for (const mapping of columns) {
            if (mapping.dbKey === "id") continue; // ignore id when checking emptiness
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            if (v !== undefined && String(v).trim() !== "") {
              return false; // has some non-empty value in a non-id column
            }
          }
          return true;
        };
  
        // Filter out rows that are empty across all non-id columns, keep index for error reporting
        const filteredRows = dataRows
          .map((row, idx) => ({ row: row as unknown[], idx }))
          .filter(({ row }) => !isRowEffectivelyEmpty(row));
  
        // console.log(`🎯 Filtered ${dataRows.length} rows down to ${filteredRows.length} non-empty rows`);
  
        // Initialize upload result early to record pre-insert validation errors
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

        // Helpers capture the hook's generic T via closure over tableName
        const insertBatch = async (
          rows: TableInsert<T>[]
        ) => {
          // T is a generic (union of table names) here; Supabase's overloads require a concrete table literal.
          // A localized cast is used to bridge this at the single boundary to Supabase.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).insert(rows as any);
        };

        const upsertBatch = async (
          rows: TableInsert<T>[],
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(rows as any, { onConflict });
        };

        const upsertOne = async (
          row: TableInsert<T>,
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(row as any, { onConflict });
        };
  
        console.group("🔄 Row Processing Phase");
        
        for (let i = 0; i < filteredRows.length; i++) {
          const { row, idx } = filteredRows[i];
          const excelRowNumber = idx + 2; // +2 because Excel is 1-indexed and we skip header
          
          const originalData: Record<string, unknown> = {};
          const processedData: Record<string, unknown> = {};
          const rowValidationErrors: ValidationError[] = [];
          let isSkipped = false;
          let skipReason: string | undefined;
  
          // Build original data object for logging
          excelHeaders.forEach((header, headerIdx) => {
            originalData[header] = row[headerIdx];
          });
  
          // Secondary safeguard: determine if row has any meaningful non-id value
          const rowHasContent = columns.some((mapping) => {
            if (mapping.dbKey === "id") return false;
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            return v !== undefined && String(v).trim() !== "";
          });
  
          if (!rowHasContent) {
            // Skip rows that are effectively empty across non-id columns
            isSkipped = true;
            skipReason = "Row is empty across all non-id columns";
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
  
          // Process each column mapping
          for (const mapping of columns) {
            const colIndex = getHeaderIndex(mapping.excelHeader);
            // Guard: only index row when we have a valid column index
            let rawValue = colIndex !== undefined ? row[colIndex] : undefined;
  
            // console.group(`🔧 Processing "${mapping.dbKey}" (Excel: "${mapping.excelHeader}")`);
            // console.log(`📍 Column Index: ${colIndex}`);
            // console.log(`📊 Raw Value:`, rawValue, `(${typeof rawValue})`);
  
            try {
              // Normalize empty strings to null for UUID-like fields
              if (
                (mapping.dbKey === "id" ||
                  mapping.dbKey.endsWith("_id") ||
                  mapping.dbKey === "parent_id") &&
                (rawValue === "" || rawValue === undefined)
              ) {
                rawValue = null;
                // console.log("🔄 Normalized empty UUID field to null");
              }
  
              // Normalize IP address-like fields for inet columns: trim and empty -> null
              // Targets include: 'ip_address', any key ending with '_ip', or containing 'ipaddr'
              {
                const key = String(mapping.dbKey || "").toLowerCase();
                const isIPField =
                  key === "ip_address" ||
                  key.endsWith("_ip") ||
                  key.includes("ipaddr");
                if (isIPField && typeof rawValue === "string") {
                  const trimmed = rawValue.trim();
                  rawValue = trimmed === "" ? null : trimmed;
                  // console.log("🌐 Processed IP field:", rawValue);
                }
              }
  
              // Only generate a UUID for `id` if the row actually has content
              if (mapping.dbKey === "id" && rowHasContent) {
                // If first Excel column is id/ID and current mapping is for 'id', auto-generate UUID when empty
                if (
                  isFirstColumnId &&
                  (rawValue === null ||
                    rawValue === undefined ||
                    String(rawValue).trim() === "")
                ) {
                  rawValue = generateUUID();
                  // console.log("🆔 Generated UUID for empty ID:", rawValue);
                }
                // If 'id' header is entirely missing, still generate a UUID
                if (colIndex === undefined) {
                  rawValue = generateUUID();
                  // console.log("🆔 Generated UUID for missing ID column:", rawValue);
                }
              }
  
              // Use the transform function if available, otherwise use the raw value
              let finalValue: unknown;
              if (mapping.transform) {
                try {
                  finalValue = mapping.transform(rawValue);
                  // console.log("🔧 Transformed value:", finalValue, `(${typeof finalValue})`);
                } catch (transformError) {
                  const errorMsg = transformError instanceof Error 
                    ? transformError.message 
                    : "Transform function failed";
                  console.error("❌ Transform error:", errorMsg);
                  
                  const validationError: ValidationError = {
                    rowIndex: i,
                    column: mapping.dbKey,
                    value: rawValue,
                    error: `Transform failed for "${mapping.dbKey}": ${errorMsg}`,
                  };
                  rowValidationErrors.push(validationError);
                  allValidationErrors.push(validationError);
                  finalValue = rawValue; // Use raw value as fallback
                }
              } else {
                finalValue = rawValue;
              }
  
              // Validate the processed value
              const validationError = validateValue(
                finalValue, 
                mapping.dbKey, 
                mapping.required || false
              );
              
              if (validationError) {
                validationError.rowIndex = i;
                rowValidationErrors.push(validationError);
                allValidationErrors.push(validationError);
                console.error("❌ Validation failed:", validationError.error);
              }
  
              // Assign the processed value to the correct database key
              // Normalize empty strings to null to satisfy numeric/date/inet columns
              let assignValue =
                finalValue !== undefined
                  ? finalValue
                  : rawValue !== undefined
                  ? rawValue
                  : null;
              
              if (typeof assignValue === "string" && assignValue.trim() === "") {
                assignValue = null;
                // console.log("🧹 Normalized empty string to null");
              }
              
              processedData[mapping.dbKey] = assignValue;
              // console.log("✅ Final assigned value:", assignValue, `(${typeof assignValue})`);
  
              logColumnTransformation(
                i,
                mapping.dbKey,
                rawValue,
                assignValue
              );
  
            } catch (columnError) {
              const errorMsg = columnError instanceof Error 
                ? columnError.message 
                : "Unknown column processing error";
              console.error("💥 Column processing error:", errorMsg);
              
              const validationError: ValidationError = {
                rowIndex: i,
                column: mapping.dbKey,
                value: rawValue,
                error: `Column processing failed: ${errorMsg}`,
              };
              rowValidationErrors.push(validationError);
              allValidationErrors.push(validationError);
            } finally {
              console.groupEnd();
            }
          }
  
          // Check if row has validation errors
          const hasRequiredFieldErrors = rowValidationErrors.some(err => 
            err.error.includes("Required field") || err.error.includes("Missing required")
          );
  
          if (hasRequiredFieldErrors) {
            // Record a validation error for this row and skip it
            isSkipped = true;
            skipReason = `Validation failed: ${rowValidationErrors.map(e => e.error).join("; ")}`;
            uploadResult.errorCount += 1;
            uploadResult.skippedRows++;
            
            uploadResult.errors.push({
              rowIndex: excelRowNumber,
              data: processedData as Record<string, unknown>,
              error: skipReason,
            });
          } else {
            // Add to records to process
            recordsToProcess.push(processedData as TableInsert<T>);
          }
  
          // Log the complete row processing
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
        
        console.groupEnd(); // End Row Processing Phase
  
        // console.log(`📊 Processing Summary:`);
        // console.log(`   Total filtered rows: ${filteredRows.length}`);
        // console.log(`   Records to process: ${recordsToProcess.length}`);
        // console.log(`   Skipped rows: ${uploadResult.skippedRows}`);
        // console.log(`   Validation errors: ${allValidationErrors.length}`);
  
        // Deduplicate by conflict columns to avoid Postgres error:
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        if (uploadType === "upsert" && conflictColumn) {
          console.group("🔄 Deduplication Process");
          
          const conflictCols = String(conflictColumn)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
  
          // console.log("🎯 Conflict columns:", conflictCols);
  
          if (conflictCols.length > 0) {
            const seen = new Set<string>();
            const deduped: TableInsert<T>[] = [];
            let duplicateCount = 0;
            
            for (const rec of recordsToProcess) {
              const values = conflictCols.map((c) => (rec as Record<string, unknown>)[c]);
              const allPresent = values.every(
                (v) =>
                  v !== undefined &&
                  v !== null &&
                  !(typeof v === "string" && v === "")
              );
              
              if (!allPresent) {
                // Do not dedupe records missing conflict values; still avoid PK updates on composite keys
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                // console.log("➕ Added record with missing conflict values (no deduplication)");
                continue;
              }
  
              // Normalize strings for dedupe to match DB uniqueness (trim + lowercase)
              const normalized = values.map((v) =>
                typeof v === "string" ? v.trim().toLowerCase() : v
              );
              const key = JSON.stringify(normalized);
              
              if (!seen.has(key)) {
                seen.add(key);
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                // console.log(`➕ Added unique record with key: ${key}`);
              } else {
                duplicateCount++;
                // console.log(`⏭️  Skipped duplicate record with key: ${key}`);
              }
            }
            
            // console.log(`📊 Deduplication results:`);
            // console.log(`   Original records: ${recordsToProcess.length}`);
            // console.log(`   After deduplication: ${deduped.length}`);
            // console.log(`   Duplicates removed: ${duplicateCount}`);
            
            recordsToProcess = deduped;
          }
          
          console.groupEnd();
        }
  
        // 5. Perform batch upload to Supabase
        uploadResult.totalRows = recordsToProcess.length;
        // console.log(`🚀 Starting Supabase upload for ${uploadResult.totalRows} records`);
  
        if (recordsToProcess.length === 0) {
          // console.log("⚠️ No records to upload after processing");
          toast.warning("No valid records found to upload after processing.");
          console.groupEnd();
          return uploadResult;
        }
  
        console.group("📤 Supabase Upload Process");
  
        for (let i = 0; i < recordsToProcess.length; i += batchSize) {
          const batch = recordsToProcess.slice(i, i + batchSize);
          const progress = Math.round(
            ((i + batch.length) / recordsToProcess.length) * 100
          );
          toast.info(`Uploading batch ${Math.floor(i / batchSize) + 1}... (${progress}%)`);
          
          // console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`);
          // console.log(`   Range: ${i} - ${i + batch.length - 1}`);
          // console.log(`   Batch size: ${batch.length}`);
          // console.log(`   Progress: ${progress}%`);
          // console.log("📊 Batch data sample:", batch.slice(0, 2)); // Show first 2 records
  
          // If using composite conflict keys, upsert rows one-by-one to avoid
          // "ON CONFLICT DO UPDATE command cannot affect row a second time"
          const isCompositeConflict =
            uploadType === "upsert" &&
            conflictColumn &&
            String(conflictColumn).split(",").length > 1;
            
          if (isCompositeConflict) {
            // console.log("🔄 Using individual upserts for composite conflict keys");
            
            for (let j = 0; j < batch.length; j++) {
              const row = batch[j];
              // console.log(`📝 Upserting individual record ${i + j + 1}:`, row);
              
              try {
                const { error } = await upsertOne(row as TableInsert<T>, conflictColumn as string);
                  
                if (error) {
                  console.error(`❌ Individual upsert failed for record ${i + j + 1}:`, error);
                  uploadResult.errorCount += 1;
                  uploadResult.errors.push({
                    rowIndex: i + j,
                    data: row as Record<string, unknown>,
                    error: error.message,
                  });
                  if (showToasts) {
                    toast.error(
                      `Error at record ${i + j + 1}: ${error.message}`
                    );
                  }
                } else {
                  // console.log(`✅ Individual upsert successful for record ${i + j + 1}`);
                  uploadResult.successCount += 1;
                }
              } catch (unexpectedError) {
                const errorMsg = unexpectedError instanceof Error 
                  ? unexpectedError.message 
                  : "Unexpected error during individual upsert";
                console.error(`💥 Unexpected error during individual upsert:`, unexpectedError);
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
  
          // Regular batch processing
          // console.log(`🚀 Executing batch ${uploadType} operation`);
          
          try {
            let query;
            if (uploadType === "insert") {
              // console.log("➕ Using INSERT operation");
              query = insertBatch(batch as TableInsert<T>[]);
            } else {
              // console.log(`🔄 Using UPSERT operation with conflict: ${conflictColumn}`);
              query = upsertBatch(batch as TableInsert<T>[], conflictColumn as string);
            }
  
            const { error } = await query;
            
            if (error) {
              // Handle foreign key constraint violation specifically
              if (error.code === '23503' && error.message.includes('ofc_cables_sn_id_fkey')) {
                // Type-safe access to sn_id
                type RecordWithSnId = { sn_id?: unknown };
                const getSnId = (record: unknown): string | undefined => {
                  if (record && typeof record === 'object' && 'sn_id' in record) {
                    const value = (record as RecordWithSnId).sn_id;
                    return value !== null && value !== undefined ? String(value) : undefined;
                  }
                  return undefined;
                };
                
                // Extract all unique sn_ids from the batch that caused the error
                const invalidSnIds = [...new Set(
                  batch.map(record => getSnId(record)).filter((id): id is string => Boolean(id))
                )];
                
                // Log detailed error information
                console.error('Foreign key violation details:', {
                  table: tableName,
                  constraint: 'ofc_cables_sn_id_fkey',
                  invalidValues: invalidSnIds,
                  error: error.message
                });
                
                // Add validation errors for each affected row
                batch.forEach((record, index) => {
                  const snId = getSnId(record);
                  if (snId) {
                    uploadResult.validationErrors.push({
                      rowIndex: i + index,
                      column: 'sn_id',
                      value: snId,
                      error: `Foreign key violation: sn_id '${snId}' does not exist in the nodes table`,
                      data: { column: 'sn_id', value: snId, constraint: 'ofc_cables_sn_id_fkey' }
                    });
                  }
                });
                
                // Add a summary error to the upload result
                const errorMessage = `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found in batch. ` +
                  `Invalid values: ${invalidSnIds.join(', ')}`;
                uploadResult.errorCount += batch.length;
                uploadResult.errors.push({
                  rowIndex: i,
                  data: batch,
                  error: errorMessage
                });
                
                // Show user-friendly error message
                if (showToasts) {
                  toast.error(
                    `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found. ` +
                    'Check the console for details.',
                    { duration: 10000 }
                  );
                }
              } else {
                // Handle other types of errors
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
                  ...(Object.keys(errorDetails).length > 0 ? { details: errorDetails } : {})
                });
                
                if (showToasts) {
                  toast.error(`Error in batch starting at record ${i + 1}: ${error.message}`);
                }
              }
            } else {
              // console.log(`✅ Batch operation successful for ${batch.length} records`);
              uploadResult.successCount += batch.length;
            }
          } catch (unexpectedError) {
            const errorMsg = unexpectedError instanceof Error 
              ? unexpectedError.message 
              : "Unexpected error during batch operation";
            console.error(`💥 Unexpected error during batch operation:`, unexpectedError);
            uploadResult.errorCount += batch.length;
            uploadResult.errors.push({
              rowIndex: i,
              data: batch,
              error: errorMsg,
            });
          }
        }
        
        console.groupEnd(); // End Supabase Upload Process
  
        // 6. Finalize and report
        // console.group("📊 Upload Results Summary");
        // console.log(`✅ Successful uploads: ${uploadResult.successCount}`);
        // console.log(`❌ Failed uploads: ${uploadResult.errorCount}`);
        // console.log(`⏭️  Skipped rows: ${uploadResult.skippedRows}`);
        // console.log(`📝 Total processing logs: ${processingLogs.length}`);
        // console.log(`⚠️  Total validation errors: ${allValidationErrors.length}`);
        
        if (uploadResult.errors.length > 0) {
          // console.log("🔍 Upload errors:", uploadResult.errors);
        }
        
        if (allValidationErrors.length > 0) {
          // console.log("🔍 Validation errors:", allValidationErrors);
        }
        console.groupEnd();
  
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
          
          // Invalidate related queries instead of reloading the page to preserve UI state
          try {
            await queryClient.invalidateQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                // Match if any segment equals the tableName or contains it as a substring (to catch views/RPC keys like "v_ofc_cables_complete")
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
            });
            // Force refetch so UI reflects changes immediately even if staleTime is large
            await queryClient.refetchQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
              type: "active",
            });
            // console.log("✅ Query cache invalidated successfully");
          } catch (err) {
            console.warn("⚠️ Failed to invalidate queries after upload", err);
          }
        }
  
        console.groupEnd(); // End Excel Upload Process
        return uploadResult;
      },
      ...mutationOptions,
    });
  }