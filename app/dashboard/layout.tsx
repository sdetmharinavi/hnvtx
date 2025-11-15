// path: app/dashboard/layout.tsx
"use client";

import useIsMobile from "@/hooks/useIsMobile";
import { useState, useEffect } from "react";
import { Protected } from "@/components/auth/Protected";
import { RouteBasedUploadConfigProvider } from "@/hooks/UseRouteBasedUploadConfigOptions";
import 'leaflet/dist/leaflet.css';
import { allowedRoles } from "@/constants/constants";
import { UserProvider } from "@/providers/UserProvider";
import Sidebar from "@/components/navigation/sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebarEl = document.querySelector('[data-sidebar]');
      if (sidebarEl) {
        setSidebarWidth(sidebarEl.getBoundingClientRect().width);
      }
    };

    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    const timeoutId = setTimeout(updateSidebarWidth, 350);

    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
      clearTimeout(timeoutId);
    };
  }, [isCollapsed]);

  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <RouteBasedUploadConfigProvider options={{ autoSetConfig: true }}>
          {/* THE FIX: This div contains all the UI chrome and will be hidden during print */}
          <div className="no-print">
            <Sidebar 
              isCollapsed={isCollapsed} 
              setIsCollapsed={setIsCollapsed}
              showMenuFeatures={true}
            />
            <div
              className="transition-all duration-300"
              style={{
                marginLeft: isMobile ? 0 : `${sidebarWidth}px`
              }}
            >
              <DashboardHeader onMenuClick={() => setIsCollapsed(false)} />
            </div>
          </div>

          {/* Main Content Area - This will be visible on screen and potentially in print */}
          <main
            className="transition-all duration-300"
            style={{
              marginLeft: isMobile ? 0 : `${sidebarWidth}px`
            }}
          >
            {children}
          </main>
            
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}