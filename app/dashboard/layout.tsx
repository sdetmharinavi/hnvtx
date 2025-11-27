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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();

  // Determine widths based on state constants matching sidebar-types.ts variants
  // Collapsed: 64px, Expanded: 260px
  const desktopSidebarWidth = isCollapsed ? 64 : 260;
  const marginValue = isMobile ? 0 : desktopSidebarWidth;

  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <RouteBasedUploadConfigProvider options={{ autoSetConfig: true }}>
          <ViewSettingsProvider>
            {/* This div contains all the UI chrome and will be hidden during print */}
            <div className="no-print">
              <Sidebar 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed}
                showMenuFeatures={true}
              />
              <div
                className="transition-all duration-300 ease-in-out"
                style={{
                  marginLeft: `${marginValue}px`,
                }}
              >
                <DashboardHeader title="" onMenuClick={() => setIsCollapsed(!isCollapsed)} />
              </div>
            </div>

            {/* Main Content Area - This will be visible on screen and potentially in print */}
            <main
              className="transition-all duration-300 ease-in-out"
              style={{
                marginLeft: `${marginValue}px`
              }}
            >
              {children}
            </main>
          </ViewSettingsProvider>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}