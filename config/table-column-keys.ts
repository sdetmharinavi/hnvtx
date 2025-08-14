// config/table-column-keys.ts
import { Database, Tables } from "@/types/supabase-types";

// NOTE: We need to import the ViewName type from the hooks that define it.
// Assuming it's in a file like 'queries-type-helpers.ts' or similar.
// If it's not exported, you can define it here as shown.
export type ViewName = keyof Database["public"]["Views"];
export type TableName = keyof Database["public"]["Tables"];
export type TableOrViewName = TableName | ViewName;

// A generic Row type helper that works for both tables and views
export type GenericRow<T extends TableOrViewName> = T extends TableName ? Tables<T> : T extends ViewName ? Database["public"]["Views"][T]["Row"] : never;

// FIX: This Mapped Type now correctly includes both Tables and Views.
type AllColumnKeys = {
  [K in TableName]: (keyof Tables<K> & string)[];
} & {
  // Add a mapped type for Views. This merges the view keys into the type.
  [K in ViewName]: (keyof Database["public"]["Views"][K]["Row"] & string)[];
};

// -----------------------------
// Column meta and builders (SSOT)
// -----------------------------

type ExcelFormat = "text" | "number" | "date" | "currency" | "percentage";
type ColumnTransform = (value: unknown) => unknown;

export type ColumnMeta = {
  title?: string;
  excelHeader?: string;
  excelFormat?: ExcelFormat;
  transform?: ColumnTransform;
};

type TableMetaMap = {
  [K in TableName]?: Partial<Record<keyof Tables<K> & string, ColumnMeta>>;
};

export type UploadTableMeta<T extends TableName> = {
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof Tables<T> & string;
  isUploadEnabled?: boolean;
};

type UploadMetaMap = {
  [K in TableName]?: UploadTableMeta<K>;
};

export const UPLOAD_TABLE_META: UploadMetaMap = {
  employees: {
    uploadType: "upsert",
    conflictColumn: "employee_pers_no",
    isUploadEnabled: true,
  },
  user_profiles: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  lookup_types: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  rings: { uploadType: "upsert", conflictColumn: "id", isUploadEnabled: true },
  employee_designations: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  maintenance_areas: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  ofc_cables: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  ofc_connections: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
  nodes: { uploadType: "upsert", conflictColumn: "id", isUploadEnabled: true },
  systems: {
    uploadType: "upsert",
    conflictColumn: "id",
    isUploadEnabled: true,
  },
};

function toTitleCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// Build UI column configs (lightweight structure; consumer can enrich widths/formats)
export function buildColumnConfig<T extends TableName>(tableName: T) {
  const keys = TABLE_COLUMN_KEYS[tableName] as (keyof Tables<T> & string)[];
  const meta = (TABLE_COLUMN_META[tableName] || {}) as Record<string, ColumnMeta>;
  return keys.map((key) => {
    const m = meta[key] || {};
    const title = m.title ?? toTitleCase(key);
    return {
      key,
      dataIndex: key,
      title,
      excelFormat: m.excelFormat,
    };
  });
}

// Build upload config from SSOT
export function buildUploadConfig<T extends TableName>(tableName: T) {
  const keys = TABLE_COLUMN_KEYS[tableName] as (keyof Tables<T> & string)[];
  const meta = (TABLE_COLUMN_META[tableName] || {}) as Record<string, ColumnMeta>;
  const tableMeta = (UPLOAD_TABLE_META[tableName] || {
    uploadType: "upsert",
  }) as UploadTableMeta<T>;

  const columnMapping = keys.map((key) => {
    const m = meta[key] || {};
    const excelHeader = m.excelHeader ?? toTitleCase(key);
    // Auto-infer transforms if not explicitly provided
    let transform = m.transform as ColumnTransform | undefined;
    if (!transform) {
      const k = String(key).toLowerCase();
      if (k.endsWith("_at") || k.endsWith("_on") || k.includes("date")) {
        transform = toPgDate;
      } else if (k.startsWith("is_") || k.startsWith("has_") || k.startsWith("can_") || k.includes("enabled") || k.includes("active") || k === "status") {
        transform = toPgBoolean;
      }
    }
    return {
      excelHeader,
      dbKey: key,
      transform,
    };
  });

  return {
    tableName,
    columnMapping,
    uploadType: tableMeta.uploadType,
    conflictColumn: tableMeta.conflictColumn,
    isUploadEnabled: tableMeta.isUploadEnabled ?? true,
  };
}

// FIX: Add your views to this central constant
export const TABLE_NAMES = {
  user_profiles: "user_profiles",
  employees: "employees",
  lookup_types: "lookup_types",
  rings: "rings",
  employee_designations: "employee_designations",
  maintenance_areas: "maintenance_areas",
  ofc_cables: "ofc_cables",
  ofc_connections: "ofc_connections",
  nodes: "nodes",
  systems: "systems",

  // ADD THE VIEW NAME HERE
  v_ofc_cables_complete: "v_ofc_cables_complete",
} as const;

export type CurrentTableName = keyof typeof TABLE_NAMES;

// Helper: normalize various Excel/CSV date representations to 'YYYY-MM-DD' or null
export const toPgDate = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  // Treat empty string as null to avoid Postgres date parse errors
  if (typeof value === "string") {
    const v = value.trim();
    if (v === "") return null;
    // If already in YYYY-MM-DD, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    // If the string is a numeric-like Excel serial, treat it as such
    if (/^\d+(?:\.\d+)?$/.test(v)) {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        const ms = Math.round((num - 25569) * 86400 * 1000);
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }
      }
    }

    // Handle common D/M/Y or M/D/Y with optional time "DD/MM/YYYY HH:MM:SS" or "MM/DD/YYYY HH:MM:SS"
    const dmYTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = v.match(dmYTime);
    if (match) {
      const d1 = parseInt(match[1], 10);
      const d2 = parseInt(match[2], 10);
      const yyyy = parseInt(match[3], 10);
      // Disambiguate: if first part > 12 -> DD/MM/YYYY; if second part > 12 -> MM/DD/YYYY; otherwise assume DD/MM/YYYY (common in India)
      const isDMY = d1 > 12 || (d2 <= 12 && d1 <= 12);
      const dd = String(isDMY ? d1 : d2).padStart(2, "0");
      const mm = String(isDMY ? d2 : d1).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    // Fallback to Date parsing for other formats
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }
  // Excel serial number dates
  if (typeof value === "number") {
    // Excel epoch (days since 1899-12-30). Multiply by ms per day.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }
  // Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

// Helper: normalize boolean-like values to true/false or null
export const toPgBoolean = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "") return null;
    if (["true", "t", "1", "yes", "y"].includes(v)) return true;
    if (["false", "f", "0", "no", "n"].includes(v)) return false;
  }
  return null;
};

// Per-table column metadata for UI/export and upload (only override where needed)
export const TABLE_COLUMN_META: TableMetaMap = {
  employees: {
    employee_dob: {
      title: "Employee DOB",
      excelHeader: "Employee DOB",
      transform: toPgDate,
      excelFormat: "date",
    },
    employee_doj: {
      title: "Employee DOJ",
      excelHeader: "Employee DOJ",
      transform: toPgDate,
      excelFormat: "date",
    },
    status: { title: "Status", excelHeader: "Status", transform: toPgBoolean },
  },
  lookup_types: {
    status: { transform: toPgBoolean },
    is_system_default: { transform: toPgBoolean },
  },
  rings: {
    status: { transform: toPgBoolean },
  },
  user_profiles: {
    status: { transform: toPgBoolean },
    date_of_birth: { transform: toPgDate, excelFormat: "date" },
  },
  ofc_cables: {
    commissioned_on: { transform: toPgDate, excelFormat: "date" },
    status: { transform: toPgBoolean },
  },
  ofc_connections: {
    ea_dom: { transform: toPgDate, excelFormat: "date" },
    eb_dom: { transform: toPgDate, excelFormat: "date" },
    status: { transform: toPgBoolean },
  },
  nodes: {
    status: { transform: toPgBoolean },
  },
  systems: {
    commissioned_on: { transform: toPgDate, excelFormat: "date" },
    status: { transform: toPgBoolean },
  },
};

/**
 * The single source of truth for the default columns to be displayed for each table.
 * This is the ONLY place you need to manually list column names.
 * TypeScript validates this entire object.
 */
export const TABLE_COLUMN_KEYS: AllColumnKeys = {
  // We list all keys for each table here.
  user_profiles: ["id", "first_name", "last_name", "phone_number", "role", "designation", "status", "avatar_url", "date_of_birth", "address", "preferences", "created_at", "updated_at"],
  lookup_types: ["id", "category", "name", "code", "description", "sort_order", "status", "is_system_default", "created_at", "updated_at"],
  maintenance_areas: ["id", "code", "name", "address", "email", "contact_person", "contact_number", "latitude", "longitude", "area_type_id", "parent_id", "status", "created_at", "updated_at"],
  employee_designations: ["id", "name", "parent_id", "status", "created_at", "updated_at"],
  employees: ["id", "employee_pers_no", "employee_name", "employee_email", "employee_dob", "employee_doj", "employee_contact", "employee_addr", "employee_designation_id", "maintenance_terminal_id", "status", "remark", "created_at", "updated_at"],
  rings: ["id", "name", "description", "ring_type_id", "maintenance_terminal_id", "total_nodes", "status", "created_at", "updated_at"],
  nodes: [
    "id",
    "name",
    "ip_address",
    "ring_id",
    "node_type_id",
    "site_id",
    "maintenance_terminal_id",
    "latitude",
    "longitude",
    "order_in_ring",
    "vlan",
    "builtup",
    "east_port",
    "west_port",
    "ring_status",
    "status",
    "remark",
    "created_at",
    "updated_at",
  ],
  ofc_cables: ["id", "route_name", "starting_node_id", "ending_node_id", "capacity", "ofc_type_id", "asset_no", "transnet_id", "transnet_rkm", "current_rkm", "maintenance_terminal_id", "commissioned_on", "status", "remark", "created_at", "updated_at"],
  systems: ["id", "system_name", "node_id", "system_type_id", "ip_address", "maintenance_terminal_id", "commissioned_on", "status", "remark", "created_at", "updated_at"],
  ofc_connections: ["id", "node_a_id", "node_b_id", "ofc_id", "system_a_id", "system_b_id", "fiber_no_ea", "fiber_no_eb", "ea_dom", "eb_dom", "otdr_distance_ea_km", "otdr_distance_eb_km", "status", "remark", "created_at", "updated_at"],
  maan_connections: ["system_connection_id", "customer_name", "bandwidth_allocated_mbps", "sfp_type_id", "sfp_capacity", "sfp_serial_no", "sfp_port", "fiber_in", "fiber_out"],
  maan_systems: ["system_id", "area", "ring_no"],
  cpan_systems: ["system_id", "area", "ring_no"],
  cpan_connections: ["system_connection_id", "customer_name", "bandwidth_allocated_mbps", "sfp_type_id", "sfp_capacity", "sfp_serial_no", "sfp_port", "fiber_in", "fiber_out"],
  management_ports: ["id", "name", "port_no", "commissioned_on", "node_id", "system_id", "status", "remark", "created_at", "updated_at"],

  sdh_connections: ["system_connection_id", "stm_no", "carrier", "a_customer", "a_slot", "b_customer", "b_slot"],
  sdh_node_associations: ["id", "sdh_system_id", "node_id", "node_position", "node_ip"],
  sdh_systems: ["system_id", "make", "gne"],
  system_connections: [
    "id",
    "system_id",
    "node_a_id",
    "node_b_id",
    "connected_system_id",
    "media_type_id",
    "ea_interface",
    "eb_interface",
    "ea_ip",
    "eb_ip",
    "vlan",
    "bandwidth_mbps",
    "commissioned_on",
    "status",
    "remark",
    "created_at",
    "updated_at",
  ],
  vmux_connections: ["system_connection_id", "subscriber", "channel", "c_code", "tk"],
  vmux_systems: ["system_id", "vm_id"],
  // ===== FIX: DEFINE THE COLUMNS FOR YOUR VIEW =====
  v_ofc_cables_complete: [
    // From ofc_cables table
    "id",
    "route_name",
    "starting_node_id",
    "ending_node_id",
    "ofc_type_id",
    "capacity",
    "current_rkm",
    "transnet_id",
    "transnet_rkm",
    "asset_no",
    "maintenance_terminal_id",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",

    // From lookup_types (OFC type)
    "ofc_type_name",
    "ofc_type_code",

    // From maintenance_areas
    "maintenance_area_name",
    "maintenance_area_code",
  ],
  v_nodes_complete: [
    "id",
    "name",
    "ip_address",
    "ring_id",
    "node_type_id",
    "site_id",
    "maintenance_terminal_id",
    "latitude",
    "longitude",
    "order_in_ring",
    "vlan",
    "builtup",
    "east_port",
    "west_port",
    "status",
    "remark",
    "created_at",
    "updated_at",

    // Extra fields from the joins
    "ring_name",
    "ring_type_id",
    "node_type_name",
    "node_type_code",
    "ring_type_name",
    "ring_type_code",
    "maintenance_area_name",
    "maintenance_area_code",
    "maintenance_area_type_name",
  ],
  v_ofc_connections_complete: [
    // From ofc_connections table
    "id",
    "ofc_id",

    // From ofc_cables join
    "ofc_route_name",

    // From lookup_types (OFC type)
    "ofc_type_name",

    // Node A details
    "node_a_name",
    "fiber_no_ea",
    "otdr_distance_ea_km",
    "ea_dom",
    "system_a_name",

    // Node B details
    "node_b_name",
    "fiber_no_eb",
    "otdr_distance_eb_km",
    "eb_dom",
    "system_b_name",

    // Common fields
    "remark",
    "status",
    "created_at",
    "updated_at",
  ],
  v_system_connections_complete: [
    // From system_connections table
    "id",
    "system_id",

    // From systems join
    "system_name",

    // From lookup_types (system type)
    "system_type_name",

    // From nodes
    "node_a_name",
    "node_b_name",

    // Connection details
    "ea_ip",
    "ea_interface",
    "eb_ip",
    "eb_interface",

    // From lookup_types (media type)
    "media_type_name",

    // From system_connections
    "bandwidth_mbps",

    // Connected system details
    "connected_system_name",
    "connected_system_type_name",

    // VLAN and commissioning
    "vlan",
    "commissioned_on",

    // Common info
    "remark",
    "status",
    "created_at",
    "updated_at",

    // MAAN-specific fields
    "maan_sfp_port",
    "maan_sfp_type_name",
    "maan_sfp_capacity",
    "maan_sfp_serial_no",
    "maan_fiber_in",
    "maan_fiber_out",
    "maan_customer_name",
    "maan_bandwidth_allocated_mbps",

    // SDH-specific fields
    "sdh_stm_no",
    "sdh_carrier",
    "sdh_a_slot",
    "sdh_a_customer",
    "sdh_b_slot",
    "sdh_b_customer",

    // VMUX-specific fields
    "vmux_subscriber",
    "vmux_c_code",
    "vmux_channel",
    "vmux_tk",
  ],
  v_systems_complete: [
    // From systems table
    "id",
    "system_name",
    "ip_address",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",

    // From nodes join
    "node_name",
    "latitude",
    "longitude",
    "node_ip",

    // From lookup_types (system type)
    "system_type_name",
    "system_type_code",
    "system_category",

    // From maintenance_areas
    "maintenance_area_name",

    // MAAN-specific fields (from maan_systems)
    "maan_ring_no",
    "maan_area",

    // SDH-specific fields (from sdh_systems)
    "sdh_gne",
    "sdh_make",

    // VMUX-specific fields (from vmux_systems)
    "vmux_vm_id",
  ],
  v_user_profiles_extended: [
    // From auth.users
    "id",
    "email",
    "last_sign_in_at",
    "created_at",
    "is_super_admin",
    "is_email_verified",

    // From user_profiles
    "first_name",
    "last_name",
    "avatar_url",
    "phone_number",
    "date_of_birth",
    "address",
    "preferences",
    "role",
    "designation",
    "updated_at",
    "status",

    // From auth.users (again)
    "email_confirmed_at",
    "phone_confirmed_at",
    "is_phone_verified",
    "auth_updated_at",
    "raw_user_meta_data",
    "raw_app_meta_data",

    // Computed / derived fields
    "full_name",
    "computed_status",
    "account_age_days",
    "last_activity_period",
  ],
};
