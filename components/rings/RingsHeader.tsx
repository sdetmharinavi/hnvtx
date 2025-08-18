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

interface RingsHeaderProps {
  onRefresh: () => void;
  onAddNew: () => void;
  isLoading: boolean;
  totalCount: number;
}

export function RingsHeader({ onRefresh, onAddNew, isLoading, totalCount }: RingsHeaderProps) {
  // Download configuration
  const supabase = createClient();
  const columns = useDynamicColumnConfig("rings");
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

  const tableExcelDownload = useTableExcelDownload(supabase, "rings", {
    onSuccess: () => {
      toast.success("Export successful");
    },
    onError: () => toast.error("Export failed"),
  });

  const handleExport = async () => {
    const tableName = "rings";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(tableName)}-export.xlsx`,
      sheetName: String(tableName),
      columns: columns,
      filters: serverFilters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Ring Management</h1>
      <p className='text-gray-600 dark:text-gray-400'>Manage network rings and related info</p>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2'>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1'>
          Total Rings: <span className='font-bold text-gray-800 dark:text-white'>{totalCount}</span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button onClick={onRefresh} variant='outline' className='flex items-center gap-2 dark:border-gray-700 dark:hover:bg-gray-800' disabled={isLoading}>
          <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className='hidden sm:inline'>Refresh</span>
        </Button>
        <Button onClick={onAddNew} className='flex items-center gap-2'>
          <FiPlus className='h-4 w-4' />
          <span className='hidden xs:inline sm:inline'>Add</span>
          <span className='hidden sm:inline'>Ring</span>
        </Button>
        <Button onClick={handleExport} variant='outline' className='flex items-center gap-2 dark:border-gray-700 dark:hover:bg-gray-800' disabled={isLoading}>
          <FiDownload className='h-4 w-4' />
          <span className='hidden sm:inline'>Export</span>
        </Button>
      </div>
    </div>
  );
}
