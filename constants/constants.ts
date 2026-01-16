import { UserRole } from '@/types/user-roles';

export const DEFAULTS = {
  DEBOUNCE_DELAY: 600,
  PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 50, 100, 500, 1000, 4000, 6000],
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
};

export const allowedRoles = [
  UserRole.ADMINPRO,
  UserRole.ADMIN,
  UserRole.CPANADMIN,
  UserRole.MAANADMIN,
  UserRole.SDHADMIN,
  UserRole.ASSETADMIN,
  UserRole.VIEWER,
  UserRole.AUTHENTICATED,
];
