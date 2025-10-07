// types/user-roles.ts

import { Json } from "@/types/supabase-types";
import z from "zod";

export enum UserRole {
    ADMIN = "admin",
    CPANADMIN = "cpan_admin",
    MAANADMIN = "maan_admin",
    SDHADMIN = "sdh_admin",
    VMUXADMIN = "vmux_admin",
    MNGADMIN = "mng_admin",
    VIEWER = "viewer",
    AUTHENTICATED = "authenticated",
    ANON = "anon",
}

export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(z.string(), JsonSchema),
  ])
);