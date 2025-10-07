// Configuration for smart Zod validation rules
export interface ValidationConfig {
  stringRules: StringValidationRule[];
  numberRules: NumberValidationRule[];
  customRules: CustomValidationRule[];
}

export interface StringValidationRule {
  fieldPatterns: string[]; // Field names that match this rule (supports regex)
  validation: string; // Zod validation string
  description?: string;
}

export interface NumberValidationRule {
  fieldPatterns: string[];
  validation: string;
  description?: string;
}

export interface CustomValidationRule {
  fieldName: string; // Exact field name
  tableName?: string; // Supports partial matching (e.g., "user" matches "user_profiles")
  validation: string;
  description?: string;
}

export const defaultValidationConfig: ValidationConfig = {
  stringRules: [
    {
      fieldPatterns: ["email"],
      validation: "z.email()",
      description: "Email format validation",
    },
    {
      fieldPatterns: ["encrypted_password"],
      validation: 'z.string().min(1, "Password cannot be empty")',
      description: "Passwords just need presence check",
    },
    {
      fieldPatterns: ["password", "pwd"],
      validation: `z.string()
        .min(6, "Password must be at least 6 characters long")
        .max(50, "Password must not exceed 50 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
        )`,
      description: "Basic password strength",
    },
    {
      fieldPatterns: ["^id$", ".*_id$", ".*uuid.*"],
      validation: "z.uuid()",
      description: "UUID format validation",
    },
    {
      fieldPatterns: ["url", "website", "link"],
      validation: "z.url()",
      description: "URL format validation",
    },
    {
      fieldPatterns: ["phone", "mobile", "tel"],
      validation: 'z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number")',
      description: "International phone number format",
    },
    {
      fieldPatterns: ['date_of_birth', '.*dob.*', '.*doj.*', 'commissioned_on', "sn_dom", "en_dom"],
      validation: 'z.iso.date()',
      description: 'ISO date string validation (e.g., YYYY-MM-DD)',
    },
    {
      fieldPatterns: [".*_at$", ".*date.*", ".*time.*"],
      validation: "z.iso.datetime()",
      description: "ISO datetime string validation",
    },
    {
      fieldPatterns: ["token", "jwt"],
      validation: "z.jwt()",
      description: "Token presence validation",
    },
    {
      fieldPatterns: ["slug"],
      validation: 'z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")',
      description: "URL-friendly slug format",
    },
    {
      fieldPatterns: ["username", "user_name"],
      validation: 'z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")',
      description: "Username format validation",
    },
    {
      fieldPatterns: [".*name$", "title"],
      validation: 'z.string().min(1, "Name cannot be empty").max(255, "Name is too long")',
      description: "Name fields validation",
    },
    {
      fieldPatterns: ["description", "content", "text", "message"],
      validation: 'z.string().max(10000, "Text is too long")',
      description: "Long text fields validation",
    },
    {
      fieldPatterns: [".*address.*", ".*addr.*"],
      validation: 'z.string().min(5, "Address must be at least 5 characters").max(500)',
      description: "Address fields validation",
    },
    {
      fieldPatterns: ["ip.*", ".*ip_address.*"],
      validation: "z.ipv4()",
      description: "IP address format validation",
    },
    {
      fieldPatterns: ["status"],
      validation: 'z.string().min(1, "Status cannot be empty")',
      description: "Status fields validation",
    },
  ],

  numberRules: [
    {
      fieldPatterns: ["age"],
      validation: "z.number().int().min(0).max(150)",
      description: "Age validation",
    },
    {
      fieldPatterns: ["count", "quantity", "qty"],
      validation: "z.number().int().min(0)",
      description: "Count/quantity validation",
    },
    {
      fieldPatterns: ["price", "amount", "cost", "fee"],
      validation: "z.number().min(0)",
      description: "Monetary amount validation",
    },
    {
      fieldPatterns: ["rating", "score"],
      validation: "z.number().min(0).max(10)",
      description: "Rating/score validation",
    },
    {
      fieldPatterns: ["percent.*", ".*_rate$"],
      validation: "z.number().min(0).max(100)",
      description: "Percentage validation",
    },
    {
      fieldPatterns: ["^id$", ".*_id$"],
      validation: "z.number().int().positive()",
      description: "Numeric ID validation",
    },
  ],

  customRules: [
    {
      fieldName: "aud",
      tableName: "user", // Will match "user_profiles", "users", etc.
      validation: "z.string().min(1)",
      description: "Supabase auth audience field",
    },
    {
      fieldName: "role",
      tableName: "user", // Will match "user_profiles", "users", etc.
      validation: "z.nativeEnum(UserRole)",
      description: "User role field using native enum",
    },
    {
      fieldName: "transnet_id",
      tableName: "ofc_cables",
      // Provide only the base type. The script will add .nullable()
      validation: "z.string()",
      description: "Transnet ID is a nullable string",
    },
    {
      fieldName: "updated_sn_name",
      tableName: "v_ofc_connections_complete",
      // Provide only the base type. The script will add .nullable()
      validation: "z.string()",
      description: "String type, not datetime",
    },
    {
      fieldName: "updated_en_name",
      tableName: "v_ofc_connections_complete",
      // Provide only the base type. The script will add .nullable()
      validation: "z.string()",
      description: "String type, not datetime",
    },
  ],
};

export function loadValidationConfig(): ValidationConfig {
  // You can load from file, environment, or database
  return defaultValidationConfig;
}
