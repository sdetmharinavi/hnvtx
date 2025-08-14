"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { toast } from "sonner";

interface ColumnOption {
  label: string;
  value: string;
}

interface ColumnManagementContextType {
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  isDeleteVisible: boolean;
  setIsDeleteVisible: (visible: boolean) => void;
  columnOptions: ColumnOption[];
  toggleDelete: () => void;
  resetColumnsToDefault: () => void;
}

const ColumnManagementContext =
  createContext<ColumnManagementContextType | null>(null);

export function useColumnManagement() {
  const context = useContext(ColumnManagementContext);
  if (!context) {
    throw new Error(
      "useColumnManagement must be used within a ColumnManagementProvider"
    );
  }
  return context;
}

interface ColumnManagementProviderProps {
  children: ReactNode;
  data: ReactNode | ReactNode[] | Record<string, unknown>[] | null; // The data to generate column options from
  excludeColumns?: string[];
}

export default function ColumnManagementProvider({
  children,
  data,
  excludeColumns = ["password_hash", "internal_id"],
}: ColumnManagementProviderProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);

  // Generate column options from data
  const columnOptions = useMemo(() => {
    if (!data || (data as Record<string, unknown>[]).length === 0) return [];

    // Get keys from first item in data array
    const firstItem = data as Record<string, unknown>[];
    if (!firstItem || typeof firstItem !== "object") return [];

    const keys = Object.keys(firstItem);

    return keys
      .filter((key) => !excludeColumns.includes(key))
      .map((key) => ({
        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: key,
      }));
  }, [data, excludeColumns]);

  // Initialize visible columns when column options change
  useEffect(() => {
    if (columnOptions.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columnOptions.map((col) => col.value));
    }
  }, [columnOptions, visibleColumns.length]);

  // Toggle delete visibility
  const toggleDelete = () => {
    setIsDeleteVisible((prev) => {
      const newState = !prev;
      toast.info(newState ? "Delete options shown" : "Delete options hidden");
      return newState;
    });
  };

  // Reset columns to default
  const resetColumnsToDefault = () => {
    if (columnOptions.length > 0) {
      setVisibleColumns(columnOptions.map((col) => col.value));
      toast.success("Columns reset to default");
    } else {
      toast.warning("No columns available to reset");
    }
  };

  const contextValue: ColumnManagementContextType = {
    visibleColumns,
    setVisibleColumns,
    isDeleteVisible,
    setIsDeleteVisible,
    columnOptions,
    toggleDelete,
    resetColumnsToDefault,
  };

  return (
    <ColumnManagementContext.Provider value={contextValue}>
      {children}
    </ColumnManagementContext.Provider>
  );
}
