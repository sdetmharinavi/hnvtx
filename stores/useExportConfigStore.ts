// src/stores/useExportConfigStore.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// --- IMPORT NECESSARY TYPES ---
// These types are required to define a robust and type-safe configuration object.
import { Filters, Row, AuthTableOrViewName } from "@/hooks/database";
import { Column, RPCConfig, ExcelStyles } from "@/hooks/database/excel-queries";

/**
 * Defines the structure for an export configuration.
 * This is generic over the table/view name to ensure that the 'columns'
 * array is correctly typed for the specific data row being exported.
 * 
 * @template T - The name of the table or view (e.g., "v_user_profiles_extended").
 */
export interface ExportConfig<T extends AuthTableOrViewName> {
  /** The columns to be included in the export, with titles and data mappings. */
  columns: Column<Row<T>>[];
  /** Optional: The name for the downloaded Excel file (e.g., "users-export.xlsx"). */
  fileName?: string;
  /** Optional: The name for the worksheet inside the Excel file. */
  sheetName?: string;
  /** Optional: The filters currently applied to the data, to be passed to the export function. */
  filters?: Filters;
  /** Optional: RPC configuration if the data export should be driven by a Supabase function. */
  rpcConfig?: RPCConfig;
  /** Optional: The maximum number of rows to export. */
  maxRows?: number;
  /** Optional: Custom styles for the Excel file header, rows, etc. */
  customStyles?: ExcelStyles;
}

interface ExportConfigState {
  /**
   * A record where each key is a unique identifier for a page or component (e.g., "userManagementPage"),
   * and the value is its specific export configuration.
   * We use `ExportConfig<any>` here because the store holds configs for many different
   * data types. The component using the store is responsible for casting to the correct specific type.
   */
  configs: Record<string, ExportConfig<any>>;
  
  /**
   * Sets or updates the export configuration for a specific page/component.
   * @param pageKey A unique string identifying the page (e.g., "adminUsers").
   * @param config The export configuration object, correctly typed for its data source.
   */
  setExportConfig: <T extends AuthTableOrViewName>(pageKey: string, config: ExportConfig<T>) => void;
  
  /**
   * Retrieves the export configuration for a specific page/component.
   * @param pageKey The unique key for the desired configuration.
   * @returns The stored configuration, or undefined if not found.
   */
  getExportConfig: (pageKey: string) => ExportConfig<any> | undefined;
  
  /**
   * Removes the export configuration for a specific page, useful for component cleanup.
   * @param pageKey The key of the configuration to remove.
   */
  clearExportConfig: (pageKey: string) => void;
  
  /**
   * Clears all stored export configurations.
   */
  clearAllExportConfigs: () => void;
}

export const useExportConfigStore = create<ExportConfigState>()(
  persist(
    devtools(
      (set, get) => ({
      // Default state is an empty object
      configs: {},

      setExportConfig: (pageKey, config) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [pageKey]: config,
          },
        }));
      },

      getExportConfig: (pageKey) => {
        return get().configs[pageKey];
      },

      clearExportConfig: (pageKey) => {
        set((state) => {
          const newConfigs = { ...state.configs };
          delete newConfigs[pageKey];
          return { configs: newConfigs };
        });
      },
      
      clearAllExportConfigs: () => {
        set({ configs: {} });
      }
    }),
    { name: "ExportConfigStore" } // Naming the store for better DevTools experience
  ),
  {
    name: "export-config-store",
    partialize: (state) => ({
      configs: state.configs,
    }),
  }
)
);