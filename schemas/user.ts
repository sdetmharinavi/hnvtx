// =================================================================
// USER MANAGEMENT
// =================================================================

import z from "zod";

export const userProfileSchema = z.object({
  id: z.uuid().optional(),
  first_name: z.string().min(1, { message: "First name cannot be empty." }).nullable(),
  last_name: z.string().min(1, { message: "Last name cannot be empty." }).nullable(),
  avatar_url: z.url({ message: "Invalid URL format." })
    .optional()
    .or(z.literal("")).nullable(),
  phone_number: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  date_of_birth: z.coerce
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => !date || (date > new Date("1900-01-01") && date < new Date()),
      {
        message: "Please enter a valid date of birth.",
      }
    ),
  role: z
    .enum([
      "admin",
      "viewer",
      "cpan_admin",
      "maan_admin",
      "sdh_admin",
      "vmux_admin",
      "mng_admin",
    ])
    .default("viewer"),
  designation: z.string().optional().nullable(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip_code: z.string().optional(),
      country: z.string().optional(),
    })
    .default({})
    .optional().nullable(),
  preferences: z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
  })
  .default({})
  .optional().nullable(),
  status: z.enum(["active", "inactive", "suspended"]).default("inactive"),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

