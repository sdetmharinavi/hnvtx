// stores/useUploadConfigStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PublicTableOrViewName, Row, PublicTableName } from '@/hooks/database/queries-type-helpers';
import { Tables } from '@/types/supabase-types';

export interface UploadColumnMapping<T extends PublicTableOrViewName> {
  excelHeader: string;
  dbKey: keyof Row<T> & string;
  transform?: (value: unknown) => unknown;
}

export interface UploadConfig<T extends PublicTableOrViewName> {
  tableName: T;
  columnMapping: UploadColumnMapping<T>[];
  uploadType: 'insert' | 'upsert';
  conflictColumn?: T extends PublicTableName ? keyof Tables<T> & string : never;
  isUploadEnabled: boolean;
}

interface UploadConfigState {
  configs: Record<string, UploadConfig<PublicTableOrViewName>>;
  setUploadConfig: <T extends PublicTableOrViewName>(
    pageKey: string,
    config: UploadConfig<T>
  ) => void;
  getUploadConfig: (pageKey: string) => UploadConfig<PublicTableOrViewName> | undefined;
  clearUploadConfig: (pageKey: string) => void;
}

export const useUploadConfigStore = create<UploadConfigState>()(
  persist(
    devtools(
      (set, get) => ({
        configs: {},
        setUploadConfig: (pageKey, config) => {
          if (config?.uploadType === 'upsert' && !config.conflictColumn) {
            console.error(`UploadConfig Error: An 'upsert' operation requires a 'conflictColumn'.`);
          }
          set((state) => ({
            configs: { ...state.configs, [pageKey]: config as UploadConfig<PublicTableOrViewName> },
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
      { name: 'UploadConfigStore' }
    ),
    { name: 'upload-config-storage' }
  )
);
