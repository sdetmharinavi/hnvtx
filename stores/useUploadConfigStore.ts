// src/stores/useUploadConfigStore.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { PublicTableName} from "@/hooks/database/queries-type-helpers";
import { Tables } from "@/types/supabase-types";

type UploadableTableRow<T extends PublicTableName> = Tables<T>;

export interface UploadColumnMapping<T extends PublicTableName> {
  excelHeader: string;
  dbKey: keyof UploadableTableRow<T> & string;
  transform?: (value: unknown) => unknown;
}

export interface UploadConfig<T extends PublicTableName> {
  tableName: T;
  columnMapping: UploadColumnMapping<T>[];
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof UploadableTableRow<T> & string;
  isUploadEnabled: boolean;
}

interface UploadConfigState {
  configs: Record<string, UploadConfig<PublicTableName>>;
  setUploadConfig: <T extends PublicTableName>(pageKey: string, config: UploadConfig<T>) => void;
  getUploadConfig: (pageKey: string) => UploadConfig<PublicTableName> | undefined;
  clearUploadConfig: (pageKey: string) => void;
}

export const useUploadConfigStore = create<UploadConfigState>()(
  persist(
    devtools(
      (set, get) => ({
        configs: {},
        setUploadConfig: (pageKey, config) => {
          if (config?.uploadType === "upsert" && !config.conflictColumn) {
            console.error(`UploadConfig Error...`);
          }
          set((state) => ({
            configs: { ...state.configs, [pageKey]: config },
          }));
        },
        getUploadConfig: (pageKey) => get().configs[pageKey],
        clearUploadConfig: (pageKey) => {
          set((state) => {
            const newConfigs = { ...state.configs };
            delete newConfigs[pageKey];
            return { configs: newConfigs };
          });
        },
      }),
      { name: "UploadConfigStore" }
    ),
    { name: "upload-config-storage" }
  )
);