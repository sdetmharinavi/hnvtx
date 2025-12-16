// path: app/dashboard/layout.tsx
"use client";

import useIsMobile from "@/hooks/useIsMobile";
import { useState } from "react";
import { Protected } from "@/components/auth/Protected";
import { RouteBasedUploadConfigProvider } from "@/hooks/UseRouteBasedUploadConfigOptions";
import 'leaflet/dist/leaflet.css';
import { allowedRoles } from "@/constants/constants";
import { UserProvider } from "@/providers/UserProvider";
import { ViewSettingsProvider } from "@/contexts/ViewSettingsContext";
import Sidebar from "@/components/navigation/sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CommandMenu } from "@/components/common/CommandMenu";
import { ErrorBoundary } from "@/components/common/ErrorBoundary"; // IMPORTED

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();

  const desktopSidebarWidth = isCollapsed ? 64 : 260;
  const marginValue = isMobile ? 0 : desktopSidebarWidth;

  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <RouteBasedUploadConfigProvider options={{ autoSetConfig: true }}>
          <ViewSettingsProvider>
            <CommandMenu />

            {/* Sidebar - Fixed position */}
            <div className="no-print">
              <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                showMenuFeatures={true}
              />
            </div>

            {/* Main container that shifts with sidebar */}
            <div
              className="flex min-h-screen flex-col transition-all duration-300 ease-in-out"
              style={{
                marginLeft: `${marginValue}px`,
              }}
            >
              <div className="no-print">
                <DashboardHeader
                  onMenuClick={() => setIsCollapsed(!isCollapsed)}
                />
              </div>

              {/* Main Content WRAPPED in ErrorBoundary */}
              <main className="flex-1">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
              </main>
            </div>
          </ViewSettingsProvider>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}