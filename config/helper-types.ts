// config/helpers.ts

import { Database, Tables } from "@/types/supabase-types";
import { TABLES, VIEWS } from "@/config/table-column-keys";

// Database schema types
export type ViewName = keyof Database["public"]["Views"];
export type TableName = keyof Database["public"]["Tables"];

export type TableNames = keyof typeof TABLES;
export type ViewNames = keyof typeof VIEWS;

export type TableOrViewName = TableName | ViewName;

export type CurrentTableName = keyof typeof TABLES;

// A generic Row type helper that works for both tables and views
export type GenericRow<T extends TableOrViewName> = T extends TableName
  ? Tables<T>
  : T extends ViewName
  ? Database["public"]["Views"][T]["Row"]
  : never;

// This Mapped Type now correctly includes both Tables and Views.
export type AllColumnKeys = {
  [K in TableName]: (keyof Tables<K> & string)[];
} & {
  // Add a mapped type for Views. This merges the view keys into the type.
  [K in ViewName]: (keyof Database["public"]["Views"][K]["Row"] & string)[];
};



export type ExcelFormat =
  | "text"
  | "number"
  | "date"
  | "currency"
  | "percentage";
export type ColumnTransform = (value: unknown) => unknown;

export type ColumnMeta = {
  title?: string;
  excelHeader?: string;
  excelFormat?: ExcelFormat;
  transform?: ColumnTransform;
};

export type TableMetaMap = {
  [K in TableName]?: Partial<Record<keyof Tables<K> & string, ColumnMeta>>;
};

export type UploadTableMeta<T extends TableName> = {
  uploadType: "insert" | "upsert";
  conflictColumn?: keyof Tables<T> & string;
  isUploadEnabled?: boolean;
};

export type UploadMetaMap = {
  [K in TableName]?: UploadTableMeta<K>;
};

// export function toTitleCase(str: string): string {
//   return str
//     .replace(/_/g, " ")
//     .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
// }




