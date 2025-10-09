// types/user-roles.ts

import { Json } from "@/types/supabase-types";
import z from "zod";

export enum UserRole {
    ADMIN = "admin",
    CPANADMIN = "cpan_admin",
    MAANADMIN = "maan_admin",
    SDHADMIN = "sdh_admin",
    ASSETADMIN = "asset_admin",
    MNGADMIN = "mng_admin",
    VIEWER = "viewer",
    AUTHENTICATED = "authenticated",
    ANON = "anon",
}