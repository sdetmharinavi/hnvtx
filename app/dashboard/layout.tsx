"use client";

import useIsMobile from "@/hooks/useIsMobile";
import { UserRole } from "@/types/user-roles";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Protected } from "@/components/auth/Protected";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { QueryProvider } from "@/providers/QueryProvider";
import { Database } from "@/types/supabase-types";
import { RouteBasedUploadConfigProvider } from "@/hooks/UseRouteBasedUploadConfigOptions";
import { useCurrentTableName } from "@/hooks/useCurrentTableName";
import AdvancedLoader from "@/components/common/ui/LoadingSpinner/AdvancedLoader";

type CurrentTableName = keyof Database["public"]["Tables"];

interface DashboardLayoutProps {
  children: React.ReactNode;
  // Optional props that pages can pass down
  tableName?: CurrentTableName;
  showFileUpload?: boolean;
  showColumnManagement?: boolean;
  allowedRoles?: UserRole[];
}

export default function DashboardLayout({
  children,
  tableName,
  showFileUpload = true,
  showColumnManagement = true,
  allowedRoles = [
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.VMUXADMIN,
    UserRole.MNGADMIN,
  ],
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Determine table name based on current route

  return (
    <QueryProvider>
      <Protected allowedRoles={allowedRoles}>
        <RouteBasedUploadConfigProvider
          options={{
            autoSetConfig: true,
            customConfig: {
              // Global defaults that apply to all pages
              isUploadEnabled: true,
            },
          }}
        >
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* File Upload Provider - conditionally render */}
            {showFileUpload ? (
              <DashboardContent
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobile={isMobile}
                showColumnManagement={showColumnManagement}
              >
                {children}
              </DashboardContent>
            ) : (
              <DashboardContent
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobile={isMobile}
                showColumnManagement={showColumnManagement}
              >
                {children}
              </DashboardContent>
            )}
          </div>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </QueryProvider>
  );
}
