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
    const dmYTime =
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
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

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function inferExcelFormat(
  columnName: string
): "text" | "number" | "date" | "currency" | "percentage" | "json" {
  const name = columnName.toLowerCase();
  if (
    name.endsWith("_at") ||
    name.endsWith("_on") ||
    name.endsWith("dob") ||
    name.endsWith("doj") ||
    name.includes("date")
  )
    return "date";
  if (
    name.includes("amount") ||
    name.includes("price") ||
    name.includes("total") ||
    name.includes("rkm") ||
    name.includes("mbps")
  )
    return "number";
  if (name.includes("percent")) return "percentage";
  // common JSON-like columns
  if (
    name.includes("address") ||
    name.includes("preference") ||
    name.includes("metadata") ||
    name.includes("meta_data") ||
    name.includes("raw_user_meta_data") ||
    name.includes("raw_app_meta_data") ||
    name.endsWith("_json") ||
    name.includes("json")
  )
    return "json";
  return "text";
}

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
