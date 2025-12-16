// config/permissions.ts
import { UserRole } from "@/types/user-roles";

// Role Groups
export const ROLES = {
  // Full Access
  SUPER_ADMIN: [UserRole.ADMIN] as UserRole[],
  
  // High Level Admins
  ADMINS: [
    UserRole.ADMIN,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.MNGADMIN
  ] as UserRole[],

  // System Specific Admins
  SYSTEM_ADMINS: [
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN
  ] as UserRole[],

  // Read Access
  VIEWERS: [
    UserRole.ADMIN,
    UserRole.VIEWER,
    UserRole.AUTHENTICATED,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.MNGADMIN
  ] as UserRole[],
  
  // Specific Features
  INVENTORY_MANAGERS: [
    UserRole.ADMIN, 
    UserRole.ASSETADMIN
  ] as UserRole[],
  
  EMPLOYEE_MANAGERS: [
    UserRole.ADMIN
  ] as UserRole[]
} as const;

export const PERMISSIONS = {
  canManageUsers: ROLES.SUPER_ADMIN,
  canManageEmployees: ROLES.EMPLOYEE_MANAGERS,
  canManageInventory: ROLES.INVENTORY_MANAGERS,
  canManageSystems: ROLES.ADMINS,
  canManageRoutes: ROLES.ADMINS,
  canViewDashboard: ROLES.VIEWERS,
  canViewDocs: ROLES.VIEWERS,
  canExportData: ROLES.VIEWERS, // Usually viewers can export, restrict if needed
  canDeleteCritical: ROLES.SUPER_ADMIN,
} as const;