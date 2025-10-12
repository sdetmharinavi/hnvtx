// components/dashboard/DashboardContent.tsx
import { ReactNode, useState, useEffect } from "react";
import ColumnManagementProvider from "./ColumnManagementProvider";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "../navigation/sidebar";
import { usePathname } from "next/navigation";
import { useDataSync } from "@/hooks/data/useDataSync"; // Added import

interface DashboardContentProps {
  children: ReactNode | ReactNode[] | Record<string, unknown>[] | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  showColumnManagement: boolean;
}

function DashboardContent({
  children,
  isCollapsed,
  setIsCollapsed,
  isMobile,
  showColumnManagement,
}: DashboardContentProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // Initiate data synchronization when the dashboard is loaded
  useDataSync();

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        setSidebarWidth(sidebar.getBoundingClientRect().width);
      }
    };

    // Initial measurement
    updateSidebarWidth();

    // Update on resize
    window.addEventListener('resize', updateSidebarWidth);
    
    // Small delay to ensure sidebar transition completes
    const timeout = setTimeout(updateSidebarWidth, 300);

    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
      clearTimeout(timeout);
    };
  }, [isCollapsed]);

  return (
      <ColumnManagementProvider
        data={children as Record<string, unknown>[] | null}
      >
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          showMenuFeatures={showColumnManagement}
        />

        {/* Main Content Area */}
        <div
          className="transition-all duration-300 min-h-screen"
          style={{
            marginLeft: isMobile ? 0 : `${sidebarWidth}px`
          }}
        >
          {/* Header */}
          <DashboardHeader onMenuClick={() => setIsCollapsed(false)} />

          {/* Main Content */}
          <main className={isDashboard ? "" : "p-4"} >
            <div className="mx-auto max-w-full">
              {children as ReactNode}
            </div>
          </main>
        </div>
      </ColumnManagementProvider>
  );
}

export default DashboardContent;