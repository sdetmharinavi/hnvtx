"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { 
  FiChevronDown, 
  FiDatabase, 
  FiHome, 
  FiMap, 
  FiMenu, 
  FiUsers, 
  FiX, 
  FiServer, 
  FiLayers, 
  FiShield, 
  FiGrid, 
  FiCpu, 
  FiMapPin, 
  FiList, 
  FiUpload, 
  FiDownload, 
  FiSettings 
} from "react-icons/fi";
import { toast } from "sonner";
import { BsPeople } from "react-icons/bs";
import { ImUserTie } from "react-icons/im";
import { useUserPermissions } from "@/hooks/useRoleFunctions";
import useIsMobile from "@/hooks/useIsMobile";
import { UserRole } from "@/types/user-roles";
import { usePageActionsStore } from "@/stores/useExportConfigStore";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import { UploadColumnMapping } from "@/hooks/database";
import { useExcelUpload } from "@/hooks/database/excel-queries";
import { Input } from "../common/ui";

type TableName = keyof Database["public"]["Tables"];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showMenuFeatures: boolean;
  currentTableName: TableName | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavItem[];
  roles: UserRole[];
  external?: boolean;
}

// Animation variants for better performance
const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 64 }
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const mobileSidebarVariants = {
  hidden: { x: -260 },
  visible: { x: 0 }
};

const contentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 }
};

const submenuVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 }
};

const Sidebar = memo(({ isCollapsed, setIsCollapsed, showMenuFeatures, currentTableName }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<NavItem | null>(null);
  const [showMenuSection, setShowMenuSection] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const isMobile = useIsMobile();
  const { isSuperAdmin, role } = useUserPermissions();

  // Close mobile sidebar on route changes
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [pathname, isMobile, setIsCollapsed]);

  // Close hover menu when sidebar expands
  useEffect(() => {
    if (!isCollapsed) {
      setHoveredItem(null);
    }
  }, [isCollapsed]);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "home",
        label: "Home",
        icon: <FiHome className="h-5 w-5" />,
        href: "/dashboard",
        roles: [UserRole.ADMIN, UserRole.VIEWER, UserRole.AUTHENTICATED, UserRole.MAANADMIN, UserRole.SDHADMIN, UserRole.VMUXADMIN],
      },
      {
        id: "user-management",
        label: "User Management",
        icon: <FiUsers className="h-5 w-5" />,
        href: "/dashboard/users",
        roles: [],
      },
      {
        id: "designations",
        label: "Designations",
        icon: <ImUserTie className="h-5 w-5" />,
        href: "/dashboard/designations",
        roles: [],
      },
      {
        id: "categories",
        label: "Categories",
        icon: <FiLayers className="h-5 w-5" />,
        href: "/dashboard/categories",
        roles: [UserRole.ADMIN],
      },
      {
        id: "lookups",
        label: "Lookups",
        icon: <FiList className="h-5 w-5" />,
        href: "/dashboard/lookup",
        roles: [UserRole.ADMIN],
      },
      {
        id: "maintenance-areas",
        label: "Maintenance Areas",
        icon: <FiMapPin className="h-5 w-5" />,
        href: "/dashboard/maintenance-areas",
        roles: [UserRole.ADMIN],
      },
      {
        id: "employees",
        label: "Employees",
        icon: <BsPeople className="h-5 w-5" />,
        href: "/dashboard/employees",
        roles: [UserRole.ADMIN],
      },
      {
        id: "nodes",
        label: "Nodes",
        icon: <FiCpu className="h-5 w-5" />,
        href: "/dashboard/nodes",
        roles: [UserRole.ADMIN],
      },
      {
        id: "systems-single",
        label: "Systems",
        icon: <FiDatabase className="h-5 w-5" />,
        href: "/dashboard/systems",
        roles: [UserRole.ADMIN],
      },
      {
        id: "systems-menu",
        label: "System Management",
        icon: <FiServer className="h-5 w-5" />,
        roles: [UserRole.ADMIN, UserRole.VMUXADMIN],
        children: [
          {
            id: "cpan",
            label: "CPAN",
            icon: <FiShield className="h-4 w-4" />,
            href: "/dashboard/cpan",
            roles: [UserRole.ADMIN],
          },
          {
            id: "vmux",
            label: "VMUX",
            icon: <FiGrid className="h-4 w-4" />,
            href: "/dashboard/vmux",
            roles: [UserRole.ADMIN, UserRole.VMUXADMIN],
          },
        ],
      },
      {
        id: "map",
        label: "BTS Map",
        icon: <FiMap className="h-5 w-5" />,
        href: "https://www.google.com/maps/d/u/0/embed?mid=1dpO2c3Qt2EmLFxovZ14rcqkjrN6uqlvP&ehbc=2E312F&ll=22.485295672038035%2C88.3701163022461&z=14",
        roles: [UserRole.ADMIN, UserRole.VIEWER, UserRole.MAANADMIN, UserRole.SDHADMIN, UserRole.VMUXADMIN],
        external: true,
      },
    ],
    []
  );

  const hasPermission = useCallback(
    (roles: UserRole[]) => {
      if (isSuperAdmin) return true;
      if (!roles || roles.length === 0) return false; // Fixed: should return false for empty roles
      return roles.includes(role as UserRole);
    },
    [isSuperAdmin, role]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) => 
      prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id]
    );
  }, []);

  const isActive = useCallback(
    (item: NavItem) => {
      if (!item.href) return false;
      // Improved active state logic
      if (item.href === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname.startsWith(item.href);
    },
    [pathname]
  );

  const handleItemClick = useCallback(
    (e: React.MouseEvent, item: NavItem) => {
      if (!hasPermission(item.roles)) {
        e.preventDefault();
        toast.error("You are not authorized to access this section.");
        return;
      }
      
      if (item.children && item.children.length > 0) {
        e.preventDefault();
        toggleExpanded(item.id);
        return;
      }
      
      if (item.href) {
        if (item.external) {
          window.open(item.href, "_blank", "noopener,noreferrer");
        } else {
          router.push(item.href);
        }
      }
    },
    [hasPermission, toggleExpanded, router]
  );

  const handleChildClick = useCallback(
    (e: React.MouseEvent, child: NavItem) => {
      e.stopPropagation();
      if (!hasPermission(child.roles)) {
        toast.error("You are not authorized to access this section.");
        return;
      }
      if (child.href) {
        router.push(child.href);
        setHoveredItem(null);
      }
    },
    [hasPermission, router]
  );

  const handleBackdropClick = useCallback(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  // Zustand integration
  const { actions } = usePageActionsStore();
  const supabase = createClient();

  const activeConfig = useMemo(() => 
    currentTableName ? actions[currentTableName] : undefined, 
    [actions, currentTableName]
  );

  // 1. Define the mapping between Excel headers and database columns
  // This is the most critical part of the configuration.
  const employeeColumnMapping: UploadColumnMapping<"employees">[] = [
    {
      excelHeader: "Employee Name", // The exact text in the Excel header
      dbKey: "employee_name",       // The corresponding column in the 'employees' table
    },
    {
      excelHeader: "Personal Number",
      dbKey: "employee_pers_no",
    },
    {
      excelHeader: "Contact Number",
      dbKey: "employee_contact",
    },
    {
      excelHeader: "Email Address",
      dbKey: "employee_email",
    },
    {
      excelHeader: "Status",
      dbKey: "status",
      // Use the 'transform' function for data cleaning or type conversion
      transform: (value: unknown) => String(value).toLowerCase() === "active", // Converts "Active" to true, everything else to false
    },
  ];

  // 2. Instantiate the hook for the 'employees' table
  const {
    mutate: upload,
    isPending, // Use this state to provide feedback to the user
  } = useExcelUpload(supabase, "employees", {
    onSuccess: (result) => {
      // This callback runs after a successful upload operation
      console.log("Upload operation finished.", result);
      if (result.errorCount > 0) {
        alert(`Upload complete, but ${result.errorCount} rows had errors. Check the console for details.`);
        console.error("Failed rows:", result.errors);
      } else {
        alert(`Successfully uploaded ${result.successCount} employee records!`);
      }
      setFile(null); // Clear the file input
    },
    onError: (error) => {
      // This callback runs if a critical, unrecoverable error occurs
      alert(`Upload failed: ${error.message}`);
      console.error("A critical error occurred:", error);
    },
  });

  // 3. Create event handlers to trigger the upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    // Call the mutate function with the required options
    upload({
      file,
      columns: employeeColumnMapping,
      uploadType: "upsert", // 'upsert' will insert new employees or update existing ones
      conflictColumn: "employee_pers_no", // Use the personal number to identify existing employees
    });
  };



  const renderNavItem = useCallback(
    (item: NavItem, depth = 0) => {
      if (!hasPermission(item.roles)) return null;

      const active = isActive(item);
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.includes(item.id);

      return (
        <div 
          key={item.id} 
          className="relative" 
          onMouseEnter={() => isCollapsed && hasChildren && setHoveredItem(item)} 
          onMouseLeave={() => isCollapsed && hasChildren && setHoveredItem(null)}
        >
          <div
            onClick={(e) => handleItemClick(e, item)}
            className={`
              flex cursor-pointer items-center justify-between py-3 text-sm font-medium 
              transition-all duration-200 rounded-lg mx-2 mb-1
              ${active 
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" 
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm"
              } 
              ${isCollapsed ? "justify-center px-4" : `pr-4 ${depth > 0 ? "pl-8" : "pl-4"}`}
            `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleItemClick(e as unknown as React.MouseEvent, item);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!isCollapsed && hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(item.id);
                }}
                className="p-1 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <motion.div 
                  animate={{ rotate: isExpanded ? 0 : -90 }} 
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-4 h-4" />
                </motion.div>
              </button>
            )}
          </div>
          
          {!isCollapsed && hasChildren && (
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={submenuVariants}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                    {item.children?.map((child) => renderNavItem(child, depth + 1))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      );
    },
    [hasPermission, isActive, expandedItems, isCollapsed, handleItemClick, toggleExpanded]
  );

  const renderMenuFeatures = useCallback(() => {
    // Don't show on dashboard or when collapsed
    const shouldHideFeatures = pathname === "/dashboard" || isCollapsed || !currentTableName;
    const showActions = showMenuFeatures && !shouldHideFeatures;

    if (!showActions) return null;

    return (
      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div
          onClick={() => setShowMenuSection(!showMenuSection)}
          className="flex cursor-pointer items-center justify-between py-2 px-4 mx-2 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <div className="flex items-center space-x-3">
            <FiSettings className="h-5 w-5 flex-shrink-0" />
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
          {showMenuSection && (
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
                    File Operations for: 
                    <span className="font-bold capitalize ml-1">
                      {currentTableName.replace(/_/g, " ")}
                    </span>
                  </h4>
                  
                  {/* Upload Excel Button */}
                  {pathname !== "/dashboard/categories" && (
                    <>
                    <Input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={isPending}
                  />
                    <button
                      onClick={() => handleUpload()}
                      disabled={isPending || !currentTableName}
                      className="flex w-full items-center gap-2 rounded-md border border-gray-300 p-2 text-left text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      <FiUpload className="h-3 w-3" />
                      <span>{isPending ? "Uploading..." : "Upload Excel"}</span>
                    </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    actions?.mode,
    showMenuFeatures, 
    isCollapsed, 
    showMenuSection, 
    currentTableName, 
    pathname
  ]);

  // Mobile sidebar rendering
  if (isMobile) {
    if (isCollapsed) return null;
    
    return (
      <>
        <motion.div 
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={mobileOverlayVariants}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
          aria-label="Sidebar backdrop" 
          onClick={handleBackdropClick}
        />
        <motion.aside
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={mobileSidebarVariants}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Navigation
            </h2>
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" 
              aria-label="Close sidebar"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1" role="navigation">
              {navItems.map((item) => renderNavItem(item))}
            </nav>
            {renderMenuFeatures()}
          </div>
        </motion.aside>
      </>
    );
  }

  // Desktop sidebar rendering
  return (
    <motion.aside
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white"
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.h2 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Navigation
            </motion.h2>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" 
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div 
            animate={{ rotate: isCollapsed ? 180 : 0 }} 
            transition={{ duration: 0.2 }}
          >
            {isCollapsed ? <FiMenu className="h-5 w-5" /> : <FiX className="h-5 w-5" />}
          </motion.div>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1" role="navigation">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
        {renderMenuFeatures()}
      </div>
      
      {/* Hover menu for collapsed state */}
      <AnimatePresence>
        {isCollapsed && hoveredItem?.children && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-16 z-[60] min-w-48 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
            style={{
              top: `${Math.max(80, Math.min(window.innerHeight - 200, 160))}px`,
            }}
            onMouseEnter={() => setHoveredItem(hoveredItem)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="py-2">
              {hoveredItem.children.map((child) => (
                <button
                  key={child.id}
                  onClick={(e) => handleChildClick(e, child)}
                  disabled={!hasPermission(child.roles)}
                  className={`
                    flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors
                    ${hasPermission(child.roles) 
                      ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" 
                      : "text-gray-400 cursor-not-allowed dark:text-gray-600"
                    }
                  `}
                >
                  <span className="flex-shrink-0">{child.icon}</span>
                  <span className="truncate">{child.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;