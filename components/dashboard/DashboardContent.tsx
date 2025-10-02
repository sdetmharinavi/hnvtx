import { ReactNode } from "react";
import ColumnManagementProvider from "./ColumnManagementProvider";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "../navigation/sidebar";
import { usePathname } from "next/navigation";


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
  // Get page route
  const pathname = usePathname();
  // Check if the current page is the dashboard
  const isDashboard = pathname === "/dashboard";

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
          className={`transition-all duration-300 min-h-screen${
            isMobile ? "" : isCollapsed ? " ml-16" : " ml-64"
            // isMobile ? "" : isCollapsed ? " " : " "
          }`}
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
