// config/permissions.ts
import { UserRole } from "@/types/user-roles";

// A virtual role that no user actually has. 
// Used to trigger the `isSuperAdmin` bypass in `UserProvider`.
const SUPER_ADMIN_LOCK = "__SUPER_ADMIN_ONLY__";

// Role Groups
export const ROLES = {
  // STRICTLY Super Admin (is_super_admin = true)
  // Regular admins will fail this check.
  SUPER_ADMIN: [SUPER_ADMIN_LOCK],
  
  // High Level Admins (Regular Admin Role + Specific Admins)
  ADMINS: [
    UserRole.ADMIN,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.MNGADMIN
  ],

  // System Specific Admins
  SYSTEM_ADMINS: [
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN
  ],

  // Read Access (Everyone logged in)
  VIEWERS: [
    UserRole.ADMIN,
    UserRole.VIEWER,
    UserRole.AUTHENTICATED,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
    UserRole.MNGADMIN
  ],
  
  // Specific Features
  INVENTORY_MANAGERS: [
    UserRole.ADMIN, 
    UserRole.ASSETADMIN
  ],
  
  EMPLOYEE_MANAGERS: [
    UserRole.ADMIN
  ]
};

export const PERMISSIONS = {
  canManageUsers: ROLES.SUPER_ADMIN, // Only Super Admins can delete users/manage roles
  canManageEmployees: ROLES.EMPLOYEE_MANAGERS,
  canManageInventory: ROLES.INVENTORY_MANAGERS,
  canManageSystems: ROLES.ADMINS,
  canManageRoutes: ROLES.ADMINS,
  canViewDashboard: ROLES.VIEWERS,
  canViewDocs: ROLES.VIEWERS,
  canExportData: ROLES.ADMINS,
  canDeleteCritical: ROLES.SUPER_ADMIN,
};