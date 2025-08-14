import { FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/common/ui/Button";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";
import { useMemo } from "react";
import { Filters } from "@/hooks/database";

interface CategoriesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export function CategoriesHeader({
  isLoading,
  onRefresh,
  onCreate,
}: CategoriesHeaderProps) {
    // Download configuration
    const supabase = createClient();
    const columns = useDynamicColumnConfig("lookup_types");
    const serverFilters = useMemo(() => {
      const f: Filters = {
// Filter to download only categories with name = "DEFAULT"
        name: "DEFAULT",
      };
      return f;
    }, []);
  
    const tableExcelDownload = useTableExcelDownload(
      supabase,
      "lookup_types",
      {
        onSuccess: () => {
          toast.success("Export successful");
        },
        onError: () => toast.error("Export failed"),
      }
    );
  
    const handleExport = async () => {
      const tableOptions = {
        fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-categories-export.xlsx`,
        sheetName: "categories",
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
        Categories Management
      </h1>
      <div className="flex items-center gap-2">
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
        <Button onClick={onCreate} className="flex items-center gap-2">
          <FiPlus className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Create</span>
          <span className="hidden sm:inline">Category</span>
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