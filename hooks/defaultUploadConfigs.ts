import { TABLE_NAMES as CORE_TABLE_NAMES, buildUploadConfig, type TableName } from "@/config/table-column-keys";

export const TABLE_NAMES = CORE_TABLE_NAMES;
export type CurrentTableName = keyof typeof TABLE_NAMES;

// Thin adapter: build per-table upload config from SSOT
const defaultUploadConfigs = () => {
  const result: Record<string, ReturnType<typeof buildUploadConfig<TableName>>> = {};
  (Object.keys(TABLE_NAMES) as Array<keyof typeof TABLE_NAMES>).forEach((k) => {
    const table = TABLE_NAMES[k] as unknown as TableName;
    result[String(k)] = buildUploadConfig(table);
  });
  return result;
};

export default defaultUploadConfigs;
