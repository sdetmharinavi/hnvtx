// hooks/useCurrentTableName.ts
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { TABLE_NAMES } from "@/hooks/defaultUploadConfigs";

// Define a type for the table names that have upload configurations
export type UploadConfigTableName = keyof typeof TABLE_NAMES;

export const useCurrentTableName = (tableName?: UploadConfigTableName): UploadConfigTableName | null => {
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
        return TABLE_NAMES.user_profiles;
      case "employees":
        return TABLE_NAMES.employees;
      case "categories":
        return TABLE_NAMES.lookup_types;
      case "designations":
        return TABLE_NAMES.employee_designations;
      case "rings":
        return TABLE_NAMES.rings;
      case "maintenance-areas":
        return TABLE_NAMES.maintenance_areas;
      case "lookup":
        return TABLE_NAMES.lookup_types;
      case "ofc":
        // Check if there's a third segment (ID) after ofc
        const hasId = segments.length > dashboardIndex + 2 && segments[dashboardIndex + 2];
        return hasId ? TABLE_NAMES.ofc_connections : TABLE_NAMES.ofc_cables;
      case "ofc_connections":
        return TABLE_NAMES.ofc_connections;
      case "nodes":
        return TABLE_NAMES.nodes;
      case "systems":
        return TABLE_NAMES.systems;
      default:
        return null;
    }
  }, [tableName, pathname]);
};
