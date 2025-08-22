import { useCallback } from "react";
import { toast } from "sonner";
import * as ExcelJS from "exceljs";
import { createClient } from "@/utils/supabase/client";
import { UserProfileData } from "@/components/users/user-types";
import { snakeToTitleCase } from "@/utils/formatters";

export const useUserExport = () => {
  const supabase = createClient();

  const handleExport = useCallback(async (
    searchQuery: string,
    roleFilter: string,
    statusFilter: string
  ) => {
    try {
      toast.info("Preparing export...");

      const { data, error } = await supabase.rpc("admin_get_all_users", {
        search_query: searchQuery || null,
        filter_role: roleFilter || null,
        filter_status: statusFilter || null,
        page_offset: 0,
        page_limit: 10000,
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from server");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");

      // Add headers (adjust based on your actual data structure)
      const headers = Object.keys(data[0] || {});
      const formattedHeaders = headers.map(header => snakeToTitleCase(header));
      // console.log("formattedHeaders",formattedHeaders);
      worksheet.addRow(formattedHeaders);

      // Add data rows
      data.forEach((row: UserProfileData) => {
        const rowData = headers.map(header => row[header as keyof UserProfileData]);
        // console.log("rowData",rowData);
        worksheet.addRow(rowData);
      });

      // Auto-fit columns
      worksheet.columns = formattedHeaders.map(header => ({
        header,
        key: header,
        width: Math.min(Math.max(header.length + 2, 10), 50)
      }));

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = `users-export-${new Date().toISOString().split("T")[0]}.xlsx`;

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export completed successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Export failed: ${errorMessage}`);
    }
  }, [supabase]);

  return { handleExport };
};