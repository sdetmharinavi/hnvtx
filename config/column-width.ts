// ... (keep the other functions and types in this file)

/**
 * A centralized constant for default column widths based on common patterns.
 * This makes the width logic easy to view and modify in one place.
 * All values are explicit pixel widths to ensure consistent layouts.
 */
const COLUMN_WIDTHS: Record<string, number> = {
  // --- Specific & Exact Column Names ---
  id: 290,
  status: 100,
  role: 120,
  email: 240,
  address: 300,
  avatar_url: 80,
  ip_address: 150,
  vlan: 100,
  site_id: 120,
  
  // --- By Suffix ---
  _id: 290,
  _at: 160,     // for created_at, updated_at
  _on: 160,     // for commissioned_on
  _dob: 120,     // for date_of_birth
  _doj: 120,     // for date_of_joining
  _url: 250,

  // --- By Prefix ---
  is_: 120,     // for is_active, is_default
  has_: 120,    // for has_children
  can_: 120,     // for can_edit

  // --- By Keyword Inclusion (broadest match) ---
  name: 250, // Catches first_name, last_name, system_name, etc.
  title: 250,
  phone: 150,
  mobile: 150,
  contact: 150,
  date: 160,
  time: 160,
  description: 300,
  content: 300,
  note: 300,
  remark: 300,
  comment: 300,
  message: 300,
  link: 250,
  designation: 200,
  category: 180,
  type: 180,
  code: 120,
  port: 120, // east_port, west_port
  
  // --- Numeric Types ---
  amount: 150,
  price: 150,
  total: 150,
  count: 120,
  quantity: 120,
  number: 150,
  rkm: 120,
  mbps: 120,
  latitude: 150,
  longitude: 150,
  capacity: 120,
  order: 120, // for order_in_ring
};

/**
 * A fallback default width for any column that doesn't match a specific pattern.
 */
const DEFAULT_COLUMN_WIDTH = 180;

/**
 * Infers appropriate column width based on column name patterns
 * by checking against a centralized constant. Returns a fixed pixel width.
 * @param columnName The name of the column.
 * @returns A number representing the width in pixels.
 */
export function inferColumnWidth(columnName: string): number {
  const name = columnName.toLowerCase();

  // 1. Check for an exact match in the constants (most specific)
  if (name in COLUMN_WIDTHS) {
    return COLUMN_WIDTHS[name];
  }

  // 2. Check for matching suffixes (e.g., _id, _at)
  for (const suffix in COLUMN_WIDTHS) {
    if (suffix.startsWith('_') && name.endsWith(suffix)) {
      return COLUMN_WIDTHS[suffix];
    }
  }

  // 3. Check for matching prefixes (e.g., is_, has_)
  for (const prefix in COLUMN_WIDTHS) {
    if (prefix.endsWith('_') && name.startsWith(prefix)) {
        return COLUMN_WIDTHS[prefix];
    }
  }

  // 4. Check for keyword inclusion (least specific)
  // We sort keywords by length descending to match longer keywords first (e.g., "phone_number" before "number")
  const keywords = Object.keys(COLUMN_WIDTHS)
    .filter(k => !k.startsWith('_') && !k.endsWith('_'))
    .sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (name.includes(keyword)) {
      return COLUMN_WIDTHS[keyword];
    }
  }

  // 5. Default to a fixed width if no specific rule matches
  return DEFAULT_COLUMN_WIDTH;
}