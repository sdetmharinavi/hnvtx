// src/stores/useUploadConfigStore.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TableName, TableNames } from "@/config/helper-types";
import { Tables } from "@/types/supabase-types";

type UploadableTableRow<T extends TableNames> = T extends TableName
  ? Tables<T>
  : Record<string, unknown>;

export interface UploadColumnMapping<T extends TableNames> {
  excelHeader: string;
  dbKey: keyof UploadableTableRow<T> & string;
  transform?: (value: unknown) => unknown;
}

export interface UploadConfig<T extends TableNames> {
  tableName: T;
  columnMapping: UploadColumnMapping<T>[];
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof UploadableTableRow<T> & string;
  isUploadEnabled: boolean;
}

interface UploadConfigState {
  configs: Record<string, UploadConfig<TableNames>>;
  setUploadConfig: <T extends TableNames>(pageKey: string, config: UploadConfig<T>) => void;
  getUploadConfig: (pageKey: string) => UploadConfig<TableNames> | undefined;
  clearUploadConfig: (pageKey: string) => void;
}

export const useUploadConfigStore = create<UploadConfigState>()(
  persist( // `persist` should be the outer wrapper
    devtools( // `devtools` should be the inner wrapper
      (set, get) => ({
        // The store's state is a dictionary of configurations.
        configs: {},

        setUploadConfig: (pageKey, config) => {
          if (config?.uploadType === "upsert" && !config.conflictColumn) {
            console.error(`UploadConfig Error...`);
          }
          set((state) => ({
            configs: {
              ...state.configs,
              [pageKey]: config,
            },
          }));
        },

        getUploadConfig: (pageKey) => {
          return get().configs[pageKey];
        },

        clearUploadConfig: (pageKey) => {
          set((state) => {
            const newConfigs = { ...state.configs };
            delete newConfigs[pageKey];
            return { configs: newConfigs };
          });
        },
      }),
      // The options object for devtools
      {
        name: "UploadConfigStore",
      }
    ),
    // The options object for persist
    {
      name: "upload-config-storage", // Use a different key for localStorage
    }
  )
);