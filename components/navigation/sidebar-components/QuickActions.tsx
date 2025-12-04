"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiSettings, FiUpload } from "react-icons/fi";
import { Input } from "@/components/common/ui/Input";
import { useRef, useState } from "react";
import { submenuVariants } from "./sidebar-types";
import { createClient } from "@/utils/supabase/client";
import { useUploadConfigStore } from "@/stores/useUploadConfigStore";
import { useExcelUpload } from "@/hooks/database/excel-queries";
import { toast } from "sonner";
import { useCurrentTableName } from "@/hooks/useCurrentTableName";
import { PublicTableName } from "@/hooks/database";

interface QuickActionsProps {
  isCollapsed: boolean;
  pathname: string;
}

export const QuickActions = ({ isCollapsed, pathname }: QuickActionsProps) => {
  const [showMenuSection, setShowMenuSection] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [file, setFile] = useState<File | null>(null);
  const currentTableName = useCurrentTableName();

  // Don't show on dashboard or when collapsed
  const shouldHideFeatures =
    pathname === "/dashboard" || isCollapsed || !currentTableName;

  // Zustand integration
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const pageKey = currentTableName as string;

  // Get the config for this specific context from the store.
  const { configs } = useUploadConfigStore();
  const storeConfig = configs[currentTableName as string];
  // console.log("storeConfig", storeConfig);

  // Initialize the upload hook. Note that we don't know the table name here yet.
  const { mutate, isPending } = useExcelUpload(
    supabase,
    currentTableName as PublicTableName,
    {
      onSuccess: (result) => {
        // ... success handler
        return result.successCount > 0
          ? toast.success(
              `Successfully uploaded ${result.successCount} of ${result.totalRows} records.`
            )
          : toast.error(`Failed to upload ${result.totalRows} records.`);
      },
      onError: (error) => {
        // ... error handler
        console.log(error);
      },
    }
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    setFile(selectedFile);

    if (!storeConfig) {
      toast.error("Upload configuration is missing. Cannot proceed.");
      return;
    }

    mutate({
      file: selectedFile,
      columns: storeConfig.columnMapping,
      uploadType: storeConfig.uploadType,
      conflictColumn: storeConfig.conflictColumn,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Don't show on dashboard or when collapsed
  if (shouldHideFeatures) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div
        onClick={() => setShowMenuSection(!showMenuSection)}
        className="flex cursor-pointer items-center justify-between py-2 px-4 mx-2 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <div className="flex items-center space-x-3">
          <FiSettings className="h-5 w-5 shrink-0" />
          <span>Quick Actions</span>
        </div>
        <motion.div
          animate={{ rotate: showMenuSection ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {showMenuSection && storeConfig?.isUploadEnabled && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={submenuVariants}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 py-3">
              <div className="space-y-2">
                <h4 className="px-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Upload data for:
                  <div className="flex">
                    <div className="font-bold ml-1 lowercase px-2 ">
                      {currentTableName}{" "}
                    </div>
                    <div className="uppercase">table</div>
                  </div>
                </h4>

                {/* Upload Excel Button */}
                <>
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending || !currentTableName}
                    className="flex w-full items-center gap-2 rounded-md border border-gray-300 p-2 text-left text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <FiUpload className="h-3 w-3" />
                    <span>{isPending ? "Uploading..." : "Upload Excel"}</span>
                  </button>
                </>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
