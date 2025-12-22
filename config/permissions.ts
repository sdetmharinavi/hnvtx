// config/permissions.ts
import { UserRole } from '@/types/user-roles';

// A virtual role identifier for Super Admin only logic.
// No user has this role in the DB; it triggers the bypass check in UserProvider.
export const SUPER_ADMIN_LOCK = '__SUPER_ADMIN_ONLY__';

// Role Groups Definitions
export const ROLES = {
  // STRICTLY Super Admin (is_super_admin = true)
  SUPER_ADMIN: [SUPER_ADMIN_LOCK],

  PROADMINS: [UserRole.ADMINPRO, SUPER_ADMIN_LOCK],

  // High Level Admins (Super Admin + Regular Admin)
  ADMINS: [
    UserRole.ADMINPRO,
    UserRole.ADMIN,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
  ],

  // System Specific Admins
  SYSTEM_ADMINS: [UserRole.ADMINPRO, UserRole.CPANADMIN, UserRole.MAANADMIN, UserRole.SDHADMIN],

  // Read Access (Everyone logged in)
  VIEWERS: [
    UserRole.ADMINPRO,
    UserRole.ADMIN,
    UserRole.VIEWER,
    UserRole.AUTHENTICATED,
    UserRole.CPANADMIN,
    UserRole.MAANADMIN,
    UserRole.SDHADMIN,
    UserRole.ASSETADMIN,
  ],

  // Specific Functional Groups
  INVENTORY_MANAGERS: [UserRole.ADMINPRO, UserRole.ADMIN, UserRole.ASSETADMIN],

  EMPLOYEE_MANAGERS: [UserRole.ADMINPRO, UserRole.ADMIN],

  ROUTE_MANAGERS: [UserRole.ADMINPRO, UserRole.ADMIN, UserRole.ASSETADMIN],
} as const;

// Feature-based Permissions Mapping
export const PERMISSIONS = {
  // User Management
  canManageUsers: ROLES.PROADMINS,
  canViewAuditLogs: ROLES.PROADMINS,

  // Entity Management
  canManageEmployees: ROLES.EMPLOYEE_MANAGERS,
  canManageInventory: ROLES.INVENTORY_MANAGERS,

  // Network Management
  canManageSystems: ROLES.ADMINS,
  canManageRoutes: ROLES.ROUTE_MANAGERS,

  // General
  canViewDashboard: ROLES.VIEWERS,
  canViewDocs: ROLES.VIEWERS,
  canExportData: ROLES.ADMINS,

  // Dangerous Actions
  canDeleteCritical: ROLES.PROADMINS,
} as const;
