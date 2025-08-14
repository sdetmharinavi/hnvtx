// src/stores/useUploadConfigStore.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TableName, TableInsert } from "@/hooks/database";

// ... (interfaces remain the same)
export interface UploadColumnMapping<T extends TableName> {
  excelHeader: string;
  dbKey: keyof TableInsert<T> & string;
  transform?: (value: unknown) => unknown;
}

export interface UploadConfig<T extends TableName> {
  tableName: T;
  columnMapping: UploadColumnMapping<T>[];
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof TableInsert<T> & string;
  isUploadEnabled: boolean;
}

interface UploadConfigState {
  configs: Record<string, UploadConfig<TableName>>;
  setUploadConfig: <T extends TableName>(pageKey: string, config: UploadConfig<T>) => void;
  getUploadConfig: (pageKey: string) => UploadConfig<TableName> | undefined;
  clearUploadConfig: (pageKey: string) => void;
}


// =================================================================
// THE FIX IS HERE: Swap the order of 'persist' and 'devtools'
// It should be `persist(devtools(...))`
// =================================================================
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