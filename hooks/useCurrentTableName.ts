// src/hooks/useCurrentTableName.ts
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
    if (path.includes("/dashboard/users")) return TABLE_NAMES.user_profiles;
    if (path.includes("/dashboard/employees")) return TABLE_NAMES.employees;
    if (path.includes("/dashboard/categories")) return TABLE_NAMES.lookup_types;
    if (path.includes("/dashboard/designations")) return TABLE_NAMES.employee_designations;
    if (path.includes("/dashboard/rings")) return TABLE_NAMES.rings;
    if (path.includes("/dashboard/maintenance-areas")) return TABLE_NAMES.maintenance_areas;
    if (path.includes("/dashboard/lookup")) return TABLE_NAMES.lookup_types;
    if (path.includes("/dashboard/ofc")) return TABLE_NAMES.ofc_cables;
    if (path.includes("/dashboard/ofc_connections")) return TABLE_NAMES.ofc_connections;
    if (path.includes("/dashboard/nodes")) return TABLE_NAMES.nodes;
    if (path.includes("/dashboard/systems")) return TABLE_NAMES.systems;
    return null;
  }, [tableName, pathname]);
};