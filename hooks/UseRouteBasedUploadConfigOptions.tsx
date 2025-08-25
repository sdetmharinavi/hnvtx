// src/hooks/useRouteBasedUploadConfig.ts

import { useEffect, FC, ReactNode, useRef } from "react";
// Import the simplified store and its types
import {
  useUploadConfigStore,
  UploadConfig,
} from "@/stores/useUploadConfigStore";
import { useCurrentTableName } from "./useCurrentTableName";
import { TableNames } from "@/config/helper-types";
import { buildUploadConfig } from "@/config/table-column-keys";

export interface UseRouteBasedUploadConfigOptions {
  tableName?: TableNames;
  autoSetConfig?: boolean;
  customConfig?: Partial<UploadConfig<TableNames>>;
}

export const useRouteBasedUploadConfig = (
  options: UseRouteBasedUploadConfigOptions = {}
) => {
  const { tableName, autoSetConfig = true, customConfig } = options;
  const previousTableNameRef = useRef<TableNames | null>(null);

  // Get current table name from the new hook
  const currentTableName = useCurrentTableName(tableName);

  // Get the actions from the store
  const { setUploadConfig, getUploadConfig, clearUploadConfig } =
    useUploadConfigStore();

  // Proper cleanup and config management
  useEffect(() => {
    // Clear previous config when route changes
    if (
      previousTableNameRef.current &&
      previousTableNameRef.current !== currentTableName
    ) {
      clearUploadConfig(previousTableNameRef.current);
    }

    // Set new config if applicable
    if (autoSetConfig && currentTableName) {
      const generated = buildUploadConfig(currentTableName);
      const finalConfig = {
        ...generated,
        ...customConfig,
      } as UploadConfig<TableNames>;
      setUploadConfig(currentTableName, finalConfig);
    }

    // Update the ref with current table name
    previousTableNameRef.current = currentTableName;

    // Cleanup function - runs when component unmounts
    return () => {
      if (currentTableName) {
        clearUploadConfig(currentTableName);
      }
    };
  }, [
    currentTableName,
    autoSetConfig,
    customConfig,
    setUploadConfig,
    clearUploadConfig,
  ]);

  return {
    currentTableName,
    config: currentTableName ? getUploadConfig(currentTableName) : undefined,
  };
};

/**
 * A simple Provider component to easily wrap layouts or pages,
 * activating the route-based configuration logic.
 */
export const RouteBasedUploadConfigProvider: FC<{
  children: ReactNode;
  options?: UseRouteBasedUploadConfigOptions;
}> = ({ children, options = {} }) => {
  useRouteBasedUploadConfig(options);
  return <>{children}</>;
};
