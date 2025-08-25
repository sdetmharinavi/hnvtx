import { TableNames } from "@/config/helper-types";
import { buildUploadConfig, TABLES } from "@/config/table-column-keys";

// Thin adapter: build per-table upload config from SSOT
const defaultUploadConfigs = () => {
  const result: Partial<
    Record<TableNames, ReturnType<typeof buildUploadConfig<TableNames>>>
  > = {};

  (Object.keys(TABLES) as TableNames[]).forEach((tableName) => {
    result[tableName] = buildUploadConfig(tableName);
  });

  return result as Record<
    TableNames,
    ReturnType<typeof buildUploadConfig<TableNames>>
  >;
};

export default defaultUploadConfigs;
