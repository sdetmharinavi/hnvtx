// path: config/helper-functions.ts

// Helper: normalize various Excel/CSV date representations to 'YYYY-MM-DD' or null
export const toPgDate = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const v = value.trim();
    if (v === "") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
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
    const dmYTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = v.match(dmYTime);
    if (match) {
      const d1 = parseInt(match[1], 10);
      const d2 = parseInt(match[2], 10);
      const yyyy = parseInt(match[3], 10);
      const isDMY = d1 > 12 || (d2 <= 12 && d1 <= 12);
      const dd = String(isDMY ? d1 : d2).padStart(2, "0");
      const mm = String(isDMY ? d2 : d1).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }
  if (typeof value === "number") {
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
  if (value instanceof Date && !isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function generateCodeFromName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/[\s_-]+/).filter(word => word.length > 0);
  if (words.length === 0) return '';
  if (words.length > 1) return words.map(word => word.charAt(0)).join('').toLowerCase();
  const singleWord = words[0];
  if (singleWord.length <= 4) return singleWord.toLowerCase();
  return singleWord.substring(0, 3).toLowerCase();
}

export function inferExcelFormat(
  columnName: string
): "text" | "number" | "integer" | "date" | "currency" | "percentage" | "json" {
  const name = columnName.toLowerCase();
  if (/\bdate\b|_on$|_at$|dob$|doj$/.test(name)) return "date";
  if (name.endsWith("_no") || name.endsWith("_count") || name === 'capacity' || name === 'segment_order' || name === 'path_segment_order') return "integer";
  if (name.includes("amount") || name.includes("price") || name.includes("total") || name.includes("rkm") || name.includes("mbps")) return "number";
  if (name.includes("percent")) return "percentage";
  if (name.includes("address") || name.includes("preference") || name.includes("metadata") || name.includes("meta_data") || name.includes("raw_user_meta_data") || name.includes("raw_app_meta_data") || name.endsWith("_json") || name.includes("json")) return "json";
  return "text";
}

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

export function inferDynamicColumnWidth<T extends Record<string, unknown>>(
  columnName: string,
  rows: T[],
  ctx?: CanvasRenderingContext2D
): number {
  const MIN_WIDTH = 120;
  const MAX_WIDTH = 400;
  const PADDING = 32;

  if (!ctx) {
    if (typeof document === 'undefined') return MIN_WIDTH; // Return a default width in non-browser environments
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d")!;
    if (!ctx) return MIN_WIDTH;
    ctx.font = "14px Inter, sans-serif";
  }

  let maxWidth = ctx.measureText(columnName).width;

  for (const row of rows) {
    const value = row[columnName];
    if (value == null) continue;
    const text = String(value);
    const width = ctx.measureText(text).width;
    if (width > maxWidth) {
      maxWidth = width;
    }
  }

  return Math.min(Math.max(Math.ceil(maxWidth) + PADDING, MIN_WIDTH), MAX_WIDTH);
}