// hooks/useCurrentTableName.ts
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { TableNames } from "@/config/helper-types";

export const useCurrentTableName = (tableName?: TableNames): TableNames | null => {
  const pathname = usePathname();

  return useMemo(() => {
    if (tableName) return tableName;

    const path = pathname || "";
    const segments = path.split("/").filter(Boolean); // Remove empty segments

    // Look for the dashboard segment and get the next segment as the route
    const dashboardIndex = segments.findIndex((segment) => segment === "dashboard");
    if (dashboardIndex === -1 || dashboardIndex >= segments.length - 1) {
      return null;
    }

    const routeSegment = segments[dashboardIndex + 1];

    // Map route segments to table names
    switch (routeSegment) {
      case "users":
        return "user_profiles";
      case "employees":
        return "employees";
      case "categories":
        return "lookup_types";
      case "designations":
        return "employee_designations";
      case "rings":
        return "rings";
      case "maintenance-areas":
        return "maintenance_areas";
      case "lookup":
        return "lookup_types";
      case "inventory":
        return "inventory_items";
      case "ofc":
        // Check if there's a third segment (ID) after ofc
        const hasId = segments.length > dashboardIndex + 2 && segments[dashboardIndex + 2];
        return hasId ? "ofc_connections" : "ofc_cables";
      case "ofc_connections":
        return "ofc_connections";
      case "nodes":
        return "nodes";
      case "systems":
        return "systems";
      case "cpan":
        return null;
      case "cpan_connections":
        return null;
      case "fiber-joints":
        return "fiber_splices";
      case "fiber-joint-connections":
        return null;
      case "logical-fiber-paths":
        return "logical_fiber_paths";
      case "maan":
        return null;
      case "maan_connections":
        return null;
      case "management-ports":
        return "management_ports";
      case "sdh":
        return "sdh_systems";
      case "sdh_connections":
        return "sdh_connections";
      case "sdh_node_associations":
        return "sdh_node_associations";
      case "system-connections":
        return "system_connections";
      case "user-activity-logs":
        return null;
       // THE FIX: Map diagrams route to files table
      case "diagrams":
        return "files";
      // THE FIX: Added kml-manager mapping
      case "kml-manager":
        return "files"; 
      default:
        return null;
    }
  }, [tableName, pathname]);
};
