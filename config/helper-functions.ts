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

/**
 * Generates a smart code from a name based on practical rules.
 * - Multi-word: "Base Transceiver Station" -> "BTS"
 * - Single long word: "Exchange" -> "EXC"
 * - Single short word: "Node" -> "NODE"
 * - Handles hyphens: "Point-to-Point" -> "PTP"
 * @param name The input string.
 * @returns The generated uppercase code.
 */
export function generateCodeFromName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';

  // Clean up and split by spaces, underscores, or hyphens
  const words = name
    .trim()
    .split(/[\s_-]+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return '';
  }

  // Case 1: Multiple words -> create an acronym
  if (words.length > 1) {
    return words
      .map(word => word.charAt(0))
      .join('')
      .toLowerCase();
  }

  // Case 2: A single word
  const singleWord = words[0];

  // If the word is short (like an existing acronym), use the whole word.
  if (singleWord.length <= 4) {
    return singleWord.toLowerCase();
  }

  // If it's a longer word, create a 3-letter abbreviation.
  return singleWord.substring(0, 3).toLowerCase();
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

/**
 * Dynamically calculates the width of a column based on its content.
 * 
 * @param columnName - The name of the column
 * @param rows - The table data (array of objects from Supabase)
 * @param ctx - Optional CanvasRenderingContext2D for measuring text width
 * @returns A number representing the width in pixels (capped at 300px)
 */
export function inferDynamicColumnWidth(
  columnName: string,
  rows: Record<string, any>[],
  ctx?: CanvasRenderingContext2D
): number {
  const MIN_WIDTH = 120;
  const MAX_WIDTH = 400;
  const PADDING = 32; // left + right cell padding
  
  // fallback font if no canvas context provided
  if (!ctx) {
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d")!;
    ctx.font = "14px Inter, sans-serif"; // match your table CSS font
  }

  // measure header
  let maxWidth = ctx.measureText(columnName).width;

  // measure each row cell
  for (const row of rows) {
    const value = row[columnName];
    if (value == null) continue;
    const text = String(value);
    const width = ctx.measureText(text).width;
    if (width > maxWidth) {
      maxWidth = width;
    }
  }

  // add padding and clamp
  return Math.min(Math.max(Math.ceil(maxWidth) + PADDING, MIN_WIDTH), MAX_WIDTH);
}