"use client";

import { Button } from "@/components/common/ui/Button";
import { Filters } from "@/hooks/database";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { formatDate } from "@/utils/formatters";
import { createClient } from "@/utils/supabase/client";
import { useMemo } from "react";
import { FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";

interface LookupTypesHeaderProps {
  onRefresh: () => void;
  onAddNew: () => void;
  isLoading: boolean;
  hasSelectedCategory: boolean;
}

export function LookupTypesHeader({
  onRefresh,
  onAddNew,
  isLoading,
  hasSelectedCategory,
}: LookupTypesHeaderProps) {
  // Download configuration
  const supabase = createClient();
  const columns = useDynamicColumnConfig("lookup_types");
  const serverFilters = useMemo(() => {
    const f: Filters = {
      // Filter to download only categories with name not equal to "DEFAULT"
      name: {
        operator: "neq",
        value: "DEFAULT",
      },
    };
    return f;
  }, []);

  const tableExcelDownload = useTableExcelDownload(supabase, "lookup_types", {
    onSuccess: () => {
      toast.success("Export successful");
    },
    onError: () => toast.error("Export failed"),
  });

  const handleExport = async () => {
    const tableName = "lookup_types";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: columns,
      filters: serverFilters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Lookup Types Management
      </h1>
      <div className="flex items-center gap-2">
        {hasSelectedCategory && (
          <Button
            onClick={onRefresh}
            variant="outline"
            className="flex items-center gap-2 dark:border-gray-700 dark:hover:bg-gray-800"
            disabled={isLoading}
          >
            <FiRefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
        <Button
          onClick={onAddNew}
          className="flex items-center gap-2"
          disabled={!hasSelectedCategory}
        >
          <FiPlus className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Add</span>
          <span className="hidden sm:inline">Lookup Type</span>
        </Button>
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2 dark:border-gray-700 dark:hover:bg-gray-800"
          disabled={isLoading}
        >
          <FiDownload className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
}
