'use client';

// src/hooks/useRouteBasedUploadConfig.ts

import { useEffect, FC, ReactNode, useRef } from 'react';
// Import the simplified store and its types
import { useUploadConfigStore, UploadConfig } from '@/stores/useUploadConfigStore';
import { useCurrentTableName } from './useCurrentTableName';
import { TABLE_COLUMN_KEYS, buildUploadConfig } from '@/constants/table-column-keys';
import { PublicTableOrViewName } from '@/hooks/database/queries-type-helpers';

export interface UseRouteBasedUploadConfigOptions {
  tableName?: PublicTableOrViewName;
  autoSetConfig?: boolean;
  customConfig?: Partial<UploadConfig<PublicTableOrViewName>>;
}

export const useRouteBasedUploadConfig = (options: UseRouteBasedUploadConfigOptions = {}) => {
  const { tableName, autoSetConfig = true, customConfig } = options;
  const previousTableNameRef = useRef<PublicTableOrViewName | null>(null);

  // Get current table name from the new hook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTableName = useCurrentTableName(tableName as unknown as any);
  const validTableName: PublicTableOrViewName | null =
    currentTableName && currentTableName in (TABLE_COLUMN_KEYS as Record<string, unknown>)
      ? (currentTableName as unknown as PublicTableOrViewName)
      : null;

  // Get the actions from the store
  const { setUploadConfig, getUploadConfig, clearUploadConfig } = useUploadConfigStore();

  // Proper cleanup and config management
  useEffect(() => {
    // Clear previous config when route changes
    if (previousTableNameRef.current && previousTableNameRef.current !== validTableName) {
      clearUploadConfig(previousTableNameRef.current);
    }

    // Set new config if applicable
    if (autoSetConfig && validTableName) {
      const generated = buildUploadConfig(validTableName);
      const finalConfig = {
        ...generated,
        ...customConfig,
      } as UploadConfig<PublicTableOrViewName>;
      setUploadConfig(validTableName, finalConfig);
    }

    // Update the ref with current table name
    previousTableNameRef.current = validTableName;

    // Cleanup function - runs when component unmounts
    return () => {
      if (validTableName) {
        clearUploadConfig(validTableName);
      }
    };
  }, [validTableName, autoSetConfig, customConfig, setUploadConfig, clearUploadConfig]);

  return {
    currentTableName: validTableName,
    config: validTableName ? getUploadConfig(validTableName) : undefined,
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
