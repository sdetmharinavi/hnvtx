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
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { NetworkStatusBar } from "@/components/common/ui/NetworkStatusBar"; // IMPORTED

// Inner component to safely use hooks inside providers
function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();
  
  useRealtimeSubscription();

  const desktopSidebarWidth = isCollapsed ? 64 : 260;
  const marginValue = isMobile ? 0 : desktopSidebarWidth;

  return (
    <>
      <CommandMenu />
      {/* ADDED: Global Network Status Bar */}
      <NetworkStatusBar />

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
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <RouteBasedUploadConfigProvider options={{ autoSetConfig: true }}>
          <ViewSettingsProvider>
             <DashboardContent>{children}</DashboardContent>
          </ViewSettingsProvider>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}