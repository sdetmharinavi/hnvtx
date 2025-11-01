import { buildUploadConfig, TABLE_COLUMN_KEYS } from "@/constants/table-column-keys";
import { PublicTableOrViewName } from "@/hooks/database/queries-type-helpers";

// Thin adapter: build per-table upload config from SSOT
const defaultUploadConfigs = () => {
  type T = PublicTableOrViewName;
  const result: Partial<
    Record<T, ReturnType<typeof buildUploadConfig<T>>>
  > = {};

  (Object.keys(TABLE_COLUMN_KEYS) as T[]).forEach((tableName) => {
    result[tableName] = buildUploadConfig(tableName);
  });

  return result as Record<
    T,
    ReturnType<typeof buildUploadConfig<T>>
  >;
};

export default defaultUploadConfigs;
