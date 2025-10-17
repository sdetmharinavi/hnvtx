// config/helpers.ts

import { Database, Tables } from "@/types/supabase-types";
import { TABLES, VIEWS } from "@/constants/table-column-keys";
import { PublicTableName, Row, ViewName } from "@/hooks/database";

// Database schema types

export type TableNames = keyof typeof TABLES;
export type ViewNames = keyof typeof VIEWS;
export type CurrentTableName = keyof typeof TABLES;

// This Mapped Type now correctly includes both Tables and Views.
export type AllColumnKeys = {
  [K in PublicTableName]: (keyof Tables<K> & string)[];
} & {
  // Add a mapped type for Views. This merges the view keys into the type.
  [K in ViewName]: (keyof Database["public"]["Views"][K]["Row"] & string)[];
};



export type ExcelFormat =
  | "text"
  | "number"
  | "integer"
  | "date"
  | "currency"
  | "percentage"
  | "json";
export type ColumnTransform = (value: unknown) => unknown;

export type ColumnMeta = {
  title?: string;
  excelHeader?: string;
  excelFormat?: ExcelFormat;
  transform?: ColumnTransform;
};

// export type TableMetaMap = {
//   [K in PublicTableName]?: Partial<Record<keyof Tables<K> & string, ColumnMeta>>;
// };
// THE FIX: Allow TableMetaMap to accept view names as keys.
export type TableMetaMap = {
  [K in keyof (Database['public']['Tables'] & Database['public']['Views'])]?: Partial<Record<keyof Row<K> & string, ColumnMeta>>;
};

export type UploadTableMeta<T extends PublicTableName> = {
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof Tables<T> & string;
  isUploadEnabled?: boolean;
};

export type UploadMetaMap = {
  [K in PublicTableName]?: UploadTableMeta<K>;
};




