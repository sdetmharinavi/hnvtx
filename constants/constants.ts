import { UserRole } from "@/types/user-roles";

export const DEFAULTS = {
  DEBOUNCE_DELAY: 400,
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100, 500],
};

export const allowedRoles = [
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.MNGADMIN,
  ]
